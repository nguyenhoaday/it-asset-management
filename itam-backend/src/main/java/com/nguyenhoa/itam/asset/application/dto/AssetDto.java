package com.nguyenhoa.itam.asset.application.dto;

import com.nguyenhoa.itam.asset.domain.AssetStatus;

import java.time.LocalDate;
import java.util.UUID;

public class AssetDto {
    private UUID id;
    private String assetCode;
    private String name;
    private LocalDate warrantyExpiry;
    private AssetStatus status;

    public AssetDto(UUID id, String assetCode, String name, LocalDate warrantyExpiry, AssetStatus status) {
        this.id = id;
        this.assetCode = assetCode;
        this.name = name;
        this.warrantyExpiry = warrantyExpiry;
        this.status = status;
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
}
