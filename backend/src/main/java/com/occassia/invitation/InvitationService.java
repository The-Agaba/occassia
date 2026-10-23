package com.occassia.invitation;

import com.occassia.event.Event;
import com.occassia.event.EventRepository;
import com.occassia.guest.Guest;
import com.occassia.guest.GuestRepository;
import com.occassia.invitation.dto.BatchInviteRequest;
import com.occassia.invitation.dto.InvitationResponse;
import com.occassia.invitation.dto.RsvpRequest;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final EventRepository eventRepository;
    private final GuestRepository guestRepository;

    @Transactional(readOnly = true)
    public List<InvitationResponse> listForEvent(UUID eventId) {
        Event event = getEventAndCheckAccess(eventId);
        return invitationRepository.findByEventIdOrderByCreatedAtDesc(event.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<InvitationResponse> batchInvite(UUID eventId, BatchInviteRequest request) {
        Event event = getEventAndCheckAccess(eventId);

        List<Guest> targetGuests;
        if (request.getGuestIds() != null && !request.getGuestIds().isEmpty()) {
            targetGuests = guestRepository.findAllById(request.getGuestIds())
                    .stream()
                    .filter(g -> g.getEvent().getId().equals(eventId))
                    .collect(Collectors.toList());
        } else {
            targetGuests = guestRepository.findByEventIdOrderByFullNameAsc(eventId);
        }

        List<Invitation> savedList = new ArrayList<>();
        for (Guest guest : targetGuests) {
            Invitation invitation = invitationRepository.findFirstByEventIdAndGuestId(eventId, guest.getId())
                    .orElseGet(() -> Invitation.builder()
                            .event(event)
                            .guest(guest)
                            .token(generateToken())
                            .guestName(guest.getFullName())
                            .phoneNumber(standardizeTzPhone(guest.getPhoneNumber()))
                            .whatsappNumber(standardizeTzPhone(guest.getPhoneNumber()))
                            .build());

            invitation.setDeliveryChannel(request.getChannel());
            invitation.setDeliveryStatus("DELIVERED");
            if (request.getTemplateId() != null && !request.getTemplateId().isBlank()) {
                invitation.setTemplateId(request.getTemplateId());
            }
            if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
                invitation.setImageUrl(request.getImageUrl());
            }
            if (request.getLetterDetails() != null) {
                invitation.setLetterDetails(request.getLetterDetails());
            }

            savedList.add(invitationRepository.save(invitation));
        }

        log.info("Dispatched {} invitations for event {}", savedList.size(), eventId);
        return savedList.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvitationResponse getByToken(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVITATION_NOT_FOUND", "Invitation not found"));
        return toResponse(invitation);
    }

    @Transactional
    public InvitationResponse submitRsvp(String token, RsvpRequest request) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVITATION_NOT_FOUND", "Invitation not found"));

        String status = request.getStatus().toUpperCase();
        if (!status.equals("ATTENDING") && !status.equals("DECLINED")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATUS", "RSVP status must be ATTENDING or DECLINED");
        }

        invitation.setRsvpStatus(status);
        invitation.setRsvpHeadcount(status.equals("ATTENDING") ? Math.max(1, request.getHeadcount()) : 0);
        invitation.setRsvpDietary(request.getDietary());
        invitation.setRsvpMessage(request.getMessage());
        invitation.setRsvpConfirmedAt(Instant.now());

        if (request.getPhoneConfirm() != null && !request.getPhoneConfirm().isBlank()) {
            invitation.setPhoneNumber(standardizeTzPhone(request.getPhoneConfirm()));
        }

        // Sync confirmation state with Guest entity
        Guest guest = invitation.getGuest();
        if (guest != null) {
            guest.setConfirmed(status.equals("ATTENDING"));
            guestRepository.save(guest);
        }

        Invitation saved = invitationRepository.save(invitation);
        log.info("Recorded RSVP for token {}: status={}", token, status);
        return toResponse(saved);
    }

    private Event getEventAndCheckAccess(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found"));
        SecurityUtils.requireOrgAccess(event.getOrganization().getId());
        return event;
    }

    private String generateToken() {
        return "occ-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10) + "-" + System.currentTimeMillis();
    }

    private String standardizeTzPhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String clean = phone.replaceAll("[^0-9+]", "");
        if (clean.startsWith("+255")) return clean;
        if (clean.startsWith("255")) return "+" + clean;
        if (clean.startsWith("0")) return "+255" + clean.substring(1);
        return "+255" + clean;
    }

    private InvitationResponse toResponse(Invitation inv) {
        return InvitationResponse.builder()
                .id(inv.getId())
                .eventId(inv.getEvent().getId())
                .guestId(inv.getGuest().getId())
                .token(inv.getToken())
                .guestName(inv.getGuestName())
                .phoneNumber(inv.getPhoneNumber())
                .whatsappNumber(inv.getWhatsappNumber())
                .email(inv.getEmail())
                .deliveryChannel(inv.getDeliveryChannel())
                .deliveryStatus(inv.getDeliveryStatus())
                .rsvpStatus(inv.getRsvpStatus())
                .rsvpHeadcount(inv.getRsvpHeadcount())
                .rsvpDietary(inv.getRsvpDietary())
                .rsvpMessage(inv.getRsvpMessage())
                .rsvpConfirmedAt(inv.getRsvpConfirmedAt())
                .templateId(inv.getTemplateId())
                .imageUrl(inv.getImageUrl())
                .letterDetails(inv.getLetterDetails())
                .createdAt(inv.getCreatedAt())
                .updatedAt(inv.getUpdatedAt())
                .build();
    }
}
