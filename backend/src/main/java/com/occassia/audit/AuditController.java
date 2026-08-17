package com.occassia.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AuditController {

    private final AuditQueryService auditQueryService;

    @GetMapping("/api/v1/audit")
    public List<AuditQueryService.AuditDto> orgAudit() {
        return auditQueryService.listOrgAudit();
    }

    @GetMapping("/api/v1/events/{eventId}/audit")
    public List<AuditQueryService.AuditDto> eventAudit(@PathVariable UUID eventId) {
        return auditQueryService.listEventAudit(eventId);
    }
}
