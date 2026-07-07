package com.nguyenhoa.itam.asset.application.dto;

import com.nguyenhoa.itam.asset.domain.AssetStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public class AssetRequest {
    @NotEmpty(message = "Tên tài sản không được để trống")
    @Size(max = 255, message = "Tên tài sản không được vượt quá 255 ký tự")
    private String name;

    @NotNull(message = "Danh mục thiết bị không được để trống")
    private UUID categoryId;

    @Size(max = 100, message = "Số serial không được vượt quá 100 ký tự")
    private String serialNumber;

    private LocalDate purchaseDate;
    private BigDecimal purchaseCost;
    
    @Size(max = 3, message = "Mã tiền tệ không được vượt quá 3 ký tự")
    private String currency;

    private String purchaseInvoiceUrl;
    private LocalDate warrantyExpiry;
    private Integer usefulLifeMonths;
    private AssetStatus status;
    private Map<String, Object> specification;

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

    public Integer getUsefulLifeMonths() {
        return usefulLifeMonths;
    }

    public void setUsefulLifeMonths(Integer usefulLifeMonths) {
        this.usefulLifeMonths = usefulLifeMonths;
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

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
