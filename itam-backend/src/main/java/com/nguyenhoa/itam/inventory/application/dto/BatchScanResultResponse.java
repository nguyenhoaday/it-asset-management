package com.nguyenhoa.itam.inventory.application.dto;

import java.util.List;
import java.util.UUID;

public class BatchScanResultResponse {
    private int totalProcessed;
    private int successCount;
    private int duplicateCount;
    private List<UUID> successfulAssetIds;
    private List<UUID> duplicateAssetIds;

    public BatchScanResultResponse(int totalProcessed, int successCount, int duplicateCount, List<UUID> successfulAssetIds, List<UUID> duplicateAssetIds) {
        this.totalProcessed = totalProcessed;
        this.successCount = successCount;
        this.duplicateCount = duplicateCount;
        this.successfulAssetIds = successfulAssetIds;
        this.duplicateAssetIds = duplicateAssetIds;
    }

    public int getTotalProcessed() {
        return totalProcessed;
    }

    public void setTotalProcessed(int totalProcessed) {
        this.totalProcessed = totalProcessed;
    }

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public int getDuplicateCount() {
        return duplicateCount;
    }

    public void setDuplicateCount(int duplicateCount) {
        this.duplicateCount = duplicateCount;
    }

    public List<UUID> getSuccessfulAssetIds() {
        return successfulAssetIds;
    }

    public void setSuccessfulAssetIds(List<UUID> successfulAssetIds) {
        this.successfulAssetIds = successfulAssetIds;
    }

    public List<UUID> getDuplicateAssetIds() {
        return duplicateAssetIds;
    }

    public void setDuplicateAssetIds(List<UUID> duplicateAssetIds) {
        this.duplicateAssetIds = duplicateAssetIds;
    }
}
