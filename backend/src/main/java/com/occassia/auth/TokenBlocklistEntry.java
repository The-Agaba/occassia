package com.occassia.auth;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "token_blocklist")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenBlocklistEntry {

    @Id
    @Column(length = 100)
    private String jti;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}
