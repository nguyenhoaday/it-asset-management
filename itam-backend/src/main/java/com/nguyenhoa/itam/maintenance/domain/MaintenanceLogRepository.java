package com.nguyenhoa.itam.maintenance.domain;

import com.nguyenhoa.itam.asset.domain.Asset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MaintenanceLogRepository extends JpaRepository<MaintenanceLog, UUID> {
    // Tìm lịch sử bảo trì của một thiết bị, sắp xếp mới nhất trước
    List<MaintenanceLog> findByAssetOrderByCreatedAtDesc(UUID assetId);
}
