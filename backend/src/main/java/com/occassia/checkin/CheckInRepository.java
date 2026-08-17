package com.occassia.checkin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CheckInRepository extends JpaRepository<CheckIn, UUID> {

    Optional<CheckIn> findByGuestId(UUID guestId);

    List<CheckIn> findByEventIdOrderByCheckedInAtDesc(UUID eventId);

    long countByEventId(UUID eventId);
}
