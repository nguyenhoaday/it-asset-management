package com.nguyenhoa.itam.inventory.infrastructure.web;

import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import com.nguyenhoa.itam.inventory.application.dto.*;
import com.nguyenhoa.itam.inventory.application.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.nguyenhoa.itam.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.nguyenhoa.itam.asset.application.service.AssetService;
import com.nguyenhoa.itam.iam.application.service.UserService;
import com.nguyenhoa.itam.asset.application.dto.AssetResponse;
import com.nguyenhoa.itam.iam.application.dto.UserProfileResponse;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.Collections;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/inventory-sessions")
public class InventoryController {
    private final InventoryService inventoryService;
    private final AssetService assetService;
    private final UserService userService;

    public InventoryController(InventoryService inventoryService, AssetService assetService, UserService userService) {
        this.inventoryService = inventoryService;
        this.assetService = assetService;
        this.userService = userService;
    }

    // Tạo đợt kiểm kê mới
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<InventorySessionResponse>> createInventorySession(@Valid @RequestBody InventorySessionRequest request,
                                                                                        @AuthenticationPrincipal UserPrincipal userPrincipal) {
        InventorySessionResponse response = inventoryService.createSession(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // Ghi nhận kết quả quét 1 tài sản
    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<InventoryItemResponse>> checkItem(@PathVariable UUID id,
                                                                                  @Valid @RequestBody InventoryItemRequest request,
                                                                                  @AuthenticationPrincipal UserPrincipal userPrincipal) {
        InventoryItemResponse response = inventoryService.checkItem(id, request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // Đồng bộ quét hàng loạt
    @PostMapping("/{id}/items/batch")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<BatchScanResultResponse>> checkItemsBatch(@PathVariable UUID id,
                                                                                @Valid @RequestBody List<InventoryItemRequest> requests,
                                                                                @AuthenticationPrincipal UserPrincipal userPrincipal) {
        BatchScanResultResponse response = inventoryService.checkItemsBatch(id, requests, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Đóng phiên kiểm kê
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<InventorySessionResponse>> closeSession(@PathVariable UUID id) {
        InventorySessionResponse response = inventoryService.closeSession(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Xuất báo cáo đợt kiểm kê
    @GetMapping("/{id}/report")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<InventoryReportResponse>> getReport(@PathVariable UUID id) {
        InventoryReportResponse response = inventoryService.getReport(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Lấy danh sách tất cả đợt kiểm kê
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<PageResponse<InventorySessionResponse>>> getAllSessions(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<InventorySessionResponse> response = inventoryService.getAllSessions(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Lấy đợt kiểm kê đang hoạt động
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<InventorySessionResponse>> getActiveSession() {
        InventorySessionResponse response = inventoryService.getActiveSession();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Lấy danh sách kết quả quét của đợt kiểm kê
    @GetMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<PageResponse<InventoryItemResponse>>> getSessionItems(
            @PathVariable UUID id,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        
        com.nguyenhoa.itam.inventory.domain.CheckedStatus checkedStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                checkedStatus = com.nguyenhoa.itam.inventory.domain.CheckedStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Bỏ qua trạng thái không hợp lệ
            }
        }

        List<UUID> matchingAssetIds = new java.util.ArrayList<>();
        boolean hasSearch = search != null && !search.trim().isEmpty();
        if (hasSearch) {
            matchingAssetIds = assetService.getAssets(null, null, search, null, PageRequest.of(0, 1000))
                    .getContent().stream()
                    .map(com.nguyenhoa.itam.asset.application.dto.AssetResponse::getId)
                    .collect(Collectors.toList());
            
            if (matchingAssetIds.isEmpty()) {
                PageResponse<InventoryItemResponse> emptyPage = new PageResponse<>(
                        new org.springframework.data.domain.PageImpl<>(Collections.emptyList(), pageable, 0)
                );
                return ResponseEntity.ok(ApiResponse.success(emptyPage));
            }
        }

        PageResponse<InventoryItemResponse> itemsPage = inventoryService.getInventoryItemsPaginated(
                id, checkedStatus, hasSearch, matchingAssetIds, pageable);

        List<InventoryItemResponse> content = itemsPage.getContent();
        if (content != null && !content.isEmpty()) {
            List<UUID> assetIds = content.stream()
                    .map(InventoryItemResponse::getAssetId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            List<AssetResponse> assets = assetService.getAssetsByIds(assetIds);
            Map<UUID, String> assetNames = assets.stream().collect(Collectors.toMap(AssetResponse::getId, AssetResponse::getName, (a, b) -> a));
            Map<UUID, String> assetCodes = assets.stream().collect(Collectors.toMap(AssetResponse::getId, AssetResponse::getAssetCode, (a, b) -> a));

            List<UUID> userIds = content.stream()
                    .map(InventoryItemResponse::getCheckedBy)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            Map<UUID, String> userNames = new HashMap<>();
            if (!userIds.isEmpty()) {
                Map<UUID, UserProfileResponse> profiles = userService.getUserProfilesMap(userIds);
                userNames = profiles.entrySet().stream()
                        .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getFullName()));
            }

            for (InventoryItemResponse responseItem : content) {
                responseItem.setAssetName(assetNames.getOrDefault(responseItem.getAssetId(), "N/A"));
                responseItem.setAssetCode(assetCodes.getOrDefault(responseItem.getAssetId(), "N/A"));
                responseItem.setCheckedByName(userNames.getOrDefault(responseItem.getCheckedBy(), "Hệ thống"));
            }
        }

        return ResponseEntity.ok(ApiResponse.success(itemsPage));
    }
}
