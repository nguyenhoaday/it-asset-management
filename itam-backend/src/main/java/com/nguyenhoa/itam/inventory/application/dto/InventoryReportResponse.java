package com.nguyenhoa.itam.inventory.application.dto;

import com.nguyenhoa.itam.inventory.domain.InventorySessionStatus;

import java.util.UUID;

public class InventoryReportResponse {
    private UUID sessionId;
    private String sessionTitle;
    private InventorySessionStatus status;
    private long totalAssets;
    private long scannedCount;
    private long foundCount;
    private long missingCount;
    private long damagedCount;
    private long unverifiedCount;

    public InventoryReportResponse(UUID sessionId, String sessionTitle, InventorySessionStatus status, long totalAssets, long scannedCount, long foundCount, long missingCount, long damagedCount, long unverifiedCount) {
        this.sessionId = sessionId;
        this.sessionTitle = sessionTitle;
        this.status = status;
        this.totalAssets = totalAssets;
        this.scannedCount = scannedCount;
        this.foundCount = foundCount;
        this.missingCount = missingCount;
        this.damagedCount = damagedCount;
        this.unverifiedCount = unverifiedCount;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public String getSessionTitle() {
        return sessionTitle;
    }

    public void setSessionTitle(String sessionTitle) {
        this.sessionTitle = sessionTitle;
    }

    public InventorySessionStatus getStatus() {
        return status;
    }

    public void setStatus(InventorySessionStatus status) {
        this.status = status;
    }

    public long getTotalAssets() {
        return totalAssets;
    }

    public void setTotalAssets(long totalAssets) {
        this.totalAssets = totalAssets;
    }

    public long getScannedCount() {
        return scannedCount;
    }

    public void setScannedCount(long scannedCount) {
        this.scannedCount = scannedCount;
    }

    public long getFoundCount() {
        return foundCount;
    }

    public void setFoundCount(long foundCount) {
        this.foundCount = foundCount;
    }

    public long getMissingCount() {
        return missingCount;
    }

    public void setMissingCount(long missingCount) {
        this.missingCount = missingCount;
    }

    public long getDamagedCount() {
        return damagedCount;
    }

    public void setDamagedCount(long damagedCount) {
        this.damagedCount = damagedCount;
    }

    public long getUnverifiedCount() {
        return unverifiedCount;
    }

    public void setUnverifiedCount(long unverifiedCount) {
        this.unverifiedCount = unverifiedCount;
    }
}
