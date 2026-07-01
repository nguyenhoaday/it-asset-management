package com.nguyenhoa.itam.report.infrastructure.web;

import com.nguyenhoa.itam.asset.application.service.AssetService;
import com.nguyenhoa.itam.asset.domain.AssetStatus;
import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.iam.application.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/analytics")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
public class AnalyticsController {

    private final AssetService assetService;
    private final UserService userService;

    public AnalyticsController(AssetService assetService, UserService userService) {
        this.assetService = assetService;
        this.userService = userService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        long totalAssets = assetService.countActiveAssets();
        long assignedAssets = assetService.countByStatus(AssetStatus.ASSIGNED);
        long maintenanceAssets = assetService.countByStatus(AssetStatus.MAINTENANCE);

        LocalDate today = LocalDate.now();
        LocalDate limitDate = today.plusDays(30);
        long expiringWarranty = assetService.countExpiringWarranty(today, limitDate);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAssets", totalAssets);
        summary.put("assignedAssets", assignedAssets);
        summary.put("maintenanceAssets", maintenanceAssets);
        summary.put("expiringWarrantyAssets", expiringWarranty);

        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategoryDistribution() {
        List<Object[]> results = assetService.getCategoryDistribution();
        List<Map<String, Object>> distribution = results.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("categoryName", row[0]);
            map.put("count", row[1]);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(distribution));
    }

    @GetMapping("/departments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDepartmentDistribution() {
        List<Object[]> results = assetService.getDepartmentAssetCounts();
        Map<UUID, String> deptNameMap = userService.getDepartmentNamesMap();

        List<Map<String, Object>> distribution = new ArrayList<>();
        for (Object[] row : results) {
            UUID deptId = (UUID) row[0];
            Long count = (Long) row[1];
            String deptName = deptNameMap.getOrDefault(deptId, "Unknown");

            Map<String, Object> map = new HashMap<>();
            map.put("departmentName", deptName);
            map.put("count", count);
            distribution.add(map);
        }

        return ResponseEntity.ok(ApiResponse.success(distribution));
    }
}
