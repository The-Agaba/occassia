package com.occassia.card.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CardRegisterRequest {

    @NotBlank
    private String uid;

    @NotNull
    private UUID eventId;
}

@Data
class CardStatusRequest {
    @NotBlank
    private String status;
}

@Data
class AssignCardBody {
    @NotBlank
    private String nfcUid;
}
