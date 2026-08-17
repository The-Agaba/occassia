package com.occassia.card;

import com.occassia.audit.AuditService;
import com.occassia.guest.Guest;
import com.occassia.guest.GuestRepository;
import com.occassia.guest.GuestService;
import com.occassia.organization.Organization;
import com.occassia.organization.OrganizationService;
import com.occassia.shared.enums.CardStatus;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.SecurityUtils;
import com.occassia.shared.security.UserPrincipal;
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

        if (cardRepository.existsByUid(request.getUid())) {
            throw new ApiException(HttpStatus.CONFLICT, "CARD_EXISTS", "Card already registered");
        }

        NfcCard card = NfcCard.builder()
            .uid(request.getUid())
            .organization(org)
            .status(CardStatus.AVAILABLE)
            .build();
        card = cardRepository.save(card);
        auditService.log(org, "CARD_REGISTERED", "CARD", card.getUid(), null);
        return toResponse(card);
    }

    @Transactional
    public Map<String, Object> batchRegister(MultipartFile file) {
        SecurityUtils.requireRole(UserRole.ADMIN);
        UserPrincipal current = SecurityUtils.currentUser();
        Organization org = organizationService.findOrThrow(current.getOrganizationId());

        int imported = 0;
        List<Map<String, Object>> errors = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            List<String[]> rows = reader.readAll();
            for (int i = 1; i < rows.size(); i++) {
                String[] row = rows.get(i);
                if (row.length == 0 || row[0].isBlank()) continue;
                String uid = row[0].trim();
                try {
                    if (cardRepository.existsByUid(uid)) {
                        errors.add(Map.of("row", i + 1, "reason", "Card already exists: " + uid));
                        continue;
                    }
                        NfcCard card = NfcCard.builder()
                            .uid(uid)
                            .organization(org)
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

        NfcCard card = findOrThrow(nfcUid);
        SecurityUtils.requireOrgAccess(card.getOrganization().getId());
        if (card.getStatus() != CardStatus.AVAILABLE) {
            throw new ApiException(HttpStatus.CONFLICT, "CARD_NOT_AVAILABLE", "Card is not available");
        }

        guest.setNfcCardUid(nfcUid);
        guestRepository.save(guest);

        card.setStatus(CardStatus.ASSIGNED);
        card.setAssignedGuest(guest);
        card.setAssignedAt(Instant.now());
        cardRepository.save(card);

        eventPublisher.publishCardUpdate(card);
        auditService.log(card.getOrganization(), "CARD_ASSIGNED", "CARD", nfcUid,
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

    public NfcCard findOrThrow(String uid) {
        return cardRepository.findById(uid)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CARD_NOT_FOUND", "Card not registered in system"));
    }

    private void eventServiceVerify(Guest guest) {
        SecurityUtils.requireOrgAccess(guest.getEvent().getOrganization().getId());
    }

    private CardResponse toResponse(NfcCard card) {
        return CardResponse.builder()
                .uid(card.getUid())
                .organizationId(card.getOrganization().getId())
                .status(card.getStatus())
                .assignedGuestId(card.getAssignedGuest() != null ? card.getAssignedGuest().getId() : null)
                .assignedGuestName(card.getAssignedGuest() != null ? card.getAssignedGuest().getFullName() : null)
                .registeredAt(card.getRegisteredAt())
                .assignedAt(card.getAssignedAt())
                .build();
    }
}
