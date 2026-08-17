package com.occassia.organization.dto;

import com.occassia.shared.enums.OrgStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrganizationRequest {

    @NotBlank
    private String name;

    @NotBlank @Email
    private String contactEmail;

    private String contactPhone;
}

@Data
class OrganizationUpdateRequest {
    private String name;
    private String contactEmail;
    private String contactPhone;
    private OrgStatus status;
}
