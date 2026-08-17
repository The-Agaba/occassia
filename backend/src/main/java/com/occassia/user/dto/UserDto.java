package com.occassia.user.dto;

import com.occassia.shared.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class UserDto {
    private UUID id;
    private UUID organizationId;
    private String fullName;
    private String email;
    private UserRole role;
    private boolean active;
    private Instant createdAt;
    private UUID createdById;
    private UserRole creatorRole;
}
