package com.nguyenhoa.itam.asset.infrastructure.web;

import com.nguyenhoa.itam.asset.application.dto.AssetHealthDto;
import com.nguyenhoa.itam.asset.application.dto.AssetRequest;
import com.nguyenhoa.itam.asset.application.dto.AssetResponse;
import com.nguyenhoa.itam.asset.application.service.AssetHealthService;
import com.nguyenhoa.itam.asset.application.service.AssetService;
import com.nguyenhoa.itam.asset.domain.AssetStatus;
import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.common.dto.PageResponse;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assets")
public class AssetController {
    private final AssetService assetService;
    private final AssetHealthService assetHealthService;

    public AssetController(AssetService assetService, AssetHealthService assetHealthService) {
        this.assetService = assetService;
        this.assetHealthService = assetHealthService;
    }

    //  danh sách tài sản phân trang, lọc theo danh mục, trạng thái và tìm kiếm
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AssetResponse>>> getAssets(@RequestParam(required = false) UUID categoryId,
                                                                 @RequestParam(required = false) AssetStatus status,
                                                                 @RequestParam(required = false) String search,
                                                                 @RequestParam(required = false) Boolean warrantyExpiring,
                                                                 @RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<AssetResponse> pageResponse = assetService.getAssets(categoryId, status, search, warrantyExpiring, pageable);
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssetResponse>> getAssetById(@PathVariable UUID id) {
        AssetResponse assetResponse = assetService.getAssetById(id);
        return ResponseEntity.ok(ApiResponse.success(assetResponse));
    }

    @GetMapping("/{id}/health")
    public ResponseEntity<ApiResponse<AssetHealthDto>> getAssetHealth(@PathVariable UUID id) {
        AssetHealthDto healthDto = assetHealthService.calculateHealth(id);
        return ResponseEntity.ok(ApiResponse.success(healthDto));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<AssetResponse>> createAsset(@Valid @RequestBody AssetRequest assetRequest, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AssetResponse assetResponse = assetService.createAsset(assetRequest, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(assetResponse));

    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<AssetResponse>> updateAsset(@PathVariable UUID id, @Valid @RequestBody AssetRequest assetRequest, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AssetResponse assetResponse = assetService.updateAsset(id, assetRequest, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(assetResponse));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteAsset(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        assetService.softDeleteAsset(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tài sản thành công"));
    }

    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQRCode(@PathVariable UUID id) {
        byte[] qrCodeImage = assetService.generateQRCode(id);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(qrCodeImage);
    }
}
