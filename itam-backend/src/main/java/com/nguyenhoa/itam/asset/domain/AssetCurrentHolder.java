package com.nguyenhoa.itam.asset.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.Immutable;

import java.time.Instant;
import java.util.UUID;

/**
 * Mapping for DB view
 */
@Entity
@Immutable
@Table(name = "v_asset_current_holder")
public class AssetCurrentHolder {
    @Id
    @Column(name = "asset_id")
    private UUID assetId;

    @Size(max = 50)
    @Column(name = "asset_code", length = 50)
    private String assetCode;

    @Size(max = 255)
    @Column(name = "name")
    private String name;

    @Column(name = "user_id")
    private UUID userId;

    @Size(max = 100)
    @Column(name = "full_name", length = 100)
    private String fullName;

    @Size(max = 255)
    @Column(name = "email")
    private String email;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Size(max = 20)
    @Column(name = "confirmation_status", length = 20)
    private String confirmationStatus;

    @Column(name = "notes", length = Integer.MAX_VALUE)
    private String notes;

    public UUID getAssetId() {
        return assetId;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public String getName() {
        return name;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public UUID getDepartmentId() {
        return departmentId;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public String getConfirmationStatus() {
        return confirmationStatus;
    }

    public String getNotes() {
        return notes;
    }

    protected AssetCurrentHolder() {
    }
}