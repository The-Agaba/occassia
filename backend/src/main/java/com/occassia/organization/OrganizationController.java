package com.occassia.organization;

import com.occassia.organization.dto.OrganizationRequest;
import com.occassia.organization.dto.OrganizationResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
@Tag(name = "Organizations", description = "Multi-tenant organization management (SUPER_ADMIN)")
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public OrganizationResponse create(@Valid @RequestBody OrganizationRequest request) {
        return organizationService.create(request);
    }

    @GetMapping
    public List<OrganizationResponse> list() {
        return organizationService.listAll();
    }

    @GetMapping("/{id}")
    public OrganizationResponse get(@PathVariable UUID id) {
        return organizationService.getById(id);
    }

    @PutMapping("/{id}")
    public OrganizationResponse update(@PathVariable UUID id, @Valid @RequestBody OrganizationRequest request) {
        return organizationService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public OrganizationResponse updateStatus(@PathVariable UUID id, @RequestBody java.util.Map<String, String> body) {
        com.occassia.shared.enums.OrgStatus newStatus = com.occassia.shared.enums.OrgStatus.valueOf(body.get("status"));
        return organizationService.updateStatus(id, newStatus);
    }
}
