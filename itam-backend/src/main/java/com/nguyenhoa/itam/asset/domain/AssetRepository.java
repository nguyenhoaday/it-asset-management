package com.nguyenhoa.itam.asset.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssetRepository extends JpaRepository<Asset, UUID>, JpaSpecificationExecutor<Asset> {
    @EntityGraph(attributePaths = {"category"})
    Optional<Asset> findByIdAndDeletedAtIsNull(UUID id);
    boolean existsByCategoryId(UUID categoryId);
    boolean existsByIdAndDeletedAtIsNull(UUID id);

    @Query("SELECT COUNT(a) FROM Asset a " +
            "WHERE a.category.code = :categoryCode " +
            "AND EXTRACT(YEAR FROM a.createdAt) = :year")
    long countByCategoryCodeAndYear(@Param("categoryCode") String categoryCode, @Param("year") Integer year);



    // Đếm tổng số tài sản chưa bị xóa mềm
    long countByDeletedAtIsNull();

    long countByStatusAndDeletedAtIsNull(AssetStatus status);

    long countByDeletedAtIsNullAndWarrantyExpiryBetween(LocalDate start, LocalDate end);

    @Query("SELECT a.category.name, COUNT(a) FROM Asset a WHERE a.deletedAt IS NULL GROUP BY a.category.name")
    List<Object[]> countAssetsByCategory();

    // Lấy danh sách tất cả UUID của tài sản đang hoạt động (để đối chiếu khi đóng phiên)
    @Query("SELECT a.id FROM Asset a WHERE a.deletedAt IS NULL")
    List<UUID> findAllActiveAssetIds();

    @EntityGraph(attributePaths = {"category"})
    List<Asset> findByDeletedAtIsNullAndWarrantyExpiryBetween(LocalDate start, LocalDate end);
    
    @EntityGraph(attributePaths = {"category"})
    List<Asset> findByDeletedAtIsNull();
    
    @EntityGraph(attributePaths = {"category"})
    List<Asset> findByDeletedAtIsNullAndIdIn(List<UUID> ids);
}
