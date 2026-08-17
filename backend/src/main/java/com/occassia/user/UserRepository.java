package com.occassia.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    List<User> findByOrganizationId(UUID organizationId);

    boolean existsByEmail(String email);

    long countByRole(com.occassia.shared.enums.UserRole role);

    long countByRoleAndOrganizationId(com.occassia.shared.enums.UserRole role, UUID organizationId);
}
