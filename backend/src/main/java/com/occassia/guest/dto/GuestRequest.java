package com.occassia.guest.dto;

import com.occassia.shared.enums.AttendanceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class GuestRequest {

    @NotBlank
    private String fullName;

    private String phoneNumber;

    @NotNull
    private AttendanceType attendanceType;

    @NotNull
    private UUID categoryId;

    private Integer tableNumber;
    private String mealPreference;
    private String notes;
}

@Data
class AssignCardRequest {
    @NotBlank
    private String nfcUid;
}

@Data
class ImportError {
    private int row;
    private String reason;
}

@Data
class ImportResult {
    private int total;
    private int imported;
    private int failed;
    private java.util.List<ImportError> errors;
}
