package com.nguyenhoa.itam.asset.application.service;

import com.nguyenhoa.itam.asset.application.dto.AssetHealthDto;
import com.nguyenhoa.itam.asset.domain.Asset;
import com.nguyenhoa.itam.asset.domain.AssetRepository;
import com.nguyenhoa.itam.asset.domain.AssetStatus;
import com.nguyenhoa.itam.maintenance.application.service.MaintenanceService;
import com.nguyenhoa.itam.systemconfig.application.service.SystemConfigService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssetHealthServiceTest {

    @Mock
    private AssetRepository assetRepository;

    @Mock
    private MaintenanceService maintenanceService;

    @Mock
    private SystemConfigService systemConfigService;

    @InjectMocks
    private AssetHealthService assetHealthService;

    private UUID assetId;
    private Asset asset;

    @BeforeEach
    void setUp() {
        assetId = UUID.randomUUID();
        asset = new Asset();
        asset.setId(assetId);
        asset.setName("Dell XPS 15");
        asset.setStatus(AssetStatus.AVAILABLE);
        asset.setPurchaseDate(LocalDate.now().minusMonths(12)); // Đã dùng 12 tháng
        asset.setWarrantyExpiry(LocalDate.now().plusMonths(24)); // Còn 24 tháng bảo hành
        asset.setPurchaseCost(new BigDecimal("30000000")); // 30 triệu
    }

    @Test
    @DisplayName("Tính điểm sức khỏe và khấu hao cho thiết bị mới mua (1 năm, còn bảo hành, 0 lần sửa)")
    void testCalculateHealth_NewAsset_ReturnsGoodHealth() {
        when(assetRepository.findByIdAndDeletedAtIsNull(assetId)).thenReturn(Optional.of(asset));
        when(systemConfigService.getConfigInt(eq("health_weight_age"), anyInt())).thenReturn(30);
        when(systemConfigService.getConfigInt(eq("health_weight_warranty"), anyInt())).thenReturn(20);
        when(systemConfigService.getConfigInt(eq("health_weight_incident"), anyInt())).thenReturn(30);
        when(systemConfigService.getConfigInt(eq("health_weight_condition"), anyInt())).thenReturn(20);
        when(systemConfigService.getConfigInt(eq("asset_lifecycle_months"), anyInt())).thenReturn(60);
        when(maintenanceService.getMaintenanceCountByAsset(assetId)).thenReturn(0L);
        
        AssetHealthDto result = assetHealthService.calculateHealth(assetId);
        assertNotNull(result);
        assertEquals("GOOD", result.getHealthCondition());
        assertTrue(result.getFinalScore() >= 80.0, "Điểm sức khỏe phải >= 80");
        assertNotNull(result.getCurrentDepreciatedValue());
        assertTrue(result.getCurrentDepreciatedValue().compareTo(new BigDecimal("24000000")) <= 0, "Giá trị khấu hao phải giảm sau 12 tháng");
    }

    @Test
    @DisplayName("Tính điểm sức khỏe cho thiết bị hết bảo hành và bảo trì nhiều lần")
    void testCalculateHealth_OldAssetWithMaintenances_ReturnsFairOrCritical() {
        asset.setWarrantyExpiry(LocalDate.now().minusMonths(6)); // Hết bảo hành
        asset.setStatus(AssetStatus.MAINTENANCE);
        when(assetRepository.findByIdAndDeletedAtIsNull(assetId)).thenReturn(Optional.of(asset));
        when(systemConfigService.getConfigInt(eq("health_weight_age"), anyInt())).thenReturn(30);
        when(systemConfigService.getConfigInt(eq("health_weight_warranty"), anyInt())).thenReturn(20);
        when(systemConfigService.getConfigInt(eq("health_weight_incident"), anyInt())).thenReturn(30);
        when(systemConfigService.getConfigInt(eq("health_weight_condition"), anyInt())).thenReturn(20);
        when(systemConfigService.getConfigInt(eq("asset_lifecycle_months"), anyInt())).thenReturn(60);
        when(maintenanceService.getMaintenanceCountByAsset(assetId)).thenReturn(3L); // Đã sửa 3 lần

        AssetHealthDto result = assetHealthService.calculateHealth(assetId);

        assertNotNull(result);
        assertTrue(result.getFinalScore() < 70.0, "Điểm sức khỏe phải giảm khi hết bảo hành và sửa nhiều lần");
        assertEquals(0.0, result.getFactors().get("warrantyFactor"), "Điểm bảo hành phải bằng 0");
    }
}
