package com.occassia.card.dto;

import com.occassia.shared.enums.CardStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CardResponse {
    private String uid;
    private UUID organizationId;
    private UUID eventId;
    private CardStatus status;
    private UUID assignedGuestId;
    private String assignedGuestName;
    private Instant registeredAt;
    private Instant assignedAt;
}
