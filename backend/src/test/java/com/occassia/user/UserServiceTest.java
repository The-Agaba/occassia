package com.occassia.user;

import com.occassia.audit.AuditService;
import com.occassia.organization.Organization;
import com.occassia.organization.OrganizationService;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.SecurityUtils;
import com.occassia.shared.security.UserPrincipal;
import jakarta.validation.constraints.NotNull;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationService organizationService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private UserService userService;

    @Test
    void deactivateSelfAsLastSuperAdminThrows() {
        UUID userId = UUID.randomUUID();
        Organization org = Organization.builder().id(UUID.randomUUID()).name("Platform").build();
        User user = User.builder()
                .id(userId)
                .organization(org)
                .fullName("Super Admin")
                .email("super@example.com")
                .passwordHash("hash")
                .role(UserRole.SUPER_ADMIN)
                .active(true)
                .build();

        UserPrincipal principal = new UserPrincipal(user);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.countByRole(UserRole.SUPER_ADMIN)).thenReturn(1L);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::currentUser).thenReturn(principal);
            securityUtils.when(() -> SecurityUtils.requireOrgAccess(any(UUID.class))).thenAnswer(invocation -> null);

            ApiException exception = assertThrows(ApiException.class, () -> userService.deactivate(userId));
            assertEquals("LAST_SUPER_ADMIN", exception.getErrorCode());
            verify(userRepository, never()).save(any());
        }
    }

    @Test
    void deactivateSelfAsLastAdminInOrganizationThrows() {
        UUID orgId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Organization org = Organization.builder().id(orgId).name("Tenant Org").build();
        User user = User.builder()
                .id(userId)
                .organization(org)
                .fullName("Org Admin")
                .email("admin@example.com")
                .passwordHash("hash")
                .role(UserRole.ADMIN)
                .active(true)
                .build();

        UserPrincipal principal = new UserPrincipal(user);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.countByRoleAndOrganizationId(UserRole.ADMIN, orgId)).thenReturn(1L);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::currentUser).thenReturn(principal);
            securityUtils.when(() -> SecurityUtils.requireOrgAccess(any(UUID.class))).thenAnswer(invocation -> null);

            ApiException exception = assertThrows(ApiException.class, () -> userService.deactivate(userId));
            assertEquals("LAST_ADMIN", exception.getErrorCode());
            verify(userRepository, never()).save(any());
        }
    }

    @Test
    void deactivateSelfAsAdminWithOtherOrganizationAdminsSucceeds() {
        UUID orgId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Organization org = Organization.builder().id(orgId).name("Tenant Org").build();
        User user = User.builder()
                .id(userId)
                .organization(org)
                .fullName("Org Admin")
                .email("admin@example.com")
                .passwordHash("hash")
                .role(UserRole.ADMIN)
                .active(true)
                .build();

        UserPrincipal principal = new UserPrincipal(user);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.countByRoleAndOrganizationId(UserRole.ADMIN, orgId)).thenReturn(2L);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::currentUser).thenReturn(principal);
            securityUtils.when(() -> SecurityUtils.requireOrgAccess(any(UUID.class))).thenAnswer(invocation -> null);

            userService.deactivate(userId);

            verify(userRepository).save(user);
            assertEquals(false, user.isActive());
        }
    }
}
