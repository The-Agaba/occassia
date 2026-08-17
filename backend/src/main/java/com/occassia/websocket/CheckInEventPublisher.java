package com.occassia.websocket;

import com.occassia.card.NfcCard;
import com.occassia.checkin.CheckIn;
import com.occassia.dashboard.dto.EventStatsResponse;
import com.occassia.guest.Guest;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CheckInEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishCheckIn(CheckIn checkIn, Guest guest) {
        UUID eventId = checkIn.getEvent().getId();
        Map<String, Object> payload = new HashMap<>();
        payload.put("guestId", guest.getId().toString());
        payload.put("guestName", guest.getFullName());
        payload.put("category", guest.getCategory().getName());
        payload.put("categoryColor", guest.getCategory().getColorHex());
        payload.put("gateId", checkIn.getGate() != null ? checkIn.getGate().getId().toString() : null);
        payload.put("checkedInAt", checkIn.getCheckedInAt().toString());
        messagingTemplate.convertAndSend("/topic/checkin/" + eventId, payload);
    }

    public void publishStats(UUID eventId, EventStatsResponse stats) {
        messagingTemplate.convertAndSend("/topic/stats/" + eventId, stats);
    }

    public void publishCardUpdate(NfcCard card) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("uid", card.getUid());
        payload.put("status", card.getStatus().name());
        payload.put("assignedGuestId", card.getAssignedGuest() != null ? card.getAssignedGuest().getId().toString() : null);
        messagingTemplate.convertAndSend("/topic/card/" + card.getUid(), payload);
    }
}
