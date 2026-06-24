package com.nguyenhoa.itam.allocation.application.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class AllocationRequest {
    @NotNull(message = "ID thiết bị không được để trống")
    private UUID assetId;

    @NotNull(message = "ID người nhận không được để trống")
    private UUID toUserId;

    private String notes;

    public UUID getAssetId() {
        return assetId;
    }

    public void setAssetId(UUID assetId) {
        this.assetId = assetId;
    }

    public UUID getToUserId() {
        return toUserId;
    }

    public void setToUserId(UUID toUserId) {
        this.toUserId = toUserId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
