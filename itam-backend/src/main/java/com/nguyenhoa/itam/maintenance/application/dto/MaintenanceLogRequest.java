package com.nguyenhoa.itam.maintenance.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public class MaintenanceLogRequest {
    @NotNull(message = "ID thiết bị không được để trống")
    private UUID assetId;

    private String providerName;

    @NotBlank(message = "Mô tả lỗi không được để trống")
    private String issueDecription;

    private LocalDate startDate;

    public MaintenanceLogRequest(UUID assetId, String providerName, String issueDecription, LocalDate startDate) {
        this.assetId = assetId;
        this.providerName = providerName;
        this.issueDecription = issueDecription;
        this.startDate = startDate;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public void setAssetId(UUID assetId) {
        this.assetId = assetId;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public String getIssueDecription() {
        return issueDecription;
    }

    public void setIssueDecription(String issueDecription) {
        this.issueDecription = issueDecription;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
}
