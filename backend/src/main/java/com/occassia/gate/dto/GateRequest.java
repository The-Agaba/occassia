package com.occassia.gate.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GateRequest {

    @NotBlank
    private String name;

    private String location;
}
