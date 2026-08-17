package com.occassia.event.dto;

import com.occassia.shared.enums.EventStatus;
import com.occassia.shared.enums.EventType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class EventResponse {
    private UUID id;
    private UUID organizationId;
    private String name;
    private EventType type;
    private String venue;
    private LocalDate eventDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private java.time.LocalTime startTime;
    private java.time.LocalTime endTime;
    private EventStatus status;
    private UUID createdBy;
    private String createdByName;
    private Instant createdAt;
}
