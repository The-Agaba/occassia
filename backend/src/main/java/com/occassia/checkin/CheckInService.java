package com.occassia.checkin;

import com.occassia.audit.AuditService;
import com.occassia.card.NfcCard;
import com.occassia.card.NfcCardRepository;
import com.occassia.card.CardService;
import com.occassia.category.dto.CategoryResponse;
import com.occassia.checkin.dto.CheckInResponse;
import com.occassia.dashboard.StatsService;
import com.occassia.event.Event;
import com.occassia.event.EventService;
import com.occassia.gate.Gate;
import com.occassia.gate.GateService;
import com.occassia.guest.Guest;
import com.occassia.guest.GuestRepository;
import com.occassia.shared.enums.CardStatus;
import com.occassia.shared.enums.CheckInMethod;
import com.occassia.shared.enums.EventStatus;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.SecurityUtils;
import com.occassia.shared.nfc.NfcUid;
import com.occassia.metrics.PlatformMetricService;
import com.occassia.websocket.CheckInEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private final CheckInRepository checkInRepository;
    private final GuestRepository guestRepository;
    private final NfcCardRepository cardRepository;
    private final CardService cardService;
    private final EventService eventService;
    private final GateService gateService;
    private final AuditService auditService;
    private final CheckInEventPublisher eventPublisher;
    private final StatsService statsService;
    private final PlatformMetricService platformMetricService;

    @Transactional
    public CheckInResponse checkInByNfc(String nfcUid, UUID gateId) {
        SecurityUtils.requireRole(UserRole.CHECKIN_STAFF, UserRole.ADMIN, UserRole.EVENT_MANAGER);
        NfcCard card = cardRepository.findById(NfcUid.normalize(nfcUid))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CARD_NOT_FOUND", "Card not registered in system"));

        if (card.getStatus() == CardStatus.LOST) {
            throw new ApiException(HttpStatus.FORBIDDEN, "CARD_LOST", "This card is reported lost. Contact admin.");
        }
        if (card.getStatus() == CardStatus.DAMAGED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "CARD_DAMAGED", "This card is damaged. Contact admin.");
        }
        if (card.getStatus() == CardStatus.CHECKED_IN) {
            throw new ApiException(HttpStatus.CONFLICT, "CARD_ALREADY_CHECKED_IN", "This card has already checked in for this event and cannot be used again.");
        }

        Guest guest = card.getAssignedGuest();
        if (guest == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "CARD_NOT_FOUND", "Card not assigned to any guest");
        }
        if (card.getEvent() == null || !card.getEvent().getId().equals(guest.getEvent().getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "CARD_WRONG_EVENT", "This card is not registered for the guest's event.");
        }

        return performCheckIn(guest, gateId, CheckInMethod.NFC);
    }

    @Transactional
    public CheckInResponse checkInByQr(String qrToken, UUID gateId) {
        SecurityUtils.requireRole(UserRole.CHECKIN_STAFF, UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Guest guest = guestRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "GUEST_NOT_FOUND", "Invalid QR code"));
        return performCheckIn(guest, gateId, CheckInMethod.QR);
    }

    private CheckInResponse performCheckIn(Guest guest, UUID gateId, CheckInMethod method) {
        Event event = guest.getEvent();
        eventService.verifyEventAccess(event);

        if (event.getStatus() != EventStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "EVENT_CLOSED", "Event is no longer accepting check-ins");
        }
        if (!guest.isConfirmed()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "GUEST_NOT_CONFIRMED", "Guest is not confirmed");
        }

        Optional<CheckIn> existing = checkInRepository.findByGuestId(guest.getId());
        if (existing.isPresent()) {
            return toResponse(existing.get(), guest, true);
        }

        Gate gate = null;
        if (gateId != null) {
            gate = gateService.findOrThrow(gateId);
            if (!gate.getEvent().getId().equals(event.getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_GATE", "Gate does not belong to event");
            }
        }

        CheckIn checkIn = CheckIn.builder()
                .guest(guest)
                .event(event)
                .gate(gate)
                .method(method)
                .checkedInAt(Instant.now())
                .ticketPrinted(false)
                .build();
        checkIn = checkInRepository.save(checkIn);
        if (method == CheckInMethod.NFC) {
            if (guest.getNfcCardUid() != null) {
                cardService.markCheckedIn(guest.getNfcCardUid());
            }
        }
        // Keep the product-wide counter independent from mutable event records.
        // It is incremented only for a new check-in, never for a duplicate scan.
        platformMetricService.recordCheckIn();

        auditService.log(event.getOrganization(), "CHECKIN_PERFORMED", "CHECKIN", checkIn.getId().toString(),
                Map.of("guestId", guest.getId().toString(), "method", method.name()));

        eventPublisher.publishCheckIn(checkIn, guest);
        eventPublisher.publishStats(event.getId(), statsService.getStats(event.getId()));

        return toResponse(checkIn, guest, false);
    }

    @Transactional
    public void markTicketPrinted(UUID checkInId) {
        SecurityUtils.requireRole(UserRole.CHECKIN_STAFF, UserRole.ADMIN, UserRole.EVENT_MANAGER);
        CheckIn checkIn = checkInRepository.findById(checkInId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Check-in not found"));
        eventService.verifyEventAccess(checkIn.getEvent());
        checkIn.setTicketPrinted(true);
        checkIn.setTicketPrintedAt(Instant.now());
        checkInRepository.save(checkIn);
    }

    @Transactional(readOnly = true)
    public List<CheckInResponse> listForEvent(UUID eventId) {
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);
        return checkInRepository.findByEventIdOrderByCheckedInAtDesc(eventId).stream()
                .map(ci -> toResponse(ci, ci.getGuest(), false))
                .toList();
    }

    private CheckInResponse toResponse(CheckIn checkIn, Guest guest, boolean alreadyCheckedIn) {
        return CheckInResponse.builder()
                .checkInId(checkIn.getId())
                .guest(CheckInResponse.GuestInfo.builder()
                        .id(guest.getId())
                        .fullName(guest.getFullName())
                        .attendanceType(guest.getAttendanceType())
                        .category(CategoryResponse.builder()
                                .id(guest.getCategory().getId())
                                .name(guest.getCategory().getName())
                                .priorityLevel(guest.getCategory().getPriorityLevel())
                                .colorHex(guest.getCategory().getColorHex())
                                .build())
                        .tableNumber(guest.getTableNumber())
                        .build())
                .alreadyCheckedIn(alreadyCheckedIn)
                .checkedInAt(checkIn.getCheckedInAt())
                .build();
    }
}
