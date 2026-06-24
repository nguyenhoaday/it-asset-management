package com.nguyenhoa.itam.license.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SoftwareLicenseRequest {
    @NotBlank(message = "Mã bản quyền không được để trống")
    private String licenseCode;

    @NotBlank(message = "Tên phần mềm không được để trống")
    private String name;

    private String licenseKey;

    @NotNull(message = "Tổng số lượng người dùng cho phép sử dụng không được để trống")
    @Min(value = 1, message =  "Số lượng người cho phép sử dụng phải tối thiểu là 1")
    private Integer totalSeats;

    private LocalDate expirationDate;
    private LocalDate purchaseDate;

    @DecimalMin(value = "0.0", message = "Chi phí mua phải lớn hơn hoặc bằng 0")
    private BigDecimal purchaseCost;

    private String purchaseInvoiceUrl;

    public SoftwareLicenseRequest() {}

    public SoftwareLicenseRequest(String licenseCode, String name, String licenseKey, Integer totalSeats, LocalDate expirationDate, LocalDate purchaseDate, BigDecimal purchaseCost, String purchaseInvoiceUrl) {
        this.licenseCode = licenseCode;
        this.name = name;
        this.licenseKey = licenseKey;
        this.totalSeats = totalSeats;
        this.expirationDate = expirationDate;
        this.purchaseDate = purchaseDate;
        this.purchaseCost = purchaseCost;
        this.purchaseInvoiceUrl = purchaseInvoiceUrl;
    }

    public String getLicenseCode() {
        return licenseCode;
    }

    public void setLicenseCode(String licenseCode) {
        this.licenseCode = licenseCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getTotalSeats() {
        return totalSeats;
    }

    public void setTotalSeats(Integer totalSeats) {
        this.totalSeats = totalSeats;
    }

    public String getLicenseKey() {
        return licenseKey;
    }

    public void setLicenseKey(String licenseKey) {
        this.licenseKey = licenseKey;
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
}
