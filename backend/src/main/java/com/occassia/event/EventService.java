package com.occassia.event;

import com.occassia.audit.AuditService;
import com.occassia.guest.GuestRepository;
import com.occassia.organization.Organization;
import com.occassia.organization.OrganizationService;
import com.occassia.shared.enums.EventStatus;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.SecurityUtils;
import com.occassia.shared.security.UserPrincipal;
import com.occassia.event.dto.EventRequest;
import com.occassia.event.dto.EventResponse;
import com.occassia.user.User;
import com.occassia.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final OrganizationService organizationService;
    private final UserService userService;
    private final GuestRepository guestRepository;
    private final AuditService auditService;

    @Transactional
    public EventResponse create(EventRequest request) {
        SecurityUtils.requireRole(UserRole.ADMIN);
        UserPrincipal current = SecurityUtils.currentUser();
        Organization org = organizationService.findOrThrow(current.getOrganizationId());
        User creator = userService.findOrThrow(current.getId());

        java.time.LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : request.getEventDate();
        java.time.LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : startDate;

        Event event = Event.builder()
                .organization(org)
                .name(request.getName())
                .type(request.getType())
                .venue(request.getVenue())
                .eventDate(startDate)
                .startDate(startDate)
                .endDate(endDate)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(EventStatus.DRAFT)
                .createdBy(creator)
                .build();
        event = eventRepository.save(event);
        auditService.log(org, "EVENT_CREATED", "EVENT", event.getId().toString(), Map.of("name", event.getName()));
        return toResponse(event);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> listForOrg() {
        UserPrincipal current = SecurityUtils.currentUser();
        if (current.getRole() == UserRole.SUPER_ADMIN) {
            // SUPER_ADMIN should be able to view events across organizations
            return eventRepository.findAllByOrderByEventDateDesc().stream()
                    .map(this::toResponse).toList();
        }
        UUID orgId = current.getOrganizationId();
        if (orgId == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "No organization");
        }
        return eventRepository.findByOrganizationIdOrderByEventDateDesc(orgId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EventResponse getById(UUID id) {
        Event event = findOrThrow(id);
        verifyEventAccess(event);
        return toResponse(event);
    }

    @Transactional
    public EventResponse update(UUID id, EventRequest request) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Event event = findOrThrow(id);
        verifyEventAccess(event);
        if (event.getStatus() == EventStatus.ARCHIVED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ARCHIVED", "Cannot edit archived event");
        }
        java.time.LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : request.getEventDate();
        java.time.LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : startDate;

        event.setName(request.getName());
        event.setType(request.getType());
        event.setVenue(request.getVenue());
        event.setEventDate(startDate);
        event.setStartDate(startDate);
        event.setEndDate(endDate);
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event = eventRepository.save(event);
        auditService.log(event.getOrganization(), "EVENT_UPDATED", "EVENT", event.getId().toString(), null);
        return toResponse(event);
    }

    @Transactional
    public EventResponse updateStatus(UUID id, EventStatus newStatus) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
        Event event = findOrThrow(id);
        verifyEventAccess(event);
        validateStatusTransition(event.getStatus(), newStatus);
        event.setStatus(newStatus);
        event = eventRepository.save(event);
        auditService.log(event.getOrganization(), "EVENT_STATUS_CHANGED", "EVENT", event.getId().toString(),
                Map.of("status", newStatus.name()));
        if (newStatus == EventStatus.CLOSED && event.getCreatedBy() != null && event.getCreatedBy().getRole() != UserRole.SUPER_ADMIN) {
            guestRepository.deleteByEventId(event.getId());
            auditService.log(event.getOrganization(), "GUESTS_CLEANED_UP", "EVENT", event.getId().toString(), null);
        }
        return toResponse(event);
    }

    @Transactional
    public void delete(UUID id) {
        SecurityUtils.requireRole(UserRole.ADMIN);
        Event event = findOrThrow(id);
        verifyEventAccess(event);
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_DRAFT", "Only DRAFT events can be deleted");
        }
        eventRepository.delete(event);
        auditService.log(event.getOrganization(), "EVENT_DELETED", "EVENT", id.toString(), null);
    }

    public Event findOrThrow(UUID id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Event not found"));
    }

    public void verifyEventAccess(Event event) {
        SecurityUtils.requireOrgAccess(event.getOrganization().getId());
    }

    private void validateStatusTransition(EventStatus current, EventStatus next) {
        if (current == next) return;
        boolean valid = switch (current) {
            case DRAFT -> next == EventStatus.ACTIVE;
            case ACTIVE -> next == EventStatus.CLOSED;
            case CLOSED -> next == EventStatus.ARCHIVED;
            case ARCHIVED -> false;
        };
        if (!valid) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TRANSITION",
                    "Cannot transition from " + current + " to " + next);
        }
    }

    private EventResponse toResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .organizationId(event.getOrganization().getId())
                .name(event.getName())
                .type(event.getType())
                .venue(event.getVenue())
                .eventDate(event.getEventDate())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .status(event.getStatus())
                .createdBy(event.getCreatedBy().getId())
                .createdByName(event.getCreatedBy().getFullName())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
