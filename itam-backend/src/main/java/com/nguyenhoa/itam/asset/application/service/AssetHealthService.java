package com.nguyenhoa.itam.asset.application.service;

import com.nguyenhoa.itam.asset.application.dto.AssetHealthDto;
import com.nguyenhoa.itam.asset.domain.Asset;
import com.nguyenhoa.itam.asset.domain.AssetRepository;
import com.nguyenhoa.itam.asset.domain.AssetStatus;
import com.nguyenhoa.itam.asset.domain.ScoringPolicy;
import com.nguyenhoa.itam.asset.domain.ScoringPolicyRepository;
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
import java.util.Optional;
import java.util.UUID;

@Service
public class AssetHealthService {

    private final AssetRepository assetRepository;
    private final MaintenanceService maintenanceService;
    private final SystemConfigService systemConfigService;
    private final ScoringPolicyRepository scoringPolicyRepository;

    public AssetHealthService(AssetRepository assetRepository, MaintenanceService maintenanceService, SystemConfigService systemConfigService, ScoringPolicyRepository scoringPolicyRepository) {
        this.assetRepository = assetRepository;
        this.maintenanceService = maintenanceService;
        this.systemConfigService = systemConfigService;
        this.scoringPolicyRepository = scoringPolicyRepository;
    }

    @Transactional(readOnly = true)
    public AssetHealthDto calculateHealth(UUID assetId) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));

        // Kiểm tra loại trừ phần mềm / giấy phép ra khỏi tính điểm sức khỏe & khấu hao vật lý
        if (asset.getCategory() != null) {
            String catCode = asset.getCategory().getCode() != null ? asset.getCategory().getCode().trim().toUpperCase() : "";
            String catName = asset.getCategory().getName() != null ? asset.getCategory().getName().trim().toLowerCase() : "";
            if (catCode.equals("SOFTWARE") || catCode.equals("LICENSE") || catCode.contains("SOFT") || catCode.contains("LIC") ||
                catName.contains("software") || catName.contains("phần mềm") || catName.contains("giấy phép") || catName.contains("license")) {
                AssetHealthDto dto = new AssetHealthDto();
                dto.setFinalScore(100.0);
                dto.setHealthCondition("GOOD");
                dto.setCurrentDepreciatedValue(asset.getPurchaseCost() != null ? asset.getPurchaseCost() : BigDecimal.ZERO);
                dto.setProjectedReplacementDate(null);
                dto.setAppliedPolicyName("Không áp dụng (Phần mềm / Giấy phép)");
                Map<String, Integer> zeroWeights = new HashMap<>();
                zeroWeights.put("age", 0);
                zeroWeights.put("warranty", 0);
                zeroWeights.put("incident", 0);
                zeroWeights.put("condition", 0);
                dto.setAppliedWeights(zeroWeights);
                Map<String, Double> zeroFactors = new HashMap<>();
                zeroFactors.put("ageFactor", 100.0);
                zeroFactors.put("warrantyFactor", 100.0);
                zeroFactors.put("incidentFactor", 100.0);
                zeroFactors.put("conditionFactor", 100.0);
                dto.setFactors(zeroFactors);
                return dto;
            }
        }

        // Ưu tiên 1: Lấy chính sách chấm điểm từ Category
        // Ưu tiên 2: Lấy chính sách mặc định trong ScoringPolicy
        // Ưu tiên 3: Fallback về SystemConfigs cũ
        int wAge, wWarranty, wIncident, wCondition;
        String policyName;

        if (asset.getCategory() != null && asset.getCategory().getScoringPolicy() != null) {
            ScoringPolicy policy = asset.getCategory().getScoringPolicy();
            wAge = policy.getWeightAge();
            wWarranty = policy.getWeightWarranty();
            wIncident = policy.getWeightIncident();
            wCondition = policy.getWeightCondition();
            policyName = policy.getName();
        } else {
            Optional<ScoringPolicy> defaultPolicyOpt = scoringPolicyRepository.findByIsDefaultTrue();
            if (defaultPolicyOpt.isPresent()) {
                ScoringPolicy defPolicy = defaultPolicyOpt.get();
                wAge = defPolicy.getWeightAge();
                wWarranty = defPolicy.getWeightWarranty();
                wIncident = defPolicy.getWeightIncident();
                wCondition = defPolicy.getWeightCondition();
                policyName = defPolicy.getName() + " (Mặc định)";
            } else {
                wAge = systemConfigService.getConfigInt("health_weight_age", 30);
                wWarranty = systemConfigService.getConfigInt("health_weight_warranty", 20);
                wIncident = systemConfigService.getConfigInt("health_weight_incident", 30);
                wCondition = systemConfigService.getConfigInt("health_weight_condition", 20);
                policyName = "Cấu hình hệ thống cũ (Fallback)";
            }
        }

        double weightAge = wAge / 100.0;
        double weightWarranty = wWarranty / 100.0;
        double weightIncident = wIncident / 100.0;
        double weightCondition = wCondition / 100.0;

        int lifecycleMonths;
        if (asset.getUsefulLifeMonths() != null && asset.getUsefulLifeMonths() > 0) {
            lifecycleMonths = asset.getUsefulLifeMonths();
        } else if (asset.getCategory() != null && asset.getCategory().getDefaultUsefulLifeMonths() != null && asset.getCategory().getDefaultUsefulLifeMonths() > 0) {
            lifecycleMonths = asset.getCategory().getDefaultUsefulLifeMonths();
        } else {
            lifecycleMonths = systemConfigService.getConfigInt("asset_lifecycle_months", 60);
        }

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
        dto.setAppliedPolicyName(policyName);

        Map<String, Integer> appliedWeights = new HashMap<>();
        appliedWeights.put("age", wAge);
        appliedWeights.put("warranty", wWarranty);
        appliedWeights.put("incident", wIncident);
        appliedWeights.put("condition", wCondition);
        dto.setAppliedWeights(appliedWeights);

        Map<String, Double> factors = new HashMap<>();
        factors.put("ageFactor", Math.round(ageFactor * 100.0) / 100.0);
        factors.put("warrantyFactor", Math.round(warrantyFactor * 100.0) / 100.0);
        factors.put("incidentFactor", Math.round(incidentFactor * 100.0) / 100.0);
        factors.put("conditionFactor", Math.round(conditionFactor * 100.0) / 100.0);
        dto.setFactors(factors);

        return dto;
    }
}
