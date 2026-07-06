package com.nguyenhoa.itam.license.application.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class MySoftwareLicenseResponse {
    private UUID allocationId;
    private UUID licenseId;
    private String licenseCode;
    private String licenseName;
    private String licenseKey;
    private LocalDate expirationDate;
    private Instant allocatedAt;
    private String notes;

    public MySoftwareLicenseResponse(UUID allocationId, UUID licenseId, String licenseCode, String licenseName, String licenseKey, LocalDate expirationDate, Instant allocatedAt, String notes) {
        this.allocationId = allocationId;
        this.licenseId = licenseId;
        this.licenseCode = licenseCode;
        this.licenseName = licenseName;
        this.licenseKey = licenseKey;
        this.expirationDate = expirationDate;
        this.allocatedAt = allocatedAt;
        this.notes = notes;
    }

    public UUID getAllocationId() {
        return allocationId;
    }

    public void setAllocationId(UUID allocationId) {
        this.allocationId = allocationId;
    }

    public UUID getLicenseId() {
        return licenseId;
    }

    public void setLicenseId(UUID licenseId) {
        this.licenseId = licenseId;
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

    public LocalDate getExpirationDate() {
        return expirationDate;
    }

    public void setExpirationDate(LocalDate expirationDate) {
        this.expirationDate = expirationDate;
    }

    public Instant getAllocatedAt() {
        return allocatedAt;
    }

    public void setAllocatedAt(Instant allocatedAt) {
        this.allocatedAt = allocatedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
