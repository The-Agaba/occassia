package com.occassia.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    List<AuditLog> findByOrganizationIdAndEntityIdOrderByCreatedAtDesc(UUID organizationId, String entityId);

    List<AuditLog> findAllByOrderByCreatedAtDesc();
}
