package com.occassia.metrics;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "platform_metrics")
@Getter
@NoArgsConstructor
public class PlatformMetric {

    @Id
    @Column(name = "metric_key", length = 80)
    private String metricKey;

    @Column(name = "metric_value", nullable = false)
    private long metricValue;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
