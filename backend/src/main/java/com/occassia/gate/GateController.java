package com.occassia.gate;

import com.occassia.gate.dto.GateRequest;
import com.occassia.gate.dto.GateResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class GateController {

    private final GateService gateService;

    @PostMapping("/api/v1/events/{eventId}/gates")
    public GateResponse create(@PathVariable UUID eventId, @Valid @RequestBody GateRequest request) {
        return gateService.create(eventId, request);
    }

    @GetMapping("/api/v1/events/{eventId}/gates")
    public List<GateResponse> list(@PathVariable UUID eventId) {
        return gateService.list(eventId);
    }
}
