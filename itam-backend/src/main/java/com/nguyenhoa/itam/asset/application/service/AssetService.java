package com.nguyenhoa.itam.asset.application.service;

import com.nguyenhoa.itam.asset.application.dto.AssetDto;
import com.nguyenhoa.itam.asset.application.dto.AssetRequest;
import com.nguyenhoa.itam.asset.application.dto.AssetResponse;
import com.nguyenhoa.itam.asset.domain.*;
import com.nguyenhoa.itam.common.dto.PageResponse;
import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.common.util.QRCodeGenerator;
import com.nguyenhoa.itam.audit.application.service.AuditLogService;
import com.nguyenhoa.itam.attachment.application.service.AttachmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssetService {
    private final AssetRepository assetRepository;
    private final CategoryRepository categoryRepository;
    private final AssetCurrentHolderRepository assetCurrentHolderRepository;
    private final QRCodeGenerator qrCodeGenerator;
    private final AuditLogService auditLogService;
    private final AttachmentService attachmentService;

    public AssetService(AssetRepository assetRepository, CategoryRepository categoryRepository, AssetCurrentHolderRepository assetCurrentHolderRepository, QRCodeGenerator qrCodeGenerator, AuditLogService auditLogService, AttachmentService attachmentService) {
        this.assetRepository = assetRepository;
        this.categoryRepository = categoryRepository;
        this.assetCurrentHolderRepository = assetCurrentHolderRepository;
        this.qrCodeGenerator = qrCodeGenerator;
        this.auditLogService = auditLogService;
        this.attachmentService = attachmentService;
    }

    // Lấy chi tiết tài sản theo ID (loại bỏ tài sản đã xóa mềm)
    @Transactional(readOnly = true)
    public AssetResponse getAssetById(UUID id) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
                new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản yêu cầu", HttpStatus.NOT_FOUND));
        return mapToResponse(asset);
    }

    // Tìm kiếm và phân trang
    @Transactional(readOnly = true)
    public PageResponse<AssetResponse> getAssets(UUID categoryId, AssetStatus status, String search, Boolean warrantyExpiring, Pageable pageable) {
        Specification<Asset> spec = (root, query, cb) -> {
            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("category", JoinType.LEFT);
            }
            
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.trim().isEmpty()) {
                String likeSearch = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), likeSearch),
                    cb.like(cb.lower(root.get("assetCode")), likeSearch),
                    cb.like(cb.lower(root.get("serialNumber")), likeSearch)
                ));
            }
            if (Boolean.TRUE.equals(warrantyExpiring)) {
                predicates.add(cb.lessThanOrEqualTo(root.get("warrantyExpiry"), LocalDate.now().plusDays(30)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Asset> assetPage = assetRepository.findAll(spec, pageable);

        List<UUID> assetIds = assetPage.getContent().stream().map(Asset::getId).toList();
        Map<UUID, String> holderMap = new java.util.HashMap<>();
        if (!assetIds.isEmpty()) {
            assetCurrentHolderRepository.findAllById(assetIds).forEach(holder -> {
                if (holder.getFullName() != null) {
                    holderMap.put(holder.getAssetId(), holder.getFullName());
                }
            });
        }

        Page<AssetResponse> responsePage = assetPage.map(asset -> mapToResponse(asset, holderMap));
        return new PageResponse<>(responsePage);
    }

    // Tạo tài sản mới (Tự sinh mã tài sản tăng dần theo năm)
    @Transactional
    public AssetResponse createAsset(AssetRequest request, UUID createdById) {
        Category category = categoryRepository.findById(request.getCategoryId()).orElseThrow(() ->
                new BusinessException("CATEGORY_NOT_FOUND", "Không tìm thấy danh mục thiết bị", HttpStatus.NOT_FOUND));
        int currentYear = LocalDate.now().getYear();
        long count = assetRepository.countByCategoryCodeAndYear(category.getCode(), currentYear);
        String assetCode = String.format("IT-%s-%d-%04d", category.getCode(), currentYear, count + 1);

        Asset asset = new Asset();
        asset.setAssetCode(assetCode);
        asset.setName(request.getName().trim());
        asset.setCategory(category);
        asset.setSerialNumber(request.getSerialNumber() != null ? request.getSerialNumber().trim() : null);
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setPurchaseCost(request.getPurchaseCost());
        asset.setCurrency(request.getCurrency() != null ? request.getCurrency().trim().toUpperCase() : "VND");
        asset.setPurchaseInvoiceUrl(request.getPurchaseInvoiceUrl());
        asset.setWarrantyExpiry(request.getWarrantyExpiry());
        asset.setStatus(AssetStatus.AVAILABLE);
        asset.setSpecification(request.getSpecification());
        asset.setCreatedBy(createdById);

        Asset savedAsset = assetRepository.saveAndFlush(asset);

        if (savedAsset.getPurchaseInvoiceUrl() != null && savedAsset.getPurchaseInvoiceUrl().contains("/api/v1/attachments/files/")) {
            attachmentService.updateEntityIdByUrl(savedAsset.getPurchaseInvoiceUrl(), savedAsset.getId());
        }

        auditLogService.log(
                createdById,
                "CREATE",
                "ASSET",
                savedAsset.getId(),
                java.util.Map.of("name", savedAsset.getName(), "code", savedAsset.getAssetCode())
        );

        return mapToResponse(savedAsset);
    }

    @Transactional
    public AssetResponse updateAsset(UUID id, AssetRequest request, UUID updatedById) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
            new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản để cập nhật", HttpStatus.NOT_FOUND)
        );

        Category category = categoryRepository.findById(request.getCategoryId()).orElseThrow(() ->
                new BusinessException("CATEGORY_NOT_FOUND", "Không tìm thấy danh mục thiết bị", HttpStatus.NOT_FOUND)
        );

        java.util.Map<String, Object> diff = calculateAssetDiff(asset, request, category);

        asset.setName(request.getName().trim());
        asset.setCategory(category);
        asset.setSerialNumber(request.getSerialNumber() != null ? request.getSerialNumber().trim() : null);
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setPurchaseCost(request.getPurchaseCost());
        if (request.getCurrency() != null) {
            asset.setCurrency(request.getCurrency().trim().toUpperCase());
        }
        asset.setPurchaseInvoiceUrl(request.getPurchaseInvoiceUrl());
        asset.setWarrantyExpiry(request.getWarrantyExpiry());
        asset.setSpecification(request.getSpecification());

        if (request.getStatus() != null) {
            asset.setStatus(request.getStatus());
        }

        Asset updatedAsset = assetRepository.saveAndFlush(asset);

        if (updatedAsset.getPurchaseInvoiceUrl() != null && updatedAsset.getPurchaseInvoiceUrl().contains("/api/v1/attachments/files/")) {
            attachmentService.updateEntityIdByUrl(updatedAsset.getPurchaseInvoiceUrl(), updatedAsset.getId());
        }

        if (!diff.isEmpty()) {
            auditLogService.log(updatedById, "UPDATE", "ASSET", updatedAsset.getId(), diff);
        }

        return mapToResponse(updatedAsset);
    }

    private java.util.Map<String, Object> calculateAssetDiff(Asset oldAsset, AssetRequest request, Category newCategory) {
        java.util.Map<String, Object> diff = new java.util.HashMap<>();
        String oldName = oldAsset.getName() != null ? oldAsset.getName() : "";
        String newName = request.getName() != null ? request.getName().trim() : "";
        if (!oldName.equals(newName)) {
            diff.put("name", createDiffMap(oldName, newName));
        }
        String oldSerial = oldAsset.getSerialNumber() != null ? oldAsset.getSerialNumber() : "";
        String newSerial = request.getSerialNumber() != null ? request.getSerialNumber().trim() : "";
        if (!oldSerial.equals(newSerial)) {
            diff.put("serialNumber", createDiffMap(oldSerial, newSerial));
        }
        java.math.BigDecimal oldCost = oldAsset.getPurchaseCost() != null ? oldAsset.getPurchaseCost() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal newCost = request.getPurchaseCost() != null ? request.getPurchaseCost() : java.math.BigDecimal.ZERO;
        if (oldCost.compareTo(newCost) != 0) {
            diff.put("purchaseCost", createDiffMap(oldCost, newCost));
        }
        if (request.getStatus() != null && oldAsset.getStatus() != request.getStatus()) {
            String oldStatus = oldAsset.getStatus() != null ? oldAsset.getStatus().name() : "";
            diff.put("status", createDiffMap(oldStatus, request.getStatus().name()));
        }
        UUID oldCatId = oldAsset.getCategory() != null ? oldAsset.getCategory().getId() : null;
        UUID newCatId = newCategory != null ? newCategory.getId() : null;
        if (!java.util.Objects.equals(oldCatId, newCatId)) {
            String oldCatName = oldAsset.getCategory() != null ? oldAsset.getCategory().getName() : "";
            String newCatName = newCategory != null ? newCategory.getName() : "";
            diff.put("category", createDiffMap(oldCatName, newCatName));
        }
        return diff;
    }

    private java.util.Map<String, String> createDiffMap(Object oldVal, Object newVal) {
        java.util.Map<String, String> map = new java.util.HashMap<>();
        map.put("old", oldVal != null ? oldVal.toString() : "");
        map.put("new", newVal != null ? newVal.toString() : "");
        return map;
    }

    @Transactional
    public void softDeleteAsset(UUID id, UUID deletedById) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
                new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản để xóa", HttpStatus.NOT_FOUND)
        );
        if (asset.getStatus() == AssetStatus.ASSIGNED || asset.getStatus() == AssetStatus.PENDING_CONFIRMATION) {
            throw new BusinessException("ASSET_IN_USE", "Không thể xóa tài sản đang được cấp phát cho nhân viên", HttpStatus.BAD_REQUEST);
        }

        asset.setDeletedAt(Instant.now());
        assetRepository.save(asset);

        auditLogService.log(
                deletedById,
                "DELETE",
                "ASSET",
                asset.getId(),
                java.util.Map.of("name", asset.getName(), "code", asset.getAssetCode())
        );
    }

    private AssetResponse mapToResponse(Asset asset) {
        String assignedTo = assetCurrentHolderRepository.findById(asset.getId())
                .map(AssetCurrentHolder::getFullName)
                .orElse(null);
        return mapToResponse(asset, java.util.Collections.singletonMap(asset.getId(), assignedTo));
    }

    private AssetResponse mapToResponse(Asset asset, Map<UUID, String> holderMap) {
        String assignedTo = holderMap.get(asset.getId());

        return new AssetResponse(asset.getId(),
                asset.getAssetCode(),
                asset.getName(),
                asset.getCategory().getId(),
                asset.getCategory().getName(),
                asset.getSerialNumber(),
                asset.getPurchaseDate(),
                asset.getPurchaseCost(),
                asset.getPurchaseInvoiceUrl(),
                asset.getWarrantyExpiry(),
                asset.getStatus(),
                asset.getSpecification(),
                "/api/v1/assets/" + asset.getId() + "/qr",
                asset.getCreatedBy(),
                asset.getCreatedAt(),
                asset.getUpdatedAt(),
                asset.getCurrency(),
                assignedTo
        );
    }

    @Transactional(readOnly = true)
    public boolean isAssetAvailable(UUID id) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
                new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản", HttpStatus.NOT_FOUND)
        );

        return asset.getStatus() == AssetStatus.AVAILABLE;
    }

    @Transactional(readOnly = true)
    public boolean isAssetAssigned(UUID id) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
                new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản", HttpStatus.NOT_FOUND)
        );

        return asset.getStatus() == AssetStatus.ASSIGNED;
    }

    @Transactional(readOnly = true)
    public boolean isAssetInMaintenance(UUID id) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
                new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản", HttpStatus.NOT_FOUND)
        );
        return asset.getStatus() == AssetStatus.MAINTENANCE;
    }

    @Transactional
    public void markAssetAsPending(UUID id) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
            new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản", HttpStatus.NOT_FOUND)
        );

        asset.setStatus(AssetStatus.PENDING_CONFIRMATION);
        assetRepository.save(asset);
    }

    @Transactional
    public void markAssetAsAssigned(UUID id) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
                new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản", HttpStatus.NOT_FOUND)
        );

        asset.setStatus(AssetStatus.ASSIGNED);
        assetRepository.save(asset);
    }

    @Transactional
    public void markAssetAsAvailable(UUID id) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
                new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản", HttpStatus.NOT_FOUND)
        );

        asset.setStatus(AssetStatus.AVAILABLE);
        assetRepository.save(asset);
    }

    @Transactional
    public void markAssetAsMaintenance(UUID id) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản", HttpStatus.NOT_FOUND));
        asset.setStatus(AssetStatus.MAINTENANCE);
        assetRepository.save(asset);
    }

    @Transactional(readOnly = true)
    public UUID getAssetCurrentHolderId(UUID assetId) {
        return assetCurrentHolderRepository.findById(assetId)
                .map(AssetCurrentHolder::getUserId)
                .orElse(null); // Trả về null nếu thiết bị đang ở kho (không có ai giữ)
    }

    @Transactional(readOnly = true)
    public List<AssetCurrentHolder> getMyAssets(UUID userId) {
        return assetCurrentHolderRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public byte[] generateQRCode(UUID id) {
        if (!assetRepository.existsByIdAndDeletedAtIsNull(id)) {
            throw new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản", HttpStatus.NOT_FOUND);
        }

        return qrCodeGenerator.generateQRCode(id.toString(), 300, 300);
    }

    @Transactional(readOnly = true)
    public long countActiveAssets() {
        return assetRepository.countByDeletedAtIsNull();
    }

    @Transactional(readOnly = true)
    public long countByStatus(AssetStatus status) {
        return assetRepository.countByStatusAndDeletedAtIsNull(status);
    }

    @Transactional(readOnly = true)
    public long countExpiringWarranty(LocalDate start, LocalDate end) {
        return assetRepository.countByDeletedAtIsNullAndWarrantyExpiryBetween(start, end);
    }

    @Transactional(readOnly = true)
    public List<Object[]> getCategoryDistribution() {
        return assetRepository.countAssetsByCategory();
    }

    @Transactional(readOnly = true)
    public List<Object[]> getDepartmentAssetCounts() {
        return assetCurrentHolderRepository.countAssetsByDepartmentId();
    }

    @Transactional(readOnly = true)
    public List<UUID> getAllActiveAssetsIds() {
        return assetRepository.findAllActiveAssetIds();
    }

    @Transactional(readOnly = true)
    public List<AssetDto> getAssetExpiringWarranty(LocalDate start, LocalDate end) {
        List<Asset> assets = assetRepository.findByDeletedAtIsNullAndWarrantyExpiryBetween(start, end);
        return assets.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAllAssetsForReport() {
        List<Asset> assets = assetRepository.findByDeletedAtIsNull();
        List<UUID> assetIds = assets.stream().map(Asset::getId).collect(Collectors.toList());
        Map<UUID, String> holderMap = assetCurrentHolderRepository.findAllById(assetIds).stream()
                .collect(Collectors.toMap(
                        AssetCurrentHolder::getAssetId, 
                        ach -> ach.getFullName() != null ? ach.getFullName() : (ach.getDepartmentId() != null ? "Phòng ban" : "Không xác định")
                ));

        return assets.stream()
                .map(asset -> mapToResponse(asset, holderMap))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAssetsByIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        List<Asset> assets = assetRepository.findByDeletedAtIsNullAndIdIn(ids);
        List<UUID> assetIds = assets.stream().map(Asset::getId).collect(Collectors.toList());
        Map<UUID, String> holderMap = assetCurrentHolderRepository.findAllById(assetIds).stream()
                .collect(Collectors.toMap(
                        AssetCurrentHolder::getAssetId, 
                        ach -> ach.getFullName() != null ? ach.getFullName() : (ach.getDepartmentId() != null ? "Phòng ban" : "Không xác định")
                ));

        return assets.stream()
                .map(asset -> mapToResponse(asset, holderMap))
                .collect(Collectors.toList());
    }

    private AssetDto mapToDto(Asset asset) {
        return new AssetDto(asset.getId(),
                asset.getAssetCode(),
                asset.getName(),
                asset.getWarrantyExpiry(),
                asset.getStatus());
    }
}
