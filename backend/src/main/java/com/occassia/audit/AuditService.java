package com.occassia.audit;

import com.occassia.organization.Organization;
import com.occassia.shared.security.SecurityUtils;
import com.occassia.shared.security.UserPrincipal;
import com.occassia.user.User;
import com.occassia.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(Organization organization, String action, String entityType, String entityId, Map<String, Object> detail) {
        UserPrincipal principal = null;
        try {
            principal = SecurityUtils.currentUser();
        } catch (Exception ignored) {
        }

        User user = null;
        if (principal != null) {
            user = userRepository.findById(principal.getId()).orElse(null);
        }

        String ip = null;
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            ip = request.getRemoteAddr();
        }

        AuditLog log = AuditLog.builder()
                .organization(organization)
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .detail(detail)
                .ipAddress(ip)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional
    public void log(UUID organizationId, String action, String entityType, String entityId, Map<String, Object> detail) {
        Organization org = new Organization();
        org.setId(organizationId);
        log(org, action, entityType, entityId, detail);
    }
}
