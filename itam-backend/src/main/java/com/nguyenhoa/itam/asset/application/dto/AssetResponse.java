package com.nguyenhoa.itam.asset.application.dto;

import com.nguyenhoa.itam.asset.domain.AssetStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public class AssetResponse {
    private UUID id;
    private String assetCode;
    private String name;
    private UUID categoryId;
    private String categoryName;
    private String serialNumber;
    private LocalDate purchaseDate;
    private BigDecimal purchaseCost;
    private String purchaseInvoiceUrl;
    private LocalDate warrantyExpiry;
    private AssetStatus status;
    private Map<String, Object> specification;
    private String qrCodeUrl;
    private UUID createdBy;
    private Instant createdAt;
    private Instant updatedAt;
    private String currency;
    private String assignedTo;

    public AssetResponse(UUID id, String assetCode, String name, UUID categoryId, String categoryName, String serialNumber, LocalDate purchaseDate, BigDecimal purchaseCost, String purchaseInvoiceUrl, LocalDate warrantyExpiry, AssetStatus status, Map<String, Object> specification, String qrCodeUrl, UUID createdBy, Instant createdAt, Instant updatedAt, String currency, String assignedTo) {
        this.id = id;
        this.assetCode = assetCode;
        this.name = name;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.serialNumber = serialNumber;
        this.purchaseDate = purchaseDate;
        this.purchaseCost = purchaseCost;
        this.purchaseInvoiceUrl = purchaseInvoiceUrl;
        this.warrantyExpiry = warrantyExpiry;
        this.status = status;
        this.specification = specification;
        this.qrCodeUrl = qrCodeUrl;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.currency = currency;
        this.assignedTo = assignedTo;
    }


    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public void setAssetCode(String assetCode) {
        this.assetCode = assetCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public UUID getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(UUID categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
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

    public LocalDate getWarrantyExpiry() {
        return warrantyExpiry;
    }

    public void setWarrantyExpiry(LocalDate warrantyExpiry) {
        this.warrantyExpiry = warrantyExpiry;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
    }

    public Map<String, Object> getSpecification() {
        return specification;
    }

    public void setSpecification(Map<String, Object> specification) {
        this.specification = specification;
    }

    public String getQrCodeUrl() {
        return qrCodeUrl;
    }

    public void setQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
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

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }
}
