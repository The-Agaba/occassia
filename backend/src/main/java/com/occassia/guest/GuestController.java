package com.occassia.guest;

import com.occassia.guest.dto.GuestRequest;
import com.occassia.guest.dto.GuestResponse;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Guests", description = "Guest management, batch import, QR codes, and card assignment")
public class GuestController {

    private final GuestService guestService;
    private final GuestImportService guestImportService;

    @PostMapping("/api/v1/events/{eventId}/guests")
    public GuestResponse create(@PathVariable UUID eventId, @Valid @RequestBody GuestRequest request) {
        return guestService.create(eventId, request);
    }

    @PostMapping("/api/v1/events/{eventId}/guests/batch")
    public Map<String, Object> batchImport(@PathVariable UUID eventId, @RequestParam("file") MultipartFile file) {
        // Only admins or event managers can import guests; guestImportService verifies event access
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        return guestImportService.importGuests(eventId, file);
    }

    @GetMapping("/api/v1/events/{eventId}/guests")
    public List<GuestResponse> list(
            @PathVariable UUID eventId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) Boolean confirmed,
            @RequestParam(required = false) Boolean paid) {
        return guestService.list(eventId, categoryId, confirmed, paid);
    }

    @GetMapping("/api/v1/events/{eventId}/guests/assignable")
    public List<GuestResponse> assignable(@PathVariable UUID eventId) {
        return guestService.listAssignable(eventId);
    }

    @GetMapping("/api/v1/events/{eventId}/guests/{guestId}")
    public GuestResponse get(@PathVariable UUID eventId, @PathVariable UUID guestId) {
        return guestService.get(eventId, guestId);
    }

    @PutMapping("/api/v1/events/{eventId}/guests/{guestId}")
    public GuestResponse update(@PathVariable UUID eventId, @PathVariable UUID guestId,
                                @Valid @RequestBody GuestRequest request) {
        return guestService.update(eventId, guestId, request);
    }

    @DeleteMapping("/api/v1/events/{eventId}/guests/{guestId}")
    public void delete(@PathVariable UUID eventId, @PathVariable UUID guestId) {
        guestService.delete(eventId, guestId);
    }

    @PatchMapping("/api/v1/guests/{guestId}/confirm")
    public GuestResponse confirm(@PathVariable UUID guestId) {
        return guestService.confirm(guestId);
    }

    @PatchMapping("/api/v1/guests/{guestId}/paid")
    public GuestResponse markPaid(@PathVariable UUID guestId) {
        return guestService.markPaid(guestId);
    }

    @GetMapping("/api/v1/guests/{guestId}/qr")
    public ResponseEntity<byte[]> qr(@PathVariable UUID guestId) {
        byte[] png = guestService.generateQr(guestId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=qr-" + guestId + ".png")
                .contentType(MediaType.IMAGE_PNG)
                .body(png);
    }
}
