package com.occassia.user;

import com.occassia.audit.AuditService;
import com.occassia.organization.Organization;
import com.occassia.organization.OrganizationService;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.SecurityUtils;
import com.occassia.shared.security.UserPrincipal;
import com.occassia.user.dto.UserCreateRequest;
import com.occassia.user.dto.UserDto;
import com.occassia.user.dto.UserRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional
    public UserDto create(UserCreateRequest request) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
        UserPrincipal current = SecurityUtils.currentUser();
        if (request.getRole() == UserRole.SUPER_ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Cannot create SUPER_ADMIN");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email already in use");
        }
        Organization org = organizationService.findOrThrow(current.getOrganizationId());
        User creator = userRepository.findById(current.getId()).orElse(null);
        User user = User.builder()
                .organization(org)
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .active(true)
                .createdBy(creator)
                .build();
        user = userRepository.save(user);
        auditService.log(org, "USER_CREATED", "USER", user.getId().toString(), Map.of("email", user.getEmail()));
        return toDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> listOrgUsers() {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
        UserPrincipal current = SecurityUtils.currentUser();
        if (current.getRole() == UserRole.SUPER_ADMIN) {
            return userRepository.findAll().stream().map(this::toDto).toList();
        }
        UUID orgId = current.getOrganizationId();
        return userRepository.findByOrganizationId(orgId).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public UserDto getById(UUID id) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
        User user = findOrThrow(id);
        SecurityUtils.requireOrgAccess(user.getOrganization().getId());
        return toDto(user);
    }

    @Transactional
    public UserDto update(UUID id, UserRequest request) {
        UserPrincipal current = SecurityUtils.currentUser();
        User user = findOrThrow(id);
        SecurityUtils.requireOrgAccess(user.getOrganization().getId());

        boolean isSelf = user.getId().equals(current.getId());
        boolean isEditorAdmin = current.getRole() == UserRole.ADMIN || current.getRole() == UserRole.SUPER_ADMIN;

        if (!isSelf && !isEditorAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Insufficient permissions");
        }

        // Check creator privilege restriction
        if (!isSelf && user.getCreatedBy() != null) {
            User creator = user.getCreatedBy();
            if (creator.getRole().ordinal() < current.getRole().ordinal()) {
                if (!creator.getId().equals(current.getId())) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", 
                        "This user was created by a user with greater privilege. Only the creator can edit this user.");
                }
            }
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        // Only admins can change roles, and they can't change it to SUPER_ADMIN
        if (request.getRole() != null) {
            if (isEditorAdmin) {
                if (request.getRole() != UserRole.SUPER_ADMIN) {
                    user.setRole(request.getRole());
                }
            } else {
                if (request.getRole() != user.getRole()) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Cannot change your own role");
                }
            }
        }

        user = userRepository.save(user);
        auditService.log(user.getOrganization(), "USER_UPDATED", "USER", user.getId().toString(), null);
        return toDto(user);
    }

    @Transactional
    public void deactivate(UUID id) {
        UserPrincipal current = SecurityUtils.currentUser();
        User user = findOrThrow(id);
        SecurityUtils.requireOrgAccess(user.getOrganization().getId());

        boolean isSelf = user.getId().equals(current.getId());
        boolean isEditorAdmin = current.getRole() == UserRole.ADMIN || current.getRole() == UserRole.SUPER_ADMIN;

        if (!isSelf && !isEditorAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Insufficient permissions");
        }

        // Check creator privilege restriction
        if (!isSelf && user.getCreatedBy() != null) {
            User creator = user.getCreatedBy();
            if (creator.getRole().ordinal() < current.getRole().ordinal()) {
                if (!creator.getId().equals(current.getId())) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                        "This user was created by a user with greater privilege. Only the creator can delete this user.");
                }
            }
        }

        // Prevent deactivating the last SUPER_ADMIN (global) or last ADMIN in an organization
        if (isSelf) {
            if (user.getRole() == UserRole.SUPER_ADMIN) {
                long totalSuperAdmins = userRepository.countByRole(UserRole.SUPER_ADMIN);
                if (totalSuperAdmins <= 1) {
                    throw new ApiException(HttpStatus.FORBIDDEN, "LAST_SUPER_ADMIN", "Cannot deactivate the last SUPER_ADMIN");
                }
            }
            if (user.getRole() == UserRole.ADMIN) {
                UUID orgId = user.getOrganization() != null ? user.getOrganization().getId() : null;
                if (orgId != null) {
                    long totalAdmins = userRepository.countByRoleAndOrganizationId(UserRole.ADMIN, orgId);
                    if (totalAdmins <= 1) {
                        throw new ApiException(HttpStatus.FORBIDDEN, "LAST_ADMIN", "Cannot deactivate the last ADMIN in the organization");
                    }
                }
            }
        }

        user.setActive(false);
        userRepository.save(user);
        auditService.log(user.getOrganization(), "USER_DEACTIVATED", "USER", user.getId().toString(), null);
    }

    public User findOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "User not found"));
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .organizationId(user.getOrganization() != null ? user.getOrganization().getId() : null)
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .createdById(user.getCreatedBy() != null ? user.getCreatedBy().getId() : null)
                .creatorRole(user.getCreatedBy() != null ? user.getCreatedBy().getRole() : null)
                .build();
    }
}
