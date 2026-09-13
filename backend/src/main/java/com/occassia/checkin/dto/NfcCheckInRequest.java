package com.occassia.checkin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class NfcCheckInRequest {
    @NotBlank private String nfcUid;
    private UUID gateId;
}
