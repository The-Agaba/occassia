package com.occassia.checkin;

import com.occassia.event.Event;
import com.occassia.gate.Gate;
import com.occassia.guest.Guest;
import com.occassia.shared.enums.CheckInMethod;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "check_ins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guest_id", nullable = false, unique = true)
    private Guest guest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id")
    private Gate gate;

    @Column(name = "checked_in_at", nullable = false)
    private Instant checkedInAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "checkin_method")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private CheckInMethod method;

    @Column(name = "ticket_printed", nullable = false)
    private boolean ticketPrinted;

    @Column(name = "ticket_printed_at")
    private Instant ticketPrintedAt;

    @PrePersist
    void prePersist() {
        if (checkedInAt == null) checkedInAt = Instant.now();
    }
}
