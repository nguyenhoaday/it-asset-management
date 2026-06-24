package com.nguyenhoa.itam.allocation.application.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO trả về danh sách tài sản đang được giao cho người dùng hiện tại.
 * Map từ AssetCurrentHolder (View) nội bộ trong AllocationService
 */
public class MyAssetResponse {
    private UUID assetId;
    private String assetCode;
    private String name;
    private Instant assignedAt;
    private String confirmationStatus;
    private String notes;

    public MyAssetResponse(UUID assetId, String assetCode, String name, Instant assignedAt, String confirmationStatus, String notes) {
        this.assetId = assetId;
        this.assetCode = assetCode;
        this.name = name;
        this.assignedAt = assignedAt;
        this.confirmationStatus = confirmationStatus;
        this.notes = notes;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public String getName() {
        return name;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public String getConfirmationStatus() {
        return confirmationStatus;
    }

    public String getNotes() {
        return notes;
    }
}
