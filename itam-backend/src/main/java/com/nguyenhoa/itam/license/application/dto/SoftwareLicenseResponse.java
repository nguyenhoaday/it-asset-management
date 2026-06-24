package com.nguyenhoa.itam.license.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class SoftwareLicenseResponse {
    private UUID id;
    private String licenseCode;
    private String licenseName;
    private String licenseKey;
    private Integer totalSeats;
    private Integer usedSeats;
    private Integer availableSeats;
    private LocalDate expirationDate;
    private LocalDate purchaseDate;
    private BigDecimal purchaseCost;
    private String purchaseInvoiceUrl;
    private boolean isActive;
    private UUID createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    public SoftwareLicenseResponse() {}

    public SoftwareLicenseResponse(UUID id, String licenseCode, String licenseName, String licenseKey, Integer totalSeats, Integer usedSeats, Integer availableSeats, LocalDate expirationDate, LocalDate purchaseDate, BigDecimal purchaseCost, String purchaseInvoiceUrl, boolean isActive, UUID createdBy, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.licenseCode = licenseCode;
        this.licenseName = licenseName;
        this.licenseKey = licenseKey;
        this.totalSeats = totalSeats;
        this.usedSeats = usedSeats;
        this.availableSeats = availableSeats;
        this.expirationDate = expirationDate;
        this.purchaseDate = purchaseDate;
        this.purchaseCost = purchaseCost;
        this.purchaseInvoiceUrl = purchaseInvoiceUrl;
        this.isActive = isActive;
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

    public String getLicenseCode() {
        return licenseCode;
    }

    public void setLicenseCode(String licenseCode) {
        this.licenseCode = licenseCode;
    }

    public String getLicenseName() {
        return licenseName;
    }

    public void setLicenseName(String licenseName) {
        this.licenseName = licenseName;
    }

    public String getLicenseKey() {
        return licenseKey;
    }

    public void setLicenseKey(String licenseKey) {
        this.licenseKey = licenseKey;
    }

    public Integer getTotalSeats() {
        return totalSeats;
    }

    public void setTotalSeats(Integer totalSeats) {
        this.totalSeats = totalSeats;
    }

    public Integer getUsedSeats() {
        return usedSeats;
    }

    public void setUsedSeats(Integer usedSeats) {
        this.usedSeats = usedSeats;
    }

    public Integer getAvailableSeats() {
        return availableSeats;
    }

    public void setAvailableSeats(Integer availableSeats) {
        this.availableSeats = availableSeats;
    }

    public LocalDate getExpirationDate() {
        return expirationDate;
    }

    public void setExpirationDate(LocalDate expirationDate) {
        this.expirationDate = expirationDate;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public BigDecimal getPurchaseCost() {
        return purchaseCost;
    }

    public void setPurchaseCost(BigDecimal purchaseCost) {
        this.purchaseCost = purchaseCost;
    }

    public String getPurchaseInvoiceUrl() {
        return purchaseInvoiceUrl;
    }

    public void setPurchaseInvoiceUrl(String purchaseInvoiceUrl) {
        this.purchaseInvoiceUrl = purchaseInvoiceUrl;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
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
