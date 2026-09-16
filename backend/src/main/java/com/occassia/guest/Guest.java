package com.occassia.guest;

import com.occassia.category.GuestCategory;
import com.occassia.event.Event;
import com.occassia.shared.enums.AttendanceType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "guests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private GuestCategory category;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "phone_number", length = 40)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_type", nullable = false, columnDefinition = "attendance_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private AttendanceType attendanceType;

    @Column(name = "nfc_card_uid", length = 100)
    private String nfcCardUid;

    @Column(name = "qr_token", nullable = false, unique = true)
    private String qrToken;

    @Column(nullable = false)
    private boolean confirmed;

    @Column(nullable = false)
    private boolean paid;

    @Column(name = "table_number")
    private Integer tableNumber;

    @Column(name = "meal_preference", length = 100)
    private String mealPreference;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (qrToken == null) qrToken = UUID.randomUUID().toString().replace("-", "");
    }
}
