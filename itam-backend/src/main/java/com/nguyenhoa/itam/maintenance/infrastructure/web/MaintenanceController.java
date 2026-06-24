package com.nguyenhoa.itam.maintenance.infrastructure.web;

import com.nguyenhoa.itam.asset.application.service.AssetService;
import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import com.nguyenhoa.itam.maintenance.application.dto.CompleteMaintenanceRequest;
import com.nguyenhoa.itam.maintenance.application.dto.MaintenanceLogRequest;
import com.nguyenhoa.itam.maintenance.application.dto.MaintenanceLogResponse;
import com.nguyenhoa.itam.maintenance.application.service.MaintenanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MaintenanceController {
    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @PostMapping("/maintenances")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<MaintenanceLogResponse>> startMaintenance(@Valid @RequestBody MaintenanceLogRequest request,
                                                                                @AuthenticationPrincipal UserPrincipal userPrincipal) {
        MaintenanceLogResponse response = maintenanceService.startMaintenance(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PatchMapping("/maintenances/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<MaintenanceLogResponse>> completeMaintenance(@PathVariable UUID id,
                                                                                   @Valid @RequestBody CompleteMaintenanceRequest request) {
        MaintenanceLogResponse response = maintenanceService.completeMaintenance(id, request);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(response));
    }

    @GetMapping("/assets/{assetId}/maintenances")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<List<MaintenanceLogResponse>>> getAssetHistory(@PathVariable UUID assetId) {
        List<MaintenanceLogResponse> response = maintenanceService.getAssetHistory(assetId);
        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(response));
    }
}
