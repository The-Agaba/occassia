package com.occassia.guest.dto;

import com.occassia.category.dto.CategoryResponse;
import com.occassia.shared.enums.AttendanceType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class GuestResponse {
    private UUID id;
    private UUID eventId;
    private String fullName;
    private AttendanceType attendanceType;
    private CategoryResponse category;
    private String nfcCardUid;
    private String qrToken;
    private boolean confirmed;
    private boolean paid;
    private Integer tableNumber;
    private String mealPreference;
    private String notes;
    private boolean checkedIn;
    private Instant createdAt;
}
