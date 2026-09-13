package com.occassia.checkin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class QrCheckInRequest {
    @NotBlank private String qrToken;
    private UUID gateId;
}
