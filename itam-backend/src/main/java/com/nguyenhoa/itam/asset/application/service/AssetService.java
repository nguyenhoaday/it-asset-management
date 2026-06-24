package com.nguyenhoa.itam.asset.application.service;

import com.nguyenhoa.itam.asset.application.dto.AssetDto;
import com.nguyenhoa.itam.asset.application.dto.AssetRequest;
import com.nguyenhoa.itam.asset.application.dto.AssetResponse;
import com.nguyenhoa.itam.asset.domain.*;
import com.nguyenhoa.itam.common.dto.PageResponse;
import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.common.util.QRCodeGenerator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssetService {
    private final AssetRepository assetRepository;
    private final CategoryRepository categoryRepository;
    private final AssetCurrentHolderRepository assetCurrentHolderRepository;
    private final QRCodeGenerator qrCodeGenerator;

    public AssetService(AssetRepository assetRepository, CategoryRepository categoryRepository, AssetCurrentHolderRepository assetCurrentHolderRepository, QRCodeGenerator qrCodeGenerator) {
        this.assetRepository = assetRepository;
        this.categoryRepository = categoryRepository;
        this.assetCurrentHolderRepository = assetCurrentHolderRepository;
        this.qrCodeGenerator = qrCodeGenerator;
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
    public PageResponse<AssetResponse> getAssets(UUID categoryId, AssetStatus status, String search, Pageable pageable) {
        Page<Asset> assetPage = assetRepository.searchAssets(categoryId, status, search, pageable);

        // Ánh xạ Page<Asset> sang Page<AssetResponse> bằng cách dùng hàm map của Spring Data
        Page<AssetResponse> responsePage = assetPage.map(this::mapToResponse);
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
        asset.setPurchaseInvoiceUrl(request.getPurchaseInvoiceUrl());
        asset.setWarrantyExpiry(request.getWarrantyExpiry());
        asset.setStatus(AssetStatus.AVAILABLE);
        asset.setSpecification(request.getSpecification());
        asset.setCreatedBy(createdById);

        Asset savedAsset = assetRepository.saveAndFlush(asset);

        return mapToResponse(savedAsset);
    }

    @Transactional
    public AssetResponse updateAsset(UUID id, AssetRequest request) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
            new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản để cập nhật", HttpStatus.NOT_FOUND)
        );

        Category category = categoryRepository.findById(request.getCategoryId()).orElseThrow(() ->
                new BusinessException("CATEGORY_NOT_FOUND", "Không tìm thấy danh mục thiết bị", HttpStatus.NOT_FOUND)
        );

        asset.setName(request.getName().trim());
        asset.setCategory(category);
        asset.setSerialNumber(request.getSerialNumber() != null ? request.getSerialNumber().trim() : null);
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setPurchaseCost(request.getPurchaseCost());
        asset.setPurchaseInvoiceUrl(request.getPurchaseInvoiceUrl());
        asset.setWarrantyExpiry(request.getWarrantyExpiry());
        asset.setSpecification(request.getSpecification());

        if (request.getStatus() != null) {
            asset.setStatus(request.getStatus());
        }

        Asset updatedAsset = assetRepository.saveAndFlush(asset);
        return mapToResponse(updatedAsset);
    }

    @Transactional
    public void softDeleteAsset(UUID id) {
        Asset asset = assetRepository.findByIdAndDeletedAtIsNull(id).orElseThrow(() ->
                new BusinessException("ASSET_NOT_FOUND", "Không tìm thấy tài sản để xóa", HttpStatus.NOT_FOUND)
        );
        if (asset.getStatus() == AssetStatus.ASSIGNED || asset.getStatus() == AssetStatus.PENDING_CONFIRMATION) {
            throw new BusinessException("ASSET_IN_USE", "Không thể xóa tài sản đang được cấp phát cho nhân viên", HttpStatus.BAD_REQUEST);
        }

        asset.setDeletedAt(Instant.now());
        assetRepository.save(asset);
    }

    private AssetResponse mapToResponse(Asset asset) {
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
                asset.getUpdatedAt()
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
    public List<UUID> getAllActiveAssetsIds() {
        return assetRepository.findAllActiveAssetIds();
    }

    @Transactional(readOnly = true)
    public List<AssetDto> getAssetExpiringWarranty(LocalDate start, LocalDate end) {
        List<Asset> assets = assetRepository.findByDeletedAtIsNullAndWarrantyExpiryBetween(start, end);
        return assets.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private AssetDto mapToDto(Asset asset) {
        return new AssetDto(asset.getId(),
                asset.getAssetCode(),
                asset.getName(),
                asset.getWarrantyExpiry(),
                asset.getStatus());
    }
}
