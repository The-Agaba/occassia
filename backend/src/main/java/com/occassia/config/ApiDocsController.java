package com.occassia.config;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "System", description = "Platform metadata and documentation links")
public class ApiDocsController {

    @GetMapping("/api/v1/docs")
    public Map<String, Object> documentationLinks() {
        return Map.of(
                "name", "Occassia API",
                "version", "1.0.0",
                "openapi", "/v3/api-docs",
                "openapiYaml", "/v3/api-docs.yaml",
                "swaggerUi", "/swagger-ui.html",
                "developerGuide", "See DEVELOPER.md in the repository root",
                "basePath", "/api/v1",
                "websocket", Map.of(
                        "endpoint", "/ws",
                        "protocol", "STOMP over SockJS",
                        "topics", new String[]{
                                "/topic/checkin/{eventId}",
                                "/topic/stats/{eventId}",
                                "/topic/card/{uid}"
                        }
                )
        );
    }
}
