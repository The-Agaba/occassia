package com.occassia.invitation;

import com.occassia.invitation.dto.BatchInviteRequest;
import com.occassia.invitation.dto.InvitationResponse;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.security.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events/{eventId}/invitations")
@RequiredArgsConstructor
@Tag(name = "Invitations", description = "Digital invitation dispatch and RSVP management (Restricted to Event Creators)")
public class InvitationController {

    private final InvitationService invitationService;

    @GetMapping
    public List<InvitationResponse> list(@PathVariable UUID eventId) {
        // Enforce: only users with event creation ability (ADMIN, SUPER_ADMIN) can access
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
        return invitationService.listForEvent(eventId);
    }

    @PostMapping("/batch")
    public List<InvitationResponse> batchInvite(
            @PathVariable UUID eventId,
            @Valid @RequestBody BatchInviteRequest request) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
        return invitationService.batchInvite(eventId, request);
    }
}
