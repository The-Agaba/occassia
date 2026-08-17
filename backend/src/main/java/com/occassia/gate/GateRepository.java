package com.occassia.gate;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GateRepository extends JpaRepository<Gate, UUID> {

    List<Gate> findByEventIdOrderByNameAsc(UUID eventId);
}
