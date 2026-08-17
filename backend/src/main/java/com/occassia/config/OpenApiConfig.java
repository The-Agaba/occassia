package com.occassia.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private int serverPort;

    @Bean
    public OpenAPI occassiaOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Occassia API")
                        .description("""
                                REST API for the Occassia Wedding & Event Access Management Platform.

                                ## Authentication
                                1. Call `POST /api/v1/auth/login` with email and password.
                                2. Copy the `token` from the response.
                                3. Click **Authorize** above and enter: `Bearer <your-token>`

                                ## IoT / Gate Devices
                                Check-in endpoints (`/api/v1/checkin/*`) follow a strict response contract.
                                Duplicate NFC taps always return HTTP 200 with `alreadyCheckedIn: true`.

                                ## WebSocket (not covered by this UI)
                                Connect via STOMP over SockJS at `/ws`.
                                Topics: `/topic/checkin/{eventId}`, `/topic/stats/{eventId}`, `/topic/card/{uid}`
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Occassia Engineering")
                                .email("admin@occassia.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://occassia.com")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local development"),
                        new Server().url("https://api.occassia.com").description("Production")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT access token from POST /api/v1/auth/login")));
    }
}
