package com.occassia.audit;

import com.occassia.event.EventService;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.security.SecurityUtils;
import com.occassia.shared.security.UserPrincipal;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;
    private final EventService eventService;

    @Transactional(readOnly = true)
    public List<AuditDto> listOrgAudit() {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
        UserPrincipal current = SecurityUtils.currentUser();
        if (current.getRole() == UserRole.SUPER_ADMIN) {
            return auditLogRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(this::toDto).toList();
        }
        UUID orgId = current.getOrganizationId();
        return auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<AuditDto> listEventAudit(UUID eventId) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
        var event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);
        return auditLogRepository.findByOrganizationIdAndEntityIdOrderByCreatedAtDesc(
                event.getOrganization().getId(), eventId.toString()).stream()
                .map(this::toDto).toList();
    }

    private AuditDto toDto(AuditLog log) {
        return AuditDto.builder()
                .id(log.getId())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .detail(log.getDetail())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .userName(log.getUser() != null ? log.getUser().getFullName() : null)
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }

    @Data
    @Builder
    public static class AuditDto {
        private UUID id;
        private String action;
        private String entityType;
        private String entityId;
        private java.util.Map<String, Object> detail;
        private UUID userId;
        private String userName;
        private String ipAddress;
        private Instant createdAt;
    }
}
