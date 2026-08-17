package com.occassia.category;

import com.occassia.event.Event;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "guest_categories", uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "name"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "priority_level", nullable = false)
    private int priorityLevel;

    @Column(name = "color_hex", nullable = false, length = 7)
    private String colorHex;
}
