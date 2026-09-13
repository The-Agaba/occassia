package com.occassia.metrics;

import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PublicMetricsController {

    private final PlatformMetricService metricService;

    @GetMapping("/api/v1/public/metrics")
    public ResponseEntity<Map<String, Long>> metrics() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(Map.of("totalCheckIns", metricService.totalCheckIns()));
    }
}
