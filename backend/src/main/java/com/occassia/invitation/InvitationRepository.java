package com.occassia.invitation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    List<Invitation> findByEventIdOrderByCreatedAtDesc(UUID eventId);
    Optional<Invitation> findByToken(String token);
    Optional<Invitation> findByEventIdAndGuestId(UUID eventId, UUID guestId);
    List<Invitation> findByEventIdAndRsvpStatus(UUID eventId, String rsvpStatus);
}
