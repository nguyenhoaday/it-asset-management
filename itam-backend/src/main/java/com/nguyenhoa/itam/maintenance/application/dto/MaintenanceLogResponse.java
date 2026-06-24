package com.nguyenhoa.itam.maintenance.application.dto;

import com.nguyenhoa.itam.maintenance.domain.MaintenanceStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class MaintenanceLogResponse {
    private UUID id;
    private UUID assetId;
    private UUID handleBy;
    private String providerName;
    private BigDecimal repairCost;
    private String issueDescription;
    private String actionTaken;
    private MaintenanceStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private UUID createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    public MaintenanceLogResponse(UUID id, UUID assetId, UUID handleBy, String providerName, BigDecimal repairCost, String issueDescription, String actionTaken, MaintenanceStatus status, LocalDate startDate, LocalDate endDate, UUID createdBy, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.assetId = assetId;
        this.handleBy = handleBy;
        this.providerName = providerName;
        this.repairCost = repairCost;
        this.issueDescription = issueDescription;
        this.actionTaken = actionTaken;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public UUID getHandleBy() {
        return handleBy;
    }

    public void setHandleBy(UUID handleBy) {
        this.handleBy = handleBy;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public BigDecimal getRepairCost() {
        return repairCost;
    }

    public void setRepairCost(BigDecimal repairCost) {
        this.repairCost = repairCost;
    }

    public String getIssueDescription() {
        return issueDescription;
    }

    public void setIssueDescription(String issueDescription) {
        this.issueDescription = issueDescription;
    }

    public String getActionTaken() {
        return actionTaken;
    }

    public void setActionTaken(String actionTaken) {
        this.actionTaken = actionTaken;
    }

    public MaintenanceStatus getStatus() {
        return status;
    }

    public void setStatus(MaintenanceStatus status) {
        this.status = status;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
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

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
