package com.occassia.gate.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class GateResponse {
    private UUID id;
    private String name;
    private String location;
}
