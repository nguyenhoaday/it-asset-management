package com.nguyenhoa.itam.inventory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {
    // Kiểm tra sự tồn tại của thiết bị đã quét trong session
    boolean existsBySessionIdAndAsset(UUID sessionId, UUID asset);

    // Đếm số lượng theo trạng thái kiểm tra (FOUND, MISSING, DAMAGED, UNVERIFIED)
    long countBySessionIdAndCheckedStatus(UUID sessionId, CheckedStatus checkedStatus);

    // Lấy danh sách thiết bị đã quét của session
    List<InventoryItem> findBySessionId(UUID sessionId);
}
