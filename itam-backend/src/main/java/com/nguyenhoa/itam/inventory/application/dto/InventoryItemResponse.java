package com.nguyenhoa.itam.inventory.application.dto;

import com.nguyenhoa.itam.inventory.domain.CheckedStatus;

import java.time.Instant;
import java.util.UUID;

public class InventoryItemResponse {
    private UUID id;
    private UUID sessionId;
    private UUID assetId;
    private UUID checkedBy;
    private CheckedStatus checkedStatus;
    private Instant checkedAt;
    private String notes;
    
    private String assetName;
    private String assetCode;
    private String checkedByName;

    public InventoryItemResponse(UUID id, UUID sessionId, UUID assetId, UUID checkedBy, CheckedStatus checkedStatus, Instant checkedAt, String notes) {
        this.id = id;
        this.sessionId = sessionId;
        this.assetId = assetId;
        this.checkedBy = checkedBy;
        this.checkedStatus = checkedStatus;
        this.checkedAt = checkedAt;
        this.notes = notes;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public void setAssetId(UUID assetId) {
        this.assetId = assetId;
    }

    public UUID getCheckedBy() {
        return checkedBy;
    }

    public void setCheckedBy(UUID checkedBy) {
        this.checkedBy = checkedBy;
    }

    public CheckedStatus getCheckedStatus() {
        return checkedStatus;
    }

    public void setCheckedStatus(CheckedStatus checkedStatus) {
        this.checkedStatus = checkedStatus;
    }

    public Instant getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(Instant checkedAt) {
        this.checkedAt = checkedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getAssetName() {
        return assetName;
    }

    public void setAssetName(String assetName) {
        this.assetName = assetName;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public void setAssetCode(String assetCode) {
        this.assetCode = assetCode;
    }

    public String getCheckedByName() {
        return checkedByName;
    }

    public void setCheckedByName(String checkedByName) {
        this.checkedByName = checkedByName;
    }
}
