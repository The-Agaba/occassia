package com.occassia.organization;

import com.occassia.audit.AuditService;
import com.occassia.organization.dto.OrganizationRequest;
import com.occassia.organization.dto.OrganizationResponse;
import com.occassia.shared.enums.OrgStatus;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final AuditService auditService;

    @Transactional
    public OrganizationResponse create(OrganizationRequest request) {
        SecurityUtils.requireRole(UserRole.SUPER_ADMIN);
        Organization org = Organization.builder()
                .name(request.getName())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .status(OrgStatus.ACTIVE)
                .build();
        org = organizationRepository.save(org);
        auditService.log(org, "ORG_CREATED", "ORGANIZATION", org.getId().toString(), Map.of("name", org.getName()));
        return toResponse(org);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> listAll() {
        SecurityUtils.requireRole(UserRole.SUPER_ADMIN);
        return organizationRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrganizationResponse getById(UUID id) {
        Organization org = findOrThrow(id);
        if (SecurityUtils.currentUser().getRole() != UserRole.SUPER_ADMIN) {
            SecurityUtils.requireOrgAccess(id);
        }
        return toResponse(org);
    }

    @Transactional
    public OrganizationResponse update(UUID id, OrganizationRequest request) {
        SecurityUtils.requireRole(UserRole.SUPER_ADMIN);
        Organization org = findOrThrow(id);
        org.setName(request.getName());
        org.setContactEmail(request.getContactEmail());
        org.setContactPhone(request.getContactPhone());
        org = organizationRepository.save(org);
        auditService.log(org, "ORG_UPDATED", "ORGANIZATION", org.getId().toString(), null);
        return toResponse(org);
    }

    @Transactional
    public OrganizationResponse updateStatus(UUID id, OrgStatus newStatus) {
        SecurityUtils.requireRole(UserRole.SUPER_ADMIN);
        Organization org = findOrThrow(id);
        org.setStatus(newStatus);
        org = organizationRepository.save(org);
        auditService.log(org, "ORG_STATUS_CHANGED", "ORGANIZATION", org.getId().toString(), Map.of("status", newStatus.name()));
        return toResponse(org);
    }

    public Organization findOrThrow(UUID id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Organization not found"));
    }

    private OrganizationResponse toResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .contactEmail(org.getContactEmail())
                .contactPhone(org.getContactPhone())
                .status(org.getStatus())
                .createdAt(org.getCreatedAt())
                .build();
    }
}
