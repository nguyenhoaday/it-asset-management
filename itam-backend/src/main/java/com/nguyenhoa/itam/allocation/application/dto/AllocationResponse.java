package com.nguyenhoa.itam.allocation.application.dto;

import com.nguyenhoa.itam.allocation.domain.ActionType;
import com.nguyenhoa.itam.allocation.domain.ConfirmationStatus;

import java.time.Instant;
import java.util.UUID;

public class AllocationResponse {
    private UUID id;
    private UUID assetId;
    private UUID fromUserId;
    private UUID toUserId;
    private ActionType actionType;
    private Instant eventTime;
    private ConfirmationStatus confirmationStatus;
    private Instant confirmedAt;
    private String notes;
    private String handoverDocUrl;

    public AllocationResponse(UUID id, UUID assetId, UUID fromUserId, UUID toUserId, ActionType actionType, Instant eventTime, ConfirmationStatus confirmationStatus, Instant confirmedAt, String notes, String handoverDocUrl) {
        this.id = id;
        this.assetId = assetId;
        this.fromUserId = fromUserId;
        this.toUserId = toUserId;
        this.actionType = actionType;
        this.eventTime = eventTime;
        this.confirmationStatus = confirmationStatus;
        this.confirmedAt = confirmedAt;
        this.notes = notes;
        this.handoverDocUrl = handoverDocUrl;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public void setAssetId(UUID assetId) {
        this.assetId = assetId;
    }

    public UUID getFromUserId() {
        return fromUserId;
    }

    public void setFromUserId(UUID fromUserId) {
        this.fromUserId = fromUserId;
    }

    public UUID getToUserId() {
        return toUserId;
    }

    public void setToUserId(UUID toUserId) {
        this.toUserId = toUserId;
    }

    public ActionType getActionType() {
        return actionType;
    }

    public void setActionType(ActionType actionType) {
        this.actionType = actionType;
    }

    public Instant getEventTime() {
        return eventTime;
    }

    public void setEventTime(Instant eventTime) {
        this.eventTime = eventTime;
    }

    public ConfirmationStatus getConfirmationStatus() {
        return confirmationStatus;
    }

    public void setConfirmationStatus(ConfirmationStatus confirmationStatus) {
        this.confirmationStatus = confirmationStatus;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(Instant confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getHandoverDocUrl() {
        return handoverDocUrl;
    }

    public void setHandoverDocUrl(String handoverDocUrl) {
        this.handoverDocUrl = handoverDocUrl;
    }
}
