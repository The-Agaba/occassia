package com.occassia.metrics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlatformMetricRepository extends JpaRepository<PlatformMetric, String> {

    @Modifying
    @Query(value = "UPDATE platform_metrics SET metric_value = metric_value + 1, updated_at = NOW() WHERE metric_key = :metricKey", nativeQuery = true)
    int increment(@Param("metricKey") String metricKey);
}
