package com.occassia.guest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GuestRepository extends JpaRepository<Guest, UUID> {

    List<Guest> findByEventIdOrderByFullNameAsc(UUID eventId);

    @Query("SELECT g FROM Guest g WHERE g.event.id = :eventId AND g.confirmed = true AND g.paid = true AND g.nfcCardUid IS NULL ORDER BY g.fullName")
    List<Guest> findAssignableGuests(UUID eventId);

    Optional<Guest> findByQrToken(String qrToken);

    Optional<Guest> findByNfcCardUid(String nfcCardUid);

    long countByEventId(UUID eventId);

    @Modifying
    @Query("DELETE FROM Guest g WHERE g.event.id = :eventId")
    void deleteByEventId(UUID eventId);

    @Query("SELECT g FROM Guest g JOIN g.event e WHERE g.nfcCardUid = :uid AND e.organization.id = :orgId")
    Optional<Guest> findByNfcCardUidAndOrg(String uid, UUID orgId);
}
