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
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory-sessions")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
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
    public ResponseEntity<ApiResponse<InventorySessionResponse>> closeSession(@PathVariable UUID id,
                                                                              @AuthenticationPrincipal UserPrincipal userPrincipal) {
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
}
