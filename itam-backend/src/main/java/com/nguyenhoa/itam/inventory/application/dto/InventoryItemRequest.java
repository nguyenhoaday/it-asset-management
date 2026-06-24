package com.nguyenhoa.itam.inventory.application.dto;

import com.nguyenhoa.itam.inventory.domain.CheckedStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class InventoryItemRequest {
    @NotNull(message = "ID thiết bị không được để trống")
    private UUID assetId;

    @NotNull(message = "Trạng thái kiểm tra không được để trống")
    private CheckedStatus checkedStatus;
    private String notes;

    public InventoryItemRequest(UUID assetId, CheckedStatus checkedStatus, String notes) {
        this.assetId = assetId;
        this.checkedStatus = checkedStatus;
        this.notes = notes;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public void setAssetId(UUID assetId) {
        this.assetId = assetId;
    }

    public CheckedStatus getCheckedStatus() {
        return checkedStatus;
    }

    public void setCheckedStatus(CheckedStatus checkedStatus) {
        this.checkedStatus = checkedStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
