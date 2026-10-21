package com.occassia.invitation.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Value
@Builder
public class InvitationResponse {
    UUID id;
    UUID eventId;
    UUID guestId;
    String token;
    String guestName;
    String phoneNumber;
    String whatsappNumber;
    String email;
    String deliveryChannel;
    String deliveryStatus;
    String rsvpStatus;
    int rsvpHeadcount;
    String rsvpDietary;
    String rsvpMessage;
    Instant rsvpConfirmedAt;
    String templateId;
    String imageUrl;
    Map<String, Object> letterDetails;
    Instant createdAt;
    Instant updatedAt;
}
