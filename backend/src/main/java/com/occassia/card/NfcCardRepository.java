package com.occassia.card;

import com.occassia.shared.enums.CardStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NfcCardRepository extends JpaRepository<NfcCard, String> {

    List<NfcCard> findByOrganizationIdOrderByRegisteredAtDesc(UUID organizationId);

    List<NfcCard> findByOrganizationIdAndStatusOrderByRegisteredAtDesc(UUID organizationId, CardStatus status);

    List<NfcCard> findByOrganizationIdAndEventIdOrderByRegisteredAtDesc(UUID organizationId, UUID eventId);

    List<NfcCard> findByOrganizationIdAndEventIdAndStatusOrderByRegisteredAtDesc(UUID organizationId, UUID eventId, CardStatus status);

    List<NfcCard> findByEventIdAndStatusOrderByRegisteredAtDesc(UUID eventId, CardStatus status);

    List<NfcCard> findByOrganizationIdAndEventIdIsNullOrderByRegisteredAtDesc(UUID organizationId);

    List<NfcCard> findByOrganizationIdAndEventIdIsNullAndStatusOrderByRegisteredAtDesc(UUID organizationId, CardStatus status);

    List<NfcCard> findByEventIdOrderByRegisteredAtDesc(UUID eventId);

    List<NfcCard> findAllByOrderByRegisteredAtDesc();

    List<NfcCard> findAllByStatusOrderByRegisteredAtDesc(CardStatus status);

    boolean existsByUid(String uid);
}
