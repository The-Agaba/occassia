package com.occassia.card;

import com.occassia.guest.Guest;
import com.occassia.organization.Organization;
import com.occassia.shared.enums.CardStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "nfc_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NfcCard {

    @Id
    @Column(length = 100)
    private String uid;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "card_status")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private CardStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_guest_id")
    private Guest assignedGuest;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @PrePersist
    void prePersist() {
        if (registeredAt == null) registeredAt = Instant.now();
        if (status == null) status = CardStatus.AVAILABLE;
    }
}
