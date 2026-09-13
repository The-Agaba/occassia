package com.occassia.metrics;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PublicMetricsController {

    private final PlatformMetricService metricService;

    @GetMapping("/api/v1/public/metrics")
    public Map<String, Long> metrics() {
        return Map.of("totalCheckIns", metricService.totalCheckIns());
    }
}
