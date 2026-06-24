package com.nguyenhoa.itam.license.application.service;

import com.nguyenhoa.itam.common.dto.PageResponse;
import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.iam.application.service.UserService;
import com.nguyenhoa.itam.license.application.dto.LicenseAllocationRequest;
import com.nguyenhoa.itam.license.application.dto.LicenseAllocationResponse;
import com.nguyenhoa.itam.license.application.dto.SoftwareLicenseRequest;
import com.nguyenhoa.itam.license.application.dto.SoftwareLicenseResponse;
import com.nguyenhoa.itam.license.domain.LicenseAllocation;
import com.nguyenhoa.itam.license.domain.LicenseAllocationRepository;
import com.nguyenhoa.itam.license.domain.SoftwareLicense;
import com.nguyenhoa.itam.license.domain.SoftwareLicenseRepository;
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
public class SoftwareLicenseService {
    private final SoftwareLicenseRepository softwareLicenseRepository;
    private final LicenseAllocationRepository licenseAllocationRepository;
    private final UserService userService;


    public SoftwareLicenseService(SoftwareLicenseRepository softwareLicenseRepository, LicenseAllocationRepository licenseAllocationRepository, UserService userService) {
        this.softwareLicenseRepository = softwareLicenseRepository;
        this.licenseAllocationRepository = licenseAllocationRepository;
        this.userService = userService;
    }

    @Transactional
    public SoftwareLicenseResponse createLicense(SoftwareLicenseRequest request, UUID createdBy) {
        if (softwareLicenseRepository.existsByLicenseCode(request.getLicenseCode())) {
            throw new BusinessException("LICENSE_CODE_ALREADY_EXISTS",
                    "Mã bản quyền này đã được đăng ký", HttpStatus.CONFLICT);
        }

        SoftwareLicense license = new SoftwareLicense();
        license.setLicenseCode(request.getLicenseCode());
        license.setName(request.getName().trim());
        license.setLicenseKey(request.getLicenseKey() != null ? request.getLicenseKey().trim() : null);
        license.setTotalSeats(request.getTotalSeats());
        license.setExpirationDate(request.getExpirationDate());
        license.setPurchaseDate(request.getPurchaseDate());
        license.setPurchaseCost(request.getPurchaseCost());
        license.setPurchaseInvoiceUrl(request.getPurchaseInvoiceUrl());
        license.setIsActive(true);
        license.setCreatedBy(createdBy);

        SoftwareLicense savedLicense = softwareLicenseRepository.save(license);
        return mapToResponse(savedLicense);
    }

    @Transactional(readOnly = true)
    public SoftwareLicenseResponse getLicenseById(UUID id) {
        SoftwareLicense license = softwareLicenseRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new BusinessException("LICENSE_NOT_FOUND", "Không tìm thấy gói bản quyền", HttpStatus.NOT_FOUND));

