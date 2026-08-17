package com.occassia.auth;

import com.occassia.auth.dto.AuthResponse;
import com.occassia.auth.dto.LoginRequest;
import com.occassia.auth.dto.UserResponse;
import com.occassia.shared.security.SecurityUtils;
import com.occassia.shared.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, logout, token refresh, and current user profile")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        return Map.of("message", "Logged out");
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@RequestBody Map<String, String> body) {
        return authService.refresh(body.get("refreshToken"));
    }

    @GetMapping("/me")
    public UserResponse me() {
        UserPrincipal principal = SecurityUtils.currentUser();
        return authService.me(principal);
    }

    @PutMapping("/me")
    public UserResponse updateMe(@Valid @RequestBody com.occassia.auth.dto.UpdateMeRequest request) {
        UserPrincipal principal = SecurityUtils.currentUser();
        return authService.updateMe(principal, request);
    }
}
