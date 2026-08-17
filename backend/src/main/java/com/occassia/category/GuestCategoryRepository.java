package com.occassia.category;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GuestCategoryRepository extends JpaRepository<GuestCategory, UUID> {

    List<GuestCategory> findByEventIdOrderByPriorityLevelAsc(UUID eventId);

    Optional<GuestCategory> findByEventIdAndNameIgnoreCase(UUID eventId, String name);
}
