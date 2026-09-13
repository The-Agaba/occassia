package com.occassia.metrics;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlatformMetricService {

    public static final String TOTAL_CHECKINS = "TOTAL_CHECKINS";

    private final PlatformMetricRepository repository;

    @Transactional(readOnly = true)
    public long totalCheckIns() {
        return repository.findById(TOTAL_CHECKINS).map(PlatformMetric::getMetricValue).orElse(0L);
    }

    /** Atomic increment keeps the counter correct when multiple gates check guests in at once. */
    @Transactional
    public void recordCheckIn() {
        if (repository.increment(TOTAL_CHECKINS) != 1) {
            throw new IllegalStateException("Persistent attendance counter is not initialized");
        }
    }
}
