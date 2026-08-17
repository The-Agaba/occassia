package com.occassia.auth.dto;

import com.occassia.shared.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private UUID organizationId;
    private String fullName;
    private String email;
    private UserRole role;
}
