package com.occassia.event;

import com.occassia.event.dto.EventRequest;
import com.occassia.event.dto.EventResponse;
import com.occassia.shared.enums.EventStatus;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Event CRUD, status transitions, and live statistics")
public class EventController {

    private final EventService eventService;

    @PostMapping
    public EventResponse create(@Valid @RequestBody EventRequest request) {
        return eventService.create(request);
    }

    @GetMapping
    public List<EventResponse> list() {
        return eventService.listForOrg();
    }

    @GetMapping("/{id}")
    public EventResponse get(@PathVariable UUID id) {
        return eventService.getById(id);
    }

    @PutMapping("/{id}")
    public EventResponse update(@PathVariable UUID id, @Valid @RequestBody EventRequest request) {
        return eventService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public EventResponse updateStatus(@PathVariable UUID id, @RequestBody Map<String, EventStatus> body) {
        return eventService.updateStatus(id, body.get("status"));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        eventService.delete(id);
    }
}
