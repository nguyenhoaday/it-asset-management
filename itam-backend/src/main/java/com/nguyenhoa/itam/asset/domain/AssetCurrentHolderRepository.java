package com.nguyenhoa.itam.asset.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssetCurrentHolderRepository extends JpaRepository<AssetCurrentHolder, UUID> {
    List<AssetCurrentHolder> findByUserId(UUID userId);

    @org.springframework.data.jpa.repository.Query(
        "SELECT h.departmentId, COUNT(h) FROM AssetCurrentHolder h " +
        "WHERE h.confirmationStatus = 'CONFIRMED' AND h.departmentId IS NOT NULL " +
        "GROUP BY h.departmentId"
    )
    List<Object[]> countAssetsByDepartmentId();
}
