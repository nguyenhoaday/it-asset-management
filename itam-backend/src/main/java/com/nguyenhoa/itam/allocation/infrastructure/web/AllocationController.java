package com.nguyenhoa.itam.allocation.infrastructure.web;

import com.nguyenhoa.itam.allocation.application.dto.AllocationRequest;
import com.nguyenhoa.itam.allocation.application.dto.AllocationResponse;
import com.nguyenhoa.itam.allocation.application.dto.MyAssetResponse;
import com.nguyenhoa.itam.allocation.application.dto.TransferRequest;
import com.nguyenhoa.itam.allocation.application.service.AllocationService;
import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.nguyenhoa.itam.allocation.domain.ConfirmationStatus;
import com.nguyenhoa.itam.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class AllocationController {
    private final AllocationService allocationService;

    public AllocationController(AllocationService allocationService) {
        this.allocationService = allocationService;
    }

    @PostMapping("/allocations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<AllocationResponse>> assignAsset(@Valid @RequestBody AllocationRequest allocationRequest,
                                                                       @AuthenticationPrincipal UserPrincipal creator) {
        AllocationResponse allocationResponse = allocationService.assignAsset(allocationRequest, creator.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(allocationResponse));
    }

    @PostMapping("/assets/{assetId}/return")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<AllocationResponse>> returnAsset(@PathVariable("assetId") UUID assetId,
                                                                       @RequestParam(required = false) String notes,
                                                                       @AuthenticationPrincipal UserPrincipal creator) {
        AllocationResponse allocationResponse = allocationService.returnAsset(assetId, notes, creator.getId());
        return ResponseEntity.ok(ApiResponse.success(allocationResponse));
    }

    @PostMapping("/allocations/transfers")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<AllocationResponse>> transferAsset(@Valid @RequestBody TransferRequest transferRequest,
                                                                         @AuthenticationPrincipal UserPrincipal creator) {
        AllocationResponse allocationResponse = allocationService.transferAsset(transferRequest, creator.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(allocationResponse));
    }

    @PostMapping("/allocations/{id}/confirm")
    public ResponseEntity<ApiResponse<String>> confirmAllocation(@PathVariable("id") UUID allocationId,
                                                                 @AuthenticationPrincipal UserPrincipal user) {
        allocationService.confirmAllocation(allocationId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Xác nhận bàn giao thiết bị thành công"));
    }

    @PostMapping("/allocations/{id}/reject")
    public ResponseEntity<ApiResponse<String>> rejectAllocation(@PathVariable("id") UUID allocationId,
                                                                @AuthenticationPrincipal UserPrincipal user) {
        allocationService.rejectAllocation(allocationId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Từ chối nhận bàn giao thiết bị thành công"));
    }

    @GetMapping("/users/me/assets")
    public ResponseEntity<ApiResponse<List<MyAssetResponse>>> getMyAssets(@AuthenticationPrincipal UserPrincipal user) {
        List<MyAssetResponse> myAssets = allocationService.getMyAssets(user.getId());

        return ResponseEntity.ok(ApiResponse.success(myAssets));
    }

    @GetMapping("/assets/{assetId}/allocations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<List<AllocationResponse>>> getAssetHistory(@PathVariable("assetId") UUID assetId) {
        List<AllocationResponse> history = allocationService.getAssetHistory(assetId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/allocations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<PageResponse<AllocationResponse>>> getAllAllocations(
            @RequestParam(value = "status", required = false) ConfirmationStatus status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("eventTime").descending());
        PageResponse<AllocationResponse> allocations = allocationService.getAllAllocations(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(allocations));
    }
}
