package com.occassia.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    /** Lightweight process health endpoint for Render and uptime monitors. It intentionally avoids the database. */
    @GetMapping({"/health", "/api/v1/health"})
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "occassia-api");
    }
}
