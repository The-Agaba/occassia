package com.occassia.card;

import com.occassia.shared.enums.CardStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NfcCardRepository extends JpaRepository<NfcCard, String> {

    List<NfcCard> findByOrganizationIdOrderByRegisteredAtDesc(UUID organizationId);

    List<NfcCard> findByOrganizationIdAndStatusOrderByRegisteredAtDesc(UUID organizationId, CardStatus status);

    List<NfcCard> findAllByOrderByRegisteredAtDesc();

    List<NfcCard> findAllByStatusOrderByRegisteredAtDesc(CardStatus status);

    boolean existsByUid(String uid);
}
