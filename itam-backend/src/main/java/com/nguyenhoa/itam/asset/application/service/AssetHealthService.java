package com.nguyenhoa.itam.asset.application.service;

import com.nguyenhoa.itam.asset.application.dto.AssetHealthDto;
import com.nguyenhoa.itam.asset.domain.Asset;
import com.nguyenhoa.itam.asset.domain.AssetRepository;
import com.nguyenhoa.itam.asset.domain.AssetStatus;
import com.nguyenhoa.itam.common.exception.ResourceNotFoundException;
import com.nguyenhoa.itam.maintenance.application.service.MaintenanceService;
import com.nguyenhoa.itam.systemconfig.application.service.SystemConfigService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AssetHealthService {

    private final AssetRepository assetRepository;
    private final MaintenanceService maintenanceService;
    private final SystemConfigService systemConfigService;

    public AssetHealthService(AssetRepository assetRepository, MaintenanceService maintenanceService, SystemConfigService systemConfigService) {
        this.assetRepository = assetRepository;
        this.maintenanceService = maintenanceService;
        this.systemConfigService = systemConfigService;
    }

    @Transactional(readOnly = true)
    public AssetHealthDto calculateHealth(UUID assetId) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));

        double weightAge = systemConfigService.getConfigInt("health_weight_age", 30) / 100.0;
        double weightWarranty = systemConfigService.getConfigInt("health_weight_warranty", 20) / 100.0;
        double weightIncident = systemConfigService.getConfigInt("health_weight_incident", 30) / 100.0;
        double weightCondition = systemConfigService.getConfigInt("health_weight_condition", 20) / 100.0;
        int lifecycleMonths = systemConfigService.getConfigInt("asset_lifecycle_months", 60);

        // Điểm khấu hao theo thời gian sử dụng
        double ageFactor = 100.0;
        LocalDate now = LocalDate.now();
        if (asset.getPurchaseDate() != null) {
            long monthsUsed = ChronoUnit.MONTHS.between(asset.getPurchaseDate(), now);
            if (monthsUsed >= lifecycleMonths) {
                ageFactor = 0.0;
            } else if (monthsUsed > 0) {
                ageFactor = 100.0 - ((double) monthsUsed / lifecycleMonths * 100.0);
            }
        }

        double warrantyFactor = 100.0;
        if (asset.getWarrantyExpiry() != null && asset.getWarrantyExpiry().isBefore(now)) {
            warrantyFactor = 0.0; // Hết hạn bảo hành thì điểm về 0
        }

        // Điểm sự cố/bảo trì
        long maintenanceCount = maintenanceService.getMaintenanceCountByAsset(assetId);
        // giảm theo hàm mũ với hệ số 0.8 cho mỗi lần sửa
        double incidentFactor = 100.0 * Math.pow(0.8, maintenanceCount);

        // Điểm trạng thái thiết bị
        double conditionFactor = 100.0;
        if (asset.getStatus() == AssetStatus.MAINTENANCE) {
            conditionFactor = 50.0;
        } else if (asset.getStatus() == AssetStatus.BROKEN || asset.getStatus() == AssetStatus.LOST || asset.getStatus() == AssetStatus.RETIRED) {
            conditionFactor = 0.0;
        }

        // Điểm theo trọng số
        double finalScore = (weightAge * ageFactor) + 
                            (weightWarranty * warrantyFactor) + 
                            (weightIncident * incidentFactor) + 
                            (weightCondition * conditionFactor);

        String healthCondition = "GOOD";
        if (finalScore < 40) {
            healthCondition = "CRITICAL";
        } else if (finalScore < 70) {
            healthCondition = "FAIR";
        }

        // Tính gia trị khấu hao
        BigDecimal depreciatedValue = asset.getPurchaseCost();
        if (depreciatedValue != null && asset.getPurchaseDate() != null) {
            long monthsUsed = ChronoUnit.MONTHS.between(asset.getPurchaseDate(), now);
            if (monthsUsed >= lifecycleMonths) {
                depreciatedValue = BigDecimal.ZERO;
            } else if (monthsUsed > 0) {
                BigDecimal monthlyDepreciation = asset.getPurchaseCost().divide(BigDecimal.valueOf(lifecycleMonths), 2, RoundingMode.HALF_UP);
                BigDecimal totalDepreciated = monthlyDepreciation.multiply(BigDecimal.valueOf(monthsUsed));
                depreciatedValue = asset.getPurchaseCost().subtract(totalDepreciated);
                if (depreciatedValue.compareTo(BigDecimal.ZERO) < 0) {
                    depreciatedValue = BigDecimal.ZERO;
                }
            }
        }

        // Dự kiến ngày thay thế
        String projectedReplacementDate = null;
        if (asset.getPurchaseDate() != null) {
            projectedReplacementDate = asset.getPurchaseDate().plusMonths(lifecycleMonths).toString();
        }

        AssetHealthDto dto = new AssetHealthDto();
        dto.setFinalScore(Math.round(finalScore * 100.0) / 100.0);
        dto.setHealthCondition(healthCondition);
        dto.setCurrentDepreciatedValue(depreciatedValue);
        dto.setProjectedReplacementDate(projectedReplacementDate);

        Map<String, Double> factors = new HashMap<>();
        factors.put("ageFactor", Math.round(ageFactor * 100.0) / 100.0);
        factors.put("warrantyFactor", Math.round(warrantyFactor * 100.0) / 100.0);
        factors.put("incidentFactor", Math.round(incidentFactor * 100.0) / 100.0);
        factors.put("conditionFactor", Math.round(conditionFactor * 100.0) / 100.0);
        dto.setFactors(factors);

        return dto;
    }
}