        return mapToResponse(license);
    }

    @Transactional
    public SoftwareLicenseResponse updateLicense(UUID id, SoftwareLicenseRequest request) {
        SoftwareLicense license = softwareLicenseRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new BusinessException("LICENSE_NOT_FOUND", "Không tìm thấy gói bản quyền", HttpStatus.NOT_FOUND));

        // Kiểm tra xem mã bản quyền mới có bị trùng với gói khác không
        if (softwareLicenseRepository.existsByLicenseCodeAndIdNot(request.getLicenseCode().trim(), id)) {
            throw new BusinessException("LICENSE_CODE_ALREADY_EXISTS",
                    "Mã bản quyền này trùng với một gói bản quyền khác", HttpStatus.CONFLICT);
        }

        // Kiểm soát nâng hạ số lượng (totalSeats): Không cho phép giảm xuống thấp hơn số chỗ đang sử dụng thực tế
        long usedSeats = licenseAllocationRepository.countByLicenseIdAndReturnedAtIsNull(license.getId());
        if (request.getTotalSeats() < usedSeats) {
            throw new BusinessException("INVALID_TOTAL_SEATS",
                    "Không thể giảm tổng số lượng license xuống thấp hơn số lượng đang được sử dụng (đang có: " + usedSeats + " license)",
                    HttpStatus.BAD_REQUEST);
        }

        license.setLicenseCode(request.getLicenseCode().trim());
        license.setName(request.getName().trim());
        license.setLicenseKey(request.getLicenseKey() != null ? request.getLicenseKey().trim() : null);
        license.setTotalSeats(request.getTotalSeats());
        license.setExpirationDate(request.getExpirationDate());
        license.setPurchaseDate(request.getPurchaseDate());
        license.setPurchaseCost(request.getPurchaseCost());
        license.setPurchaseInvoiceUrl(request.getPurchaseInvoiceUrl());

        SoftwareLicense updated = softwareLicenseRepository.save(license);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteLicense(UUID id) {
        SoftwareLicense license = softwareLicenseRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new BusinessException("LICENSE_NOT_FOUND", "Không tìm thấy gói bản quyền", HttpStatus.NOT_FOUND));

        // Chỉ cho phép xóa khi không còn ai đang sử dụng bản quyền này
        long usedSeats = licenseAllocationRepository.countByLicenseIdAndReturnedAtIsNull(license.getId());
        if (usedSeats > 0) {
            throw new BusinessException("LICENSE_IN_USE",
                    "Không thể xóa gói bản quyền đang được cấp phát cho nhân viên", HttpStatus.BAD_REQUEST);
        }

        license.setIsActive(false);
        softwareLicenseRepository.save(license);
    }

    @Transactional(readOnly = true)
    public PageResponse<SoftwareLicenseResponse> getLicenses(String search, Pageable pageable) {
        Page<SoftwareLicense> page = softwareLicenseRepository.searchLicense(search, pageable);
        Page<SoftwareLicenseResponse> mappedPage = page.map(this::mapToResponse);
        return new PageResponse<>(mappedPage);
    }

    @Transactional
    public LicenseAllocationResponse allocateLicense(UUID licenseId, LicenseAllocationRequest request, UUID createdBy) {
        SoftwareLicense license = softwareLicenseRepository.findByIdAndIsActiveTrue(licenseId)
                .orElseThrow(() -> new BusinessException("LICENSE_NOT_FOUND", "Không tìm thấy gói bản quyền", HttpStatus.NOT_FOUND));

        // Kiểm tra bản quyền hết hạn chưa
        if (license.getExpirationDate() != null
                && license.getExpirationDate().isBefore(LocalDate.now())) {
            throw new BusinessException("LICENSE_EXPIRED", "Bản quyền phần mềm này đã hết hạn sử dụng", HttpStatus.BAD_REQUEST);
        }

        // Kiểm tra mã nhân viên userId
        userService.getUserProfile(request.getUserId());

        // Kiểm tra trùng lặp (Một người không được cấp trùng 2 seat của cùng 1 license nếu chưa trả)
        if (licenseAllocationRepository.existsByLicenseIdAndUserAndReturnedAtIsNull(licenseId, request.getUserId())) {
            throw new BusinessException("LICENSE_ALREADY_ASSIGNED",
                    "Nhân viên này đã được cấp phát bản quyền phần mềm này rồi", HttpStatus.CONFLICT);
        }

        // Kiểm tra số lượng license khả dụng
        long usedSeats = licenseAllocationRepository.countByLicenseIdAndReturnedAtIsNull(licenseId);
        if (usedSeats >= license.getTotalSeats()) {
            throw new BusinessException("LICENSE_FULL",
                    "Không thể cấp phát thêm: Gói bản quyền đã hết lượt sử dụng khả dụng", HttpStatus.CONFLICT);
        }

        LicenseAllocation allocation = new LicenseAllocation();
        allocation.setLicense(license);
        allocation.setUser(request.getUserId());
        allocation.setAssignedBy(createdBy);
        allocation.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        allocation.setCreatedBy(createdBy);

        LicenseAllocation saved = licenseAllocationRepository.save(allocation);
        return mapToAllocationResponse(saved);
    }

    @Transactional
    public LicenseAllocationResponse returnLicense(UUID allocationId, UUID createdBy) {
        LicenseAllocation allocation = licenseAllocationRepository.findById(allocationId)
                .orElseThrow(() -> new BusinessException("ALLOCATION_NOT_FOUND", "Không tìm thấy thông tin phân bổ bản quyền", HttpStatus.NOT_FOUND));

        if (allocation.getReturnedAt() != null) {
            throw new BusinessException("ALLOCATION_ALREADY_RETURNED",
                    "Bản quyền này đã được thu hồi từ trước", HttpStatus.BAD_REQUEST);
        }

        allocation.setReturnedAt(Instant.now());
        LicenseAllocation saved = licenseAllocationRepository.save(allocation);
        return mapToAllocationResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LicenseAllocationResponse> getLicenseAllocations(UUID licenseId) {
        // Kiểm tra license tồn tại
        softwareLicenseRepository.findByIdAndIsActiveTrue(licenseId)
                .orElseThrow(() -> new BusinessException("LICENSE_NOT_FOUND", "Không tìm thấy gói bản quyền", HttpStatus.NOT_FOUND));

        List<LicenseAllocation> allocations = licenseAllocationRepository.findByLicenseIdOrderByAllocatedAtDesc(licenseId);
        return allocations.stream().map(this::mapToAllocationResponse).collect(Collectors.toList());
    }

    private LicenseAllocationResponse mapToAllocationResponse(LicenseAllocation allocation) {
        return new LicenseAllocationResponse(allocation.getId(),
                allocation.getLicense().getId(),
                allocation.getLicense().getName(),
                allocation.getUser(),
                allocation.getAssignedBy(),
                allocation.getAllocatedAt(),
                allocation.getReturnedAt(),
                allocation.getNotes(),
                allocation.getCreatedBy());
    }

    private SoftwareLicenseResponse mapToResponse(SoftwareLicense license) {
        long usedSeats = licenseAllocationRepository.countByLicenseIdAndReturnedAtIsNull(license.getId());
        int availableSeats = Math.max(0, license.getTotalSeats() - (int) usedSeats);

        SoftwareLicenseResponse response = new SoftwareLicenseResponse();
        response.setId(license.getId());
        response.setLicenseCode(license.getLicenseCode());
        response.setLicenseName(license.getName());
        response.setLicenseKey(license.getLicenseKey());
        response.setTotalSeats(license.getTotalSeats());
        response.setUsedSeats((int) usedSeats);
        response.setAvailableSeats(availableSeats);
        response.setExpirationDate(license.getExpirationDate());
        response.setPurchaseDate(license.getPurchaseDate());
        response.setPurchaseCost(license.getPurchaseCost());
        response.setPurchaseInvoiceUrl(license.getPurchaseInvoiceUrl());
        response.setActive(license.getIsActive());
        response.setCreatedBy(license.getCreatedBy());
        response.setCreatedAt(license.getCreatedAt());
        response.setUpdatedAt(license.getUpdatedAt());

        return response;
    }
}
