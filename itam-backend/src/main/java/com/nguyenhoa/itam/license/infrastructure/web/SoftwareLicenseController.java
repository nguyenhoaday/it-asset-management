package com.nguyenhoa.itam.license.infrastructure.web;

import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.common.dto.PageResponse;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import com.nguyenhoa.itam.license.application.dto.LicenseAllocationRequest;
import com.nguyenhoa.itam.license.application.dto.LicenseAllocationResponse;
import com.nguyenhoa.itam.license.application.dto.SoftwareLicenseRequest;
import com.nguyenhoa.itam.license.application.dto.SoftwareLicenseResponse;
import com.nguyenhoa.itam.license.application.service.SoftwareLicenseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/licenses")
public class SoftwareLicenseController {
    private final SoftwareLicenseService softwareLicenseService;

    public SoftwareLicenseController(SoftwareLicenseService softwareLicenseService) {
        this.softwareLicenseService = softwareLicenseService;
    }

    // Lấy danh sách licenses phân trang và tìm kiếm
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<PageResponse<SoftwareLicenseResponse>>> getLicenses(@RequestParam(required = false) String search,
                                                                                          @RequestParam(required = false) String status,
                                                                                          @RequestParam(defaultValue = "0") int page,
                                                                                          @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<SoftwareLicenseResponse> response = softwareLicenseService.getLicenses(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Lấy chi tiết một license
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<SoftwareLicenseResponse>> getLicenseById(@PathVariable UUID id) {
        SoftwareLicenseResponse response = softwareLicenseService.getLicenseById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Tạo một license
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<SoftwareLicenseResponse>> createLicense(@Valid @RequestBody SoftwareLicenseRequest request,
                                                                              @AuthenticationPrincipal UserPrincipal userPrincipal) {
        SoftwareLicenseResponse response = softwareLicenseService.createLicense(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // Cập nhật thông tin license
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<SoftwareLicenseResponse>> updateLicense(@PathVariable UUID id,
                                                                 @Valid @RequestBody SoftwareLicenseRequest request) {
        SoftwareLicenseResponse response = softwareLicenseService.updateLicense(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Xóa mềm license
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteLicense(@PathVariable UUID id) {
        softwareLicenseService.deleteLicense(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa license thành công"));
    }

    // Cấp phát license cho nhân viên
    @PostMapping("/{id}/allocate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<LicenseAllocationResponse>> allocateLicense(@PathVariable("id") UUID licenseId,
                                                                                  @Valid @RequestBody LicenseAllocationRequest request,
                                                                                  @AuthenticationPrincipal UserPrincipal userPrincipal) {
        LicenseAllocationResponse response = softwareLicenseService.allocateLicense(licenseId, request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    // Thu hồi license đã cấp
    @PostMapping("/allocations/{allocationId}/return")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<LicenseAllocationResponse>> returnLicense(@PathVariable UUID allocationId,
                                                                                @AuthenticationPrincipal UserPrincipal userPrincipal) {
        LicenseAllocationResponse response = softwareLicenseService.returnLicense(allocationId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // Lấy danh sách cấp phát của một license
    @GetMapping("/{id}/allocations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<List<LicenseAllocationResponse>>> getLicenseAllocations(@PathVariable("id") UUID licenseId) {
        List<LicenseAllocationResponse> response = softwareLicenseService.getLicenseAllocations(licenseId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
