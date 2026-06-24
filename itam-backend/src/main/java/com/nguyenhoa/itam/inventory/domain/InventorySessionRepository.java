package com.nguyenhoa.itam.inventory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InventorySessionRepository extends JpaRepository<InventorySession, UUID> {
    boolean existsByStatus(InventorySessionStatus status);
}
