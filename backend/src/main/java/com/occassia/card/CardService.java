package com.occassia.card;

import com.occassia.audit.AuditService;
import com.occassia.guest.Guest;
import com.occassia.guest.GuestRepository;
import com.occassia.guest.GuestService;
import com.occassia.organization.Organization;
import com.occassia.organization.OrganizationService;
import com.occassia.event.Event;
import com.occassia.shared.enums.CardStatus;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.SecurityUtils;
import com.occassia.shared.security.UserPrincipal;
import com.occassia.shared.nfc.NfcUid;
import com.occassia.card.dto.CardRegisterRequest;
import com.occassia.card.dto.CardResponse;
import com.occassia.websocket.CheckInEventPublisher;
import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CardService {

    private final NfcCardRepository cardRepository;
    private final GuestRepository guestRepository;
    private final GuestService guestService;
    private final OrganizationService organizationService;
    private final AuditService auditService;
    private final CheckInEventPublisher eventPublisher;

    @Transactional
    public CardResponse register(CardRegisterRequest request) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        UserPrincipal current = SecurityUtils.currentUser();
        Organization org = organizationService.findOrThrow(current.getOrganizationId());
        Event event = guestService.getEvent(request.getEventId());
        verifyEventAccess(event);

        String uid = NfcUid.normalize(request.getUid());
        NfcCard existing = cardRepository.findById(uid).orElse(null);
        if (existing != null) {
            SecurityUtils.requireOrgAccess(existing.getOrganization().getId());
            if (existing.getEvent() != null && existing.getEvent().getId().equals(event.getId())) {
                throw new ApiException(HttpStatus.CONFLICT, "CARD_EXISTS", "Card is already registered for this event");
            }
            if (existing.getEvent() != null && eventsOverlap(existing.getEvent(), event)) {
                throw new ApiException(HttpStatus.CONFLICT, "CARD_EVENT_OVERLAP", "This card is already registered for an overlapping event (" + existing.getEvent().getName() + ")");
            }
            if (existing.getAssignedGuest() != null) {
                throw new ApiException(HttpStatus.CONFLICT, "CARD_IN_USE", "This card is still assigned to a guest and cannot be reused");
            }
            if (existing.getStatus() == CardStatus.LOST || existing.getStatus() == CardStatus.DAMAGED) {
                throw new ApiException(HttpStatus.CONFLICT, "CARD_DEACTIVATED", "This card is deactivated and cannot be registered again");
            }
            existing.setEvent(event);
            existing.setStatus(CardStatus.AVAILABLE);
            existing = cardRepository.save(existing);
            auditService.log(org, "CARD_REGISTERED_FOR_EVENT", "CARD", uid, Map.of("eventId", event.getId().toString()));
            return toResponse(existing);
        }

        NfcCard card = NfcCard.builder()
            .uid(uid)
            .organization(org)
            .event(event)
            .status(CardStatus.AVAILABLE)
            .build();
        card = cardRepository.save(card);
        auditService.log(org, "CARD_REGISTERED", "CARD", card.getUid(), null);
        return toResponse(card);
    }

    @Transactional
    public Map<String, Object> batchRegister(MultipartFile file, UUID eventId) {
        SecurityUtils.requireRole(UserRole.ADMIN);
        UserPrincipal current = SecurityUtils.currentUser();
        Organization org = organizationService.findOrThrow(current.getOrganizationId());
        Event event = guestService.getEvent(eventId);
        verifyEventAccess(event);

        int imported = 0;
        List<Map<String, Object>> errors = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            List<String[]> rows = reader.readAll();
            for (int i = 1; i < rows.size(); i++) {
                String[] row = rows.get(i);
                if (row.length == 0 || row[0].isBlank()) continue;
                try {
                    String uid = NfcUid.normalize(row[0]);
                    if (cardRepository.existsByUid(uid)) {
                        errors.add(Map.of("row", i + 1, "reason", "Card already exists: " + uid));
                        continue;
                    }
                        NfcCard card = NfcCard.builder()
                            .uid(uid)
                            .organization(org)
                            .event(event)
                            .status(CardStatus.AVAILABLE)
                            .build();
                    cardRepository.save(card);
                    imported++;
                } catch (Exception e) {
                    errors.add(Map.of("row", i + 1, "reason", e.getMessage()));
                }
            }
            int total = Math.max(0, rows.size() - 1);
            return Map.of("total", total, "imported", imported, "failed", total - imported, "errors", errors);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PARSE_ERROR", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<CardResponse> list(CardStatus status) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EVENT_MANAGER);
        UserPrincipal current = SecurityUtils.currentUser();
        UUID orgId = current.getOrganizationId();
        List<NfcCard> cards = status != null
                ? (current.getRole() == UserRole.SUPER_ADMIN
                        ? cardRepository.findAllByStatusOrderByRegisteredAtDesc(status)
                        : cardRepository.findByOrganizationIdAndStatusOrderByRegisteredAtDesc(orgId, status))
                : (current.getRole() == UserRole.SUPER_ADMIN
                        ? cardRepository.findAllByOrderByRegisteredAtDesc()
                        : cardRepository.findByOrganizationIdOrderByRegisteredAtDesc(orgId));
        return cards.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CardResponse> listForEvent(UUID eventId, CardStatus status) {
        Event event = guestService.getEvent(eventId);
        verifyEventAccess(event);
        UserPrincipal current = SecurityUtils.currentUser();
        boolean superAdmin = current.getRole() == UserRole.SUPER_ADMIN;
        List<NfcCard> cards = status == null
                ? (superAdmin ? cardRepository.findByEventIdOrderByRegisteredAtDesc(eventId) : cardRepository.findByOrganizationIdAndEventIdOrderByRegisteredAtDesc(current.getOrganizationId(), eventId))
                : (superAdmin ? cardRepository.findByEventIdAndStatusOrderByRegisteredAtDesc(eventId, status) : cardRepository.findByOrganizationIdAndEventIdAndStatusOrderByRegisteredAtDesc(current.getOrganizationId(), eventId, status));
        return cards.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CardResponse get(String uid) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        NfcCard card = findOrThrow(uid);
        SecurityUtils.requireOrgAccess(card.getOrganization().getId());
        return toResponse(card);
    }

    @Transactional
    public CardResponse updateStatus(String uid, CardStatus status) {
        SecurityUtils.requireRole(UserRole.ADMIN);
        NfcCard card = findOrThrow(uid);
        SecurityUtils.requireOrgAccess(card.getOrganization().getId());
        if (status == CardStatus.LOST && card.getAssignedGuest() != null) {
            Guest guest = card.getAssignedGuest();
            guest.setNfcCardUid(null);
            guestRepository.save(guest);
            card.setAssignedGuest(null);
            card.setAssignedAt(null);
        }
        card.setStatus(status);
        card = cardRepository.save(card);
        eventPublisher.publishCardUpdate(card);
        auditService.log(card.getOrganization(), "CARD_STATUS_CHANGED", "CARD", uid, Map.of("status", status.name()));
        return toResponse(card);
    }

    @Transactional
    public void assignToGuest(UUID guestId, String nfcUid) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Guest guest = guestService.findOrThrow(guestId);
        eventServiceVerify(guest);
        if (!guest.isConfirmed() || !guest.isPaid()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NOT_ELIGIBLE", "Guest must be confirmed and paid");
        }
        if (guest.getNfcCardUid() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_ASSIGNED", "Guest already has a card");
        }

        String canonicalUid = NfcUid.normalize(nfcUid);
        NfcCard card = findOrThrow(canonicalUid);
        SecurityUtils.requireOrgAccess(card.getOrganization().getId());
        if (card.getEvent() == null || !card.getEvent().getId().equals(guest.getEvent().getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "CARD_WRONG_EVENT", "This card is registered for a different event");
        }
        if (card.getStatus() != CardStatus.AVAILABLE) {
            throw new ApiException(HttpStatus.CONFLICT, "CARD_NOT_AVAILABLE", "Card is not available");
        }

        guest.setNfcCardUid(canonicalUid);
        guestRepository.save(guest);

        card.setStatus(CardStatus.ASSIGNED);
        card.setAssignedGuest(guest);
        card.setAssignedAt(Instant.now());
        cardRepository.save(card);

        eventPublisher.publishCardUpdate(card);
        auditService.log(card.getOrganization(), "CARD_ASSIGNED", "CARD", canonicalUid,
                Map.of("guestId", guestId.toString()));
    }

    @Transactional
    public void unassignFromGuest(UUID guestId) {
        SecurityUtils.requireRole(UserRole.ADMIN);
        Guest guest = guestService.findOrThrow(guestId);
        eventServiceVerify(guest);
        if (guest.getNfcCardUid() == null) return;

        String uid = guest.getNfcCardUid();
        NfcCard card = findOrThrow(uid);
        guest.setNfcCardUid(null);
        guestRepository.save(guest);

        card.setStatus(CardStatus.AVAILABLE);
        card.setAssignedGuest(null);
        card.setAssignedAt(null);
        cardRepository.save(card);

        eventPublisher.publishCardUpdate(card);
        auditService.log(card.getOrganization(), "CARD_UNASSIGNED", "CARD", uid, null);
    }

    @Transactional
    public void delete(String uid) {
        SecurityUtils.requireRole(UserRole.ADMIN);
        NfcCard card = findOrThrow(uid);
        SecurityUtils.requireOrgAccess(card.getOrganization().getId());
        if (card.getAssignedGuest() != null) {
            Guest guest = card.getAssignedGuest();
            guest.setNfcCardUid(null);
            guestRepository.save(guest);
        }
        cardRepository.delete(card);
        auditService.log(card.getOrganization(), "CARD_DELETED", "CARD", card.getUid(), null);
    }

    @Transactional
    public void markCheckedIn(String uid) {
        NfcCard card = findOrThrow(uid);
        card.setStatus(CardStatus.CHECKED_IN);
        cardRepository.save(card);
        eventPublisher.publishCardUpdate(card);
    }

    public NfcCard findOrThrow(String uid) {
        return cardRepository.findById(NfcUid.normalize(uid))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CARD_NOT_FOUND", "Card not registered in system"));
    }

    private void eventServiceVerify(Guest guest) {
        SecurityUtils.requireOrgAccess(guest.getEvent().getOrganization().getId());
    }

    private void verifyEventAccess(Event event) {
        SecurityUtils.requireOrgAccess(event.getOrganization().getId());
    }

    private boolean eventsOverlap(Event first, Event second) {
        return eventStart(first).isBefore(eventEnd(second)) && eventStart(second).isBefore(eventEnd(first));
    }

    private LocalDateTime eventStart(Event event) {
        return LocalDateTime.of(event.getStartDate() != null ? event.getStartDate() : event.getEventDate(), event.getStartTime() != null ? event.getStartTime() : LocalTime.MIN);
    }

    private LocalDateTime eventEnd(Event event) {
        return LocalDateTime.of(event.getEndDate() != null ? event.getEndDate() : event.getEventDate(), event.getEndTime() != null ? event.getEndTime() : LocalTime.MAX);
    }

    private CardResponse toResponse(NfcCard card) {
        return CardResponse.builder()
                .uid(card.getUid())
                .organizationId(card.getOrganization().getId())
                .eventId(card.getEvent() != null ? card.getEvent().getId() : null)
                .status(card.getStatus())
                .assignedGuestId(card.getAssignedGuest() != null ? card.getAssignedGuest().getId() : null)
                .assignedGuestName(card.getAssignedGuest() != null ? card.getAssignedGuest().getFullName() : null)
                .registeredAt(card.getRegisteredAt())
                .assignedAt(card.getAssignedAt())
                .build();
    }
}
