package com.occassia.shared.security;

import com.occassia.shared.enums.UserRole;
import com.occassia.shared.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Set;
import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static UserPrincipal currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Not authenticated");
        }
        return principal;
    }

    public static void requireRole(UserRole... roles) {
        UserPrincipal user = currentUser();
        Set<UserRole> allowed = Set.of(roles);
        if (!allowed.contains(user.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Insufficient permissions");
        }
    }

    public static void requireOrgAccess(UUID resourceOrgId) {
        UserPrincipal user = currentUser();
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            return;
        }
        if (user.getOrganizationId() == null || !user.getOrganizationId().equals(resourceOrgId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access denied to this organization");
        }
    }
}
