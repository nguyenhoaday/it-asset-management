package com.nguyenhoa.itam.inventory.application.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class InventorySessionItemsResponse {
    private List<InventoryItemResponse> items;
    private Map<UUID, String> assetNames;
    private Map<UUID, String> assetCodes;
    private Map<UUID, String> userNames;

    public InventorySessionItemsResponse() {
    }

    public InventorySessionItemsResponse(List<InventoryItemResponse> items, Map<UUID, String> assetNames, Map<UUID, String> assetCodes, Map<UUID, String> userNames) {
        this.items = items;
        this.assetNames = assetNames;
        this.assetCodes = assetCodes;
        this.userNames = userNames;
    }

    public List<InventoryItemResponse> getItems() {
        return items;
    }

    public void setItems(List<InventoryItemResponse> items) {
        this.items = items;
    }

    public Map<UUID, String> getAssetNames() {
        return assetNames;
    }

    public void setAssetNames(Map<UUID, String> assetNames) {
        this.assetNames = assetNames;
    }

    public Map<UUID, String> getAssetCodes() {
        return assetCodes;
    }

    public void setAssetCodes(Map<UUID, String> assetCodes) {
        this.assetCodes = assetCodes;
    }

    public Map<UUID, String> getUserNames() {
        return userNames;
    }

    public void setUserNames(Map<UUID, String> userNames) {
        this.userNames = userNames;
    }
}
