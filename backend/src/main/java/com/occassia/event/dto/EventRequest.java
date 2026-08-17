package com.occassia.event.dto;

import com.occassia.shared.enums.EventStatus;
import com.occassia.shared.enums.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EventRequest {

    @NotBlank
    private String name;

    @NotNull
    private EventType type;

    private String venue;

    @NotNull
    private LocalDate eventDate;

    private LocalDate startDate;

    private LocalDate endDate;

    private java.time.LocalTime startTime;

    private java.time.LocalTime endTime;
}

@Data
class EventStatusRequest {
    @NotNull
    private EventStatus status;
}
