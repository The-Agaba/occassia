package com.occassia.invitation;

import com.occassia.invitation.dto.InvitationResponse;
import com.occassia.invitation.dto.RsvpRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/invitations")
@RequiredArgsConstructor
@Tag(name = "Public Invitations", description = "Public guest invitation letter viewing and RSVP (No authentication required)")
public class PublicInvitationController {

    private final InvitationService invitationService;

    @GetMapping("/{token}")
    public InvitationResponse getByToken(@PathVariable String token) {
        return invitationService.getByToken(token);
    }

    @PostMapping("/{token}/rsvp")
    public InvitationResponse submitRsvp(
            @PathVariable String token,
            @Valid @RequestBody RsvpRequest request) {
        return invitationService.submitRsvp(token, request);
    }
}
