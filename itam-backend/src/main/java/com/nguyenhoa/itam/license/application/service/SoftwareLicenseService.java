package com.nguyenhoa.itam.license.application.service;

import com.nguyenhoa.itam.common.dto.PageResponse;
import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.iam.application.service.UserService;
import com.nguyenhoa.itam.license.application.dto.LicenseAllocationRequest;
import com.nguyenhoa.itam.license.application.dto.LicenseAllocationResponse;
import com.nguyenhoa.itam.license.application.dto.MySoftwareLicenseResponse;
import com.nguyenhoa.itam.license.application.dto.SoftwareLicenseRequest;
import com.nguyenhoa.itam.license.application.dto.SoftwareLicenseResponse;
import com.nguyenhoa.itam.license.domain.LicenseAllocation;
import com.nguyenhoa.itam.license.domain.LicenseAllocationRepository;
import com.nguyenhoa.itam.license.domain.SoftwareLicense;
import com.nguyenhoa.itam.license.domain.SoftwareLicenseRepository;
import com.nguyenhoa.itam.attachment.application.service.AttachmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
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
    private final AttachmentService attachmentService;


    public SoftwareLicenseService(SoftwareLicenseRepository softwareLicenseRepository, LicenseAllocationRepository licenseAllocationRepository, UserService userService, AttachmentService attachmentService) {
        this.softwareLicenseRepository = softwareLicenseRepository;
        this.licenseAllocationRepository = licenseAllocationRepository;
        this.userService = userService;
        this.attachmentService = attachmentService;
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

        if (savedLicense.getPurchaseInvoiceUrl() != null && savedLicense.getPurchaseInvoiceUrl().contains("/api/v1/attachments/files/")) {
            attachmentService.updateEntityIdByUrl(savedLicense.getPurchaseInvoiceUrl(), savedLicense.getId());
        }

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

        if (updated.getPurchaseInvoiceUrl() != null && updated.getPurchaseInvoiceUrl().contains("/api/v1/attachments/files/")) {
            attachmentService.updateEntityIdByUrl(updated.getPurchaseInvoiceUrl(), updated.getId());
        }

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
    public PageResponse<SoftwareLicenseResponse> getLicenses(String search, String status, Pageable pageable) {
        Specification<SoftwareLicense> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));
            
            if (search != null && !search.trim().isEmpty()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("licenseCode")), like)
                ));
            }
            
            if (status != null && !status.trim().isEmpty()) {
                LocalDate today = LocalDate.now();
                if (status.equalsIgnoreCase("VALID")) {
                    predicates.add(cb.or(
                        cb.isNull(root.get("expirationDate")),
                        cb.greaterThan(root.get("expirationDate"), today.plusDays(30))
                    ));
                } else if (status.equalsIgnoreCase("EXPIRING_SOON")) {
                    predicates.add(cb.and(
                        cb.isNotNull(root.get("expirationDate")),
                        cb.greaterThanOrEqualTo(root.get("expirationDate"), today),
                        cb.lessThanOrEqualTo(root.get("expirationDate"), today.plusDays(30))
                    ));
                } else if (status.equalsIgnoreCase("EXPIRED")) {
                    predicates.add(cb.and(
                        cb.isNotNull(root.get("expirationDate")),
                        cb.lessThan(root.get("expirationDate"), today)
                    ));
                }
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<SoftwareLicense> page = softwareLicenseRepository.findAll(spec, pageable);
        List<UUID> licenseIds = page.getContent().stream().map(SoftwareLicense::getId).collect(Collectors.toList());
        
        java.util.Map<UUID, Long> usedSeatsMap = new java.util.HashMap<>();
        if (!licenseIds.isEmpty()) {
            List<Object[]> counts = licenseAllocationRepository.countActiveAllocationsByLicenseIds(licenseIds);
            for (Object[] count : counts) {
                usedSeatsMap.put((UUID) count[0], (Long) count[1]);
            }
        }

        Page<SoftwareLicenseResponse> mappedPage = page.map(license -> {
            long usedSeats = usedSeatsMap.getOrDefault(license.getId(), 0L);
            return mapToResponse(license, usedSeats);
        });
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

    @Transactional(readOnly = true)
    public List<MySoftwareLicenseResponse> getMySoftwareLicenses(UUID userId) {
        List<LicenseAllocation> allocations = licenseAllocationRepository.findByUserAndReturnedAtIsNullOrderByAllocatedAtDesc(userId);
        return allocations.stream().map(a -> new MySoftwareLicenseResponse(
                a.getId(),
                a.getLicense().getId(),
                a.getLicense().getLicenseCode(),
                a.getLicense().getName(),
                a.getLicense().getLicenseKey(),
                a.getLicense().getExpirationDate(),
                a.getAllocatedAt(),
                a.getNotes()
        )).toList();
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
        return mapToResponse(license, usedSeats);
    }

    private SoftwareLicenseResponse mapToResponse(SoftwareLicense license, long usedSeats) {
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
