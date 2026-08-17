package com.occassia.card.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CardRegisterRequest {

    @NotBlank
    private String uid;
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
