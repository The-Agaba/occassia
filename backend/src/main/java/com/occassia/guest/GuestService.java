package com.occassia.guest;

import com.occassia.audit.AuditService;
import com.occassia.category.CategoryService;
import com.occassia.category.GuestCategory;
import com.occassia.category.dto.CategoryResponse;
import com.occassia.checkin.CheckInRepository;
import com.occassia.event.Event;
import com.occassia.event.EventService;
import com.occassia.guest.dto.GuestRequest;
import com.occassia.guest.dto.GuestResponse;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.SecurityUtils;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GuestService {

    private final GuestRepository guestRepository;
    private final CheckInRepository checkInRepository;
    private final EventService eventService;
    private final CategoryService categoryService;
    private final GuestImportService guestImportService;
    private final AuditService auditService;

    @Transactional
    public GuestResponse create(UUID eventId, GuestRequest request) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);
        GuestCategory category = categoryService.findOrThrow(request.getCategoryId());

        Guest guest = Guest.builder()
                .event(event)
                .category(category)
                .fullName(request.getFullName())
                .attendanceType(request.getAttendanceType())
                .tableNumber(request.getTableNumber())
                .mealPreference(request.getMealPreference())
                .notes(request.getNotes())
                .confirmed(false)
                .paid(false)
                .build();
        guest = guestRepository.save(guest);
        auditService.log(event.getOrganization(), "GUEST_CREATED", "GUEST", guest.getId().toString(),
                Map.of("name", guest.getFullName()));
        return toResponse(guest);
    }

    @Transactional(readOnly = true)
    public List<GuestResponse> list(UUID eventId, UUID categoryId, Boolean confirmed, Boolean paid) {
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);
        return guestRepository.findByEventIdOrderByFullNameAsc(eventId).stream()
                .filter(g -> categoryId == null || g.getCategory().getId().equals(categoryId))
                .filter(g -> confirmed == null || g.isConfirmed() == confirmed)
                .filter(g -> paid == null || g.isPaid() == paid)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GuestResponse get(UUID eventId, UUID guestId) {
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);
        Guest guest = findOrThrow(guestId);
        if (!guest.getEvent().getId().equals(eventId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Guest not found in event");
        }
        return toResponse(guest);
    }

    @Transactional
    public GuestResponse update(UUID eventId, UUID guestId, GuestRequest request) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Guest guest = findGuestInEvent(eventId, guestId);
        GuestCategory category = categoryService.findOrThrow(request.getCategoryId());
        guest.setFullName(request.getFullName());
        guest.setAttendanceType(request.getAttendanceType());
        guest.setCategory(category);
        guest.setTableNumber(request.getTableNumber());
        guest.setMealPreference(request.getMealPreference());
        guest.setNotes(request.getNotes());
        guest = guestRepository.save(guest);
        return toResponse(guest);
    }

    @Transactional
    public void delete(UUID eventId, UUID guestId) {
        SecurityUtils.requireRole(UserRole.ADMIN);
        Guest guest = findGuestInEvent(eventId, guestId);
        guestRepository.delete(guest);
        auditService.log(guest.getEvent().getOrganization(), "GUEST_DELETED", "GUEST", guestId.toString(), null);
    }

    @Transactional
    public void deleteByEventId(UUID eventId) {
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);
        guestRepository.deleteByEventId(eventId);
        auditService.log(event.getOrganization(), "GUESTS_CLEANED_UP", "EVENT", eventId.toString(), null);
    }

    @Transactional
    public GuestResponse confirm(UUID guestId) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Guest guest = findOrThrow(guestId);
        eventService.verifyEventAccess(guest.getEvent());
        guest.setConfirmed(true);
        guest = guestRepository.save(guest);
        return toResponse(guest);
    }

    @Transactional
    public GuestResponse markPaid(UUID guestId) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Guest guest = findOrThrow(guestId);
        eventService.verifyEventAccess(guest.getEvent());
        guest.setPaid(true);
        guest = guestRepository.save(guest);
        return toResponse(guest);
    }

    @Transactional(readOnly = true)
    public byte[] generateQr(UUID guestId) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Guest guest = findOrThrow(guestId);
        eventService.verifyEventAccess(guest.getEvent());
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(guest.getQrToken(), BarcodeFormat.QR_CODE, 300, 300);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "QR_ERROR", "Failed to generate QR code");
        }
    }

    @Transactional(readOnly = true)
    public List<GuestResponse> listAssignable(UUID eventId) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);
        return guestRepository.findAssignableGuests(eventId).stream().map(this::toResponse).toList();
    }

    public Guest findOrThrow(UUID id) {
        return guestRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Guest not found"));
    }

    private Guest findGuestInEvent(UUID eventId, UUID guestId) {
        Guest guest = findOrThrow(guestId);
        eventService.verifyEventAccess(guest.getEvent());
        if (!guest.getEvent().getId().equals(eventId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Guest not found in event");
        }
        return guest;
    }

    GuestResponse toResponse(Guest guest) {
        boolean checkedIn = checkInRepository.findByGuestId(guest.getId()).isPresent();
        GuestCategory cat = guest.getCategory();
        return GuestResponse.builder()
                .id(guest.getId())
                .eventId(guest.getEvent().getId())
                .fullName(guest.getFullName())
                .attendanceType(guest.getAttendanceType())
                .category(CategoryResponse.builder()
                        .id(cat.getId())
                        .name(cat.getName())
                        .priorityLevel(cat.getPriorityLevel())
                        .colorHex(cat.getColorHex())
                        .build())
                .nfcCardUid(guest.getNfcCardUid())
                .qrToken(guest.getQrToken())
                .confirmed(guest.isConfirmed())
                .paid(guest.isPaid())
                .tableNumber(guest.getTableNumber())
                .mealPreference(guest.getMealPreference())
                .notes(guest.getNotes())
                .checkedIn(checkedIn)
                .createdAt(guest.getCreatedAt())
                .build();
    }
}
