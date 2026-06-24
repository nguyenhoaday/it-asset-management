package com.nguyenhoa.itam.allocation.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "allocations")
public class Allocation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("uuid_generate_v4()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @NotNull
    @Column(name = "asset_id", nullable = false)
    private UUID asset;

    @Column(name = "from_user_id")
    private UUID fromUser;

    @Column(name = "to_user_id")
    private UUID toUser;

    @Enumerated(EnumType.STRING)
    @NotNull
    @Column(name = "action_type", nullable = false, length = 20)
    private ActionType actionType;

    @CreationTimestamp
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "event_time", nullable = false)
    private Instant eventTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "confirmation_status", length = 20)
    private ConfirmationStatus confirmationStatus;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "confirmed_by")
    private UUID confirmedBy;

    @Column(name = "notes", length = Integer.MAX_VALUE)
    private String notes;

    @Size(max = 255)
    @Column(name = "handover_doc_url")
    private String handoverDocUrl;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreationTimestamp
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private Instant createdAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getAsset() {
        return asset;
    }

    public void setAsset(UUID asset) {
        this.asset = asset;
    }

    public UUID getFromUser() {
        return fromUser;
    }

    public void setFromUser(UUID fromUser) {
        this.fromUser = fromUser;
    }

    public UUID getToUser() {
        return toUser;
    }

    public void setToUser(UUID toUser) {
        this.toUser = toUser;
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

    public UUID getConfirmedBy() {
        return confirmedBy;
    }

    public void setConfirmedBy(UUID confirmedBy) {
        this.confirmedBy = confirmedBy;
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

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

}