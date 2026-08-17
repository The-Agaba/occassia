package com.occassia.checkin.dto;

import com.occassia.category.dto.CategoryResponse;
import com.occassia.shared.enums.AttendanceType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CheckInResponse {
    private UUID checkInId;
    private GuestInfo guest;
    private boolean alreadyCheckedIn;
    private Instant checkedInAt;

    @Data
    @Builder
    public static class GuestInfo {
        private UUID id;
        private String fullName;
        private AttendanceType attendanceType;
        private CategoryResponse category;
        private Integer tableNumber;
    }
}

@Data
class NfcCheckInRequest {
    private String nfcUid;
    private UUID gateId;
}

@Data
class QrCheckInRequest {
    private String qrToken;
    private UUID gateId;
}

@Data
class ManualCheckInRequest {
    private UUID guestId;
    private UUID gateId;
}
