package com.nguyenhoa.itam.license.application.dto;

import java.time.Instant;
import java.util.UUID;

public class LicenseAllocationResponse {
    private UUID id;
    private UUID licenseId;
    private String licenseName;
    private UUID userId;
    private UUID assignedBy;
    private Instant allocatedAt;
    private Instant returnedAt;
    private String notes;
    private UUID createdBy;

    public LicenseAllocationResponse(UUID id, UUID licenseId, String licenseName, UUID userId, UUID assignedBy, Instant allocatedAt, Instant returnedAt, String notes, UUID createdBy) {
        this.id = id;
        this.licenseId = licenseId;
        this.licenseName = licenseName;
        this.userId = userId;
        this.assignedBy = assignedBy;
        this.allocatedAt = allocatedAt;
        this.returnedAt = returnedAt;
        this.notes = notes;
        this.createdBy = createdBy;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getLicenseId() {
        return licenseId;
    }

    public void setLicenseId(UUID licenseId) {
        this.licenseId = licenseId;
    }

    public String getLicenseName() {
        return licenseName;
    }

    public void setLicenseName(String licenseName) {
        this.licenseName = licenseName;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(UUID assignedBy) {
        this.assignedBy = assignedBy;
    }

    public Instant getAllocatedAt() {
        return allocatedAt;
    }

    public void setAllocatedAt(Instant allocatedAt) {
        this.allocatedAt = allocatedAt;
    }

    public Instant getReturnedAt() {
        return returnedAt;
    }

    public void setReturnedAt(Instant returnedAt) {
        this.returnedAt = returnedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }
}
