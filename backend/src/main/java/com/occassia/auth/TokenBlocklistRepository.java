package com.occassia.auth;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TokenBlocklistRepository extends JpaRepository<TokenBlocklistEntry, String> {
}
