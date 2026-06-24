package com.nguyenhoa.itam.license.application.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class LicenseAllocationRequest {
    @NotNull(message = "ID người dùng không được để trống")
    private UUID userId;

    private String notes;

    public LicenseAllocationRequest() {}

    public LicenseAllocationRequest(UUID userId, String notes) {
        this.userId = userId;
        this.notes = notes;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
