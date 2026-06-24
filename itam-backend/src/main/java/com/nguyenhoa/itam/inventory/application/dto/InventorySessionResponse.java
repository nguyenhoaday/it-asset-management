package com.nguyenhoa.itam.inventory.application.dto;

import com.nguyenhoa.itam.inventory.domain.InventorySessionStatus;

import java.time.Instant;
import java.util.UUID;

public class InventorySessionResponse {
    private UUID id;
    private String title;
    private UUID createdBy;
    private InventorySessionStatus status;
    private Instant createdAt;
    private Instant closedAt;

    public InventorySessionResponse(UUID id, String title, UUID createdBy, InventorySessionStatus status, Instant createdAt, Instant closedAt) {
        this.id = id;
        this.title = title;
        this.createdBy = createdBy;
        this.status = status;
        this.createdAt = createdAt;
        this.closedAt = closedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public InventorySessionStatus getStatus() {
        return status;
    }

    public void setStatus(InventorySessionStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
    }
}
