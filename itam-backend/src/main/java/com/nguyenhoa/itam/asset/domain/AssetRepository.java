package com.nguyenhoa.itam.asset.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssetRepository extends JpaRepository<Asset, UUID> {
    Optional<Asset> findByIdAndDeletedAtIsNull(UUID id);
    boolean existsByCategoryId(UUID categoryId);
    boolean existsByIdAndDeletedAtIsNull(UUID id);

    @Query("SELECT COUNT(a) FROM Asset a " +
            "WHERE a.category.code = :categoryCode " +
            "AND EXTRACT(YEAR FROM a.createdAt) = :year")
    long countByCategoryCodeAndYear(@Param("categoryCode") String categoryCode, @Param("year") Integer year);

    @Query("""
        SELECT a FROM Asset a
        WHERE a.deletedAt IS NULL
        AND (:categoryId IS NULL OR a.category.id = :categoryId)
        AND (:status IS NULL OR a.status = :status)
        AND (CAST(:search AS string) IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
        OR LOWER(a.assetCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
        OR LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
    """)
    Page<Asset> searchAssets(@Param("categoryId") UUID categoryId, @Param("status") AssetStatus status, @Param("search") String search, Pageable pageable);

    // Đếm tổng số tài sản chưa bị xóa mềm
    long countByDeletedAtIsNull();

    long countByStatusAndDeletedAtIsNull(AssetStatus status);

    long countByDeletedAtIsNullAndWarrantyExpiryBetween(LocalDate start, LocalDate end);

    @Query("SELECT a.category.name, COUNT(a) FROM Asset a WHERE a.deletedAt IS NULL GROUP BY a.category.name")
    List<Object[]> countAssetsByCategory();

    // Lấy danh sách tất cả UUID của tài sản đang hoạt động (để đối chiếu khi đóng phiên)
    @Query("SELECT a.id FROM Asset a WHERE a.deletedAt IS NULL")
    List<UUID> findAllActiveAssetIds();

    List<Asset> findByDeletedAtIsNullAndWarrantyExpiryBetween(LocalDate start, LocalDate end);
    List<Asset> findByDeletedAtIsNull();
    List<Asset> findByDeletedAtIsNullAndIdIn(List<UUID> ids);
}
