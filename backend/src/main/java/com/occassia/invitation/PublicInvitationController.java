package com.occassia.invitation;

import com.occassia.invitation.dto.InvitationGateResponse;
import com.occassia.invitation.dto.InvitationResponse;
import com.occassia.invitation.dto.RsvpRequest;
import com.occassia.invitation.dto.VerifyRecipientRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/invitations")
@RequiredArgsConstructor
@Tag(name = "Public Invitations", description = "Guest invitation viewing and RSVP. Only the intended recipient (verified by phone) can open and respond; signed-in hosts are rejected.")
public class PublicInvitationController {

    private final InvitationService invitationService;

    @GetMapping("/{token}")
    public InvitationGateResponse gate(@PathVariable String token) {
        return invitationService.getGate(token);
    }

    @PostMapping("/{token}/verify")
    public InvitationResponse verify(
            @PathVariable String token,
            @RequestBody VerifyRecipientRequest request) {
        return invitationService.verifyAndGet(token, request.getPhone());
    }

    @PostMapping("/{token}/rsvp")
    public InvitationResponse submitRsvp(
            @PathVariable String token,
            @Valid @RequestBody RsvpRequest request) {
        return invitationService.submitRsvp(token, request);
    }
}
