package com.occassia.organization.dto;

import com.occassia.shared.enums.OrgStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class OrganizationResponse {
    private UUID id;
    private String name;
    private String contactEmail;
    private String contactPhone;
    private OrgStatus status;
    private Instant createdAt;
}
