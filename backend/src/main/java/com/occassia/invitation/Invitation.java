package com.occassia.invitation;

import com.occassia.event.Event;
import com.occassia.guest.Guest;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @Column(nullable = false, unique = true, length = 100)
    private String token;

    @Column(name = "guest_name", nullable = false, length = 200)
    private String guestName;

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Column(name = "whatsapp_number", length = 50)
    private String whatsappNumber;

    @Column(length = 200)
    private String email;

    @Column(name = "delivery_channel", length = 30)
    private String deliveryChannel;

    @Column(name = "delivery_status", nullable = false, length = 30)
    @Builder.Default
    private String deliveryStatus = "PENDING";

    @Column(name = "rsvp_status", nullable = false, length = 30)
    @Builder.Default
    private String rsvpStatus = "PENDING";

    @Column(name = "rsvp_headcount", nullable = false)
    @Builder.Default
    private int rsvpHeadcount = 0;

    @Column(name = "rsvp_dietary", length = 255)
    private String rsvpDietary;

    @Column(name = "rsvp_message", columnDefinition = "text")
    private String rsvpMessage;

    @Column(name = "rsvp_confirmed_at")
    private Instant rsvpConfirmedAt;

    @Column(name = "template_id", nullable = false, length = 100)
    @Builder.Default
    private String templateId = "royal-botanical-gold";

    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "letter_details", columnDefinition = "jsonb")
    private Map<String, Object> letterDetails;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (token == null || token.isBlank()) {
            token = "occ-" + UUID.randomUUID().toString().substring(0, 8) + "-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
