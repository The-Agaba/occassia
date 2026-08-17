package com.occassia.gate;

import com.occassia.event.Event;
import com.occassia.event.EventService;
import com.occassia.gate.dto.GateRequest;
import com.occassia.gate.dto.GateResponse;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GateService {

    private final GateRepository gateRepository;
    private final EventService eventService;

    @Transactional
    public GateResponse create(UUID eventId, GateRequest request) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);

        Gate gate = Gate.builder()
                .event(event)
                .name(request.getName())
                .location(request.getLocation())
                .build();
        gate = gateRepository.save(gate);
        return toResponse(gate);
    }

    @Transactional(readOnly = true)
    public List<GateResponse> list(UUID eventId) {
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);
        return gateRepository.findByEventIdOrderByNameAsc(eventId).stream()
                .map(this::toResponse).toList();
    }

    public Gate findOrThrow(UUID id) {
        return gateRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Gate not found"));
    }

    private GateResponse toResponse(Gate gate) {
        return GateResponse.builder()
                .id(gate.getId())
                .name(gate.getName())
                .location(gate.getLocation())
                .build();
    }
}
