package com.occassia.auth;

import com.occassia.auth.dto.AuthResponse;
import com.occassia.auth.dto.LoginRequest;
import com.occassia.auth.dto.UserResponse;
import com.occassia.shared.exception.ApiException;
import com.occassia.shared.security.UserPrincipal;
import com.occassia.user.User;
import com.occassia.user.UserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenBlocklistRepository blocklistRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials"));

        UserPrincipal principal = new UserPrincipal(user);
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);

        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(refreshToken))
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rt);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(toUserResponse(user))
                .build();
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        Claims claims = jwtService.parseClaims(refreshToken);
        if (!jwtService.isRefreshToken(claims)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Invalid refresh token");
        }

        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(hashToken(refreshToken))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Refresh token not found"));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_EXPIRED", "Refresh token expired");
        }

        User user = stored.getUser();
        UserPrincipal principal = new UserPrincipal(user);
        String newAccess = jwtService.generateAccessToken(principal);
        String newRefresh = jwtService.generateRefreshToken(principal);

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        RefreshToken newRt = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(newRefresh))
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newRt);

        return AuthResponse.builder()
                .token(newAccess)
                .refreshToken(newRefresh)
                .user(toUserResponse(user))
                .build();
    }

    @Transactional
    public void logout(String accessToken) {
        try {
            Claims claims = jwtService.parseClaims(accessToken);
            TokenBlocklistEntry entry = TokenBlocklistEntry.builder()
                    .jti(claims.getId())
                    .expiresAt(claims.getExpiration().toInstant())
                    .build();
            blocklistRepository.save(entry);
        } catch (Exception ignored) {
        }
    }

    public UserResponse me(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "User not found"));
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateMe(UserPrincipal principal, com.occassia.auth.dto.UpdateMeRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "User not found"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            // Ensure no other user owns this email
            userRepository.findByEmail(request.getEmail().trim())
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email already in use");
                    });
            user.setEmail(request.getEmail().trim());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);
        return toUserResponse(user);
    }

    public static UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .organizationId(user.getOrganization() != null ? user.getOrganization().getId() : null)
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
