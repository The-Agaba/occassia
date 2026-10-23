package com.occassia.invitation.dto;

import lombok.Builder;
import lombok.Value;

/** Minimal public info shown before a guest proves they are the intended recipient. */
@Value
@Builder
public class InvitationGateResponse {
    String guestName;
    boolean phoneRequired;
    String phoneHint;
}
