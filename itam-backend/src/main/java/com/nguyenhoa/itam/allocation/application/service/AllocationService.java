package com.nguyenhoa.itam.allocation.application.service;

import com.nguyenhoa.itam.allocation.application.dto.AllocationRequest;
import com.nguyenhoa.itam.allocation.application.dto.AllocationResponse;
import com.nguyenhoa.itam.allocation.application.dto.MyAssetResponse;
import com.nguyenhoa.itam.allocation.application.dto.TransferRequest;
import com.nguyenhoa.itam.allocation.domain.ActionType;
import com.nguyenhoa.itam.allocation.domain.Allocation;
import com.nguyenhoa.itam.allocation.domain.AllocationRepository;
import com.nguyenhoa.itam.allocation.domain.ConfirmationStatus;
import com.nguyenhoa.itam.asset.application.service.AssetService;
import com.nguyenhoa.itam.audit.application.service.AuditLogService;
import com.nguyenhoa.itam.attachment.application.service.AttachmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.nguyenhoa.itam.common.dto.PageResponse;
import com.nguyenhoa.itam.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AllocationService {
    private final AllocationRepository allocationRepository;
    private final AssetService assetService;
    private final AuditLogService auditLogService;
    private final AttachmentService attachmentService;

    public AllocationService(AllocationRepository allocationRepository, AssetService assetService, AuditLogService auditLogService, AttachmentService attachmentService) {
        this.allocationRepository = allocationRepository;
        this.assetService = assetService;
        this.auditLogService = auditLogService;
        this.attachmentService = attachmentService;
    }

    @Transactional
    public AllocationResponse assignAsset(AllocationRequest request, UUID createdBy) {
        UUID assetId = request.getAssetId();

        if (assetService.isAssetInMaintenance(assetId)) {
            throw new BusinessException("ASSET_IN_MAINTENANCE",
                    "Thiết bị đang trong quá trình bảo trì, không thể cấp phát", HttpStatus.CONFLICT);
        }

        if (!assetService.isAssetAvailable(assetId)) {
            throw new BusinessException("ASSET_NOT_AVAILABLE",
                    "Thiết bị không ở trạng thái sẵn sàng để cấp phát", HttpStatus.CONFLICT);
        }

        Allocation allocation = new Allocation();
        allocation.setAsset(request.getAssetId());
        allocation.setToUser(request.getToUserId());
        allocation.setActionType(ActionType.ASSIGN);
        allocation.setConfirmationStatus(ConfirmationStatus.PENDING);
        allocation.setNotes(request.getNotes());
        allocation.setHandoverDocUrl(request.getHandoverDocUrl());
        allocation.setCreatedBy(createdBy);

        Allocation savedAllocation = allocationRepository.save(allocation);

        if (savedAllocation.getHandoverDocUrl() != null && savedAllocation.getHandoverDocUrl().contains("/api/v1/attachments/files/")) {
            attachmentService.updateEntityIdByUrl(savedAllocation.getHandoverDocUrl(), savedAllocation.getId());
        }

        assetService.markAssetAsPending(request.getAssetId());

        auditLogService.log(
                createdBy,
                "ALLOCATE",
                "ASSET",
                request.getAssetId(),
                java.util.Map.of("toUser", request.getToUserId().toString(), "notes", request.getNotes() != null ? request.getNotes() : "")
        );

        return mapToResponse(savedAllocation);
    }

    @Transactional
    public AllocationResponse returnAsset(UUID assetId, String notes, UUID createdBy) {
        UUID fromUserId = assetService.getAssetCurrentHolderId(assetId);

        Allocation allocation = new Allocation();
        allocation.setAsset(assetId);
        allocation.setFromUser(fromUserId);
        allocation.setActionType(ActionType.RETURN);
        allocation.setConfirmationStatus(ConfirmationStatus.CONFIRMED);
        allocation.setConfirmedAt(Instant.now());
        allocation.setConfirmedBy(createdBy);
        allocation.setNotes(notes);
        allocation.setCreatedBy(createdBy);

        Allocation savedAllocation = allocationRepository.save(allocation);
        assetService.markAssetAsAvailable(assetId);

        auditLogService.log(
                createdBy,
                "RETURN",
                "ASSET",
                assetId,
                java.util.Map.of("fromUser", fromUserId != null ? fromUserId.toString() : "", "notes", notes != null ? notes : "")
        );

        return mapToResponse(savedAllocation);
    }

    @Transactional
    public AllocationResponse transferAsset(TransferRequest request, UUID createdBy) {
        UUID assetId = request.getAssetId();
        if (assetService.isAssetInMaintenance(assetId)) {
            throw new BusinessException("ASSET_IN_MAINTENANCE",
                    "Thiết bị đang trong quá trình bảo trì, không thể điều chuyển", HttpStatus.CONFLICT);
        }
        if (!assetService.isAssetAssigned(assetId)) {
            throw new BusinessException("ASSET_NOT_ASSIGNED",
                    "Thiết bị phải đang được nhân viên sử dụng mới có thể điều chuyển", HttpStatus.CONFLICT);
        }

        UUID fromUserId = assetService.getAssetCurrentHolderId(request.getAssetId());
        if (fromUserId == null) {
            throw new BusinessException("HOLDER_NOT_FOUND", "Không tìm thấy nhân viên đang nắm giữ thiết bị", HttpStatus.NOT_FOUND);
        }

        Allocation allocation = new Allocation();
        allocation.setAsset(request.getAssetId());
        allocation.setFromUser(fromUserId);
        allocation.setToUser(request.getToUserId());
        allocation.setActionType(ActionType.TRANSFER);
        allocation.setConfirmationStatus(ConfirmationStatus.PENDING);
        allocation.setNotes(request.getNotes());
        allocation.setCreatedBy(createdBy);

        Allocation savedAllocation = allocationRepository.save(allocation);
        assetService.markAssetAsPending(request.getAssetId());

        auditLogService.log(
                createdBy,
                "TRANSFER",
                "ASSET",
                request.getAssetId(),
                java.util.Map.of("fromUser", fromUserId.toString(), "toUser", request.getToUserId().toString(), "notes", request.getNotes() != null ? request.getNotes() : "")
        );

        return mapToResponse(savedAllocation);
    }

    @Transactional
    public void confirmAllocation(UUID allocationId, UUID userId) {
        Allocation allocation = allocationRepository.findById(allocationId).orElseThrow(() ->
                new BusinessException("RESOURCE_NOT_FOUND", "Không tìm thấy yêu cầu bàn giao", HttpStatus.NOT_FOUND)
        );

        if (allocation.getConfirmationStatus() != ConfirmationStatus.PENDING) {
            throw new BusinessException("INVALID_STATUS", "Yêu cầu bàn giao thiết bị này không ở trạng thái chờ xác nhận", HttpStatus.BAD_REQUEST);
        }

        if (!userId.equals(allocation.getToUser())) {
            throw new BusinessException("FORBIDDEN", "Bạn không có quyền xác nhận yêu cầu bàn giao này", HttpStatus.FORBIDDEN);
        }

        allocation.setConfirmationStatus(ConfirmationStatus.CONFIRMED);
        allocation.setConfirmedAt(Instant.now());
        allocation.setConfirmedBy(userId);

        allocationRepository.save(allocation);
        assetService.markAssetAsAssigned(allocation.getAsset());

        auditLogService.log(
                userId,
                "CONFIRM",
                "ASSET",
                allocation.getAsset(),
                java.util.Map.of("allocationId", allocation.getId().toString())
        );
    }

    @Transactional
    public void rejectAllocation(UUID allocationId, UUID userId) {
        Allocation allocation = allocationRepository.findById(allocationId).orElseThrow(() ->
                new BusinessException("RESOURCE_NOT_FOUND", "Không tìm thấy yêu cầu bàn giao", HttpStatus.NOT_FOUND)
        );

        if (allocation.getConfirmationStatus() != ConfirmationStatus.PENDING) {
            throw new BusinessException("INVALID_STATUS", "Yêu cầu bàn giao thiết bị này không ở trạng thái chờ xác nhận", HttpStatus.BAD_REQUEST);
        }

        if (!userId.equals(allocation.getToUser())) {
            throw new BusinessException("FORBIDDEN", "Bạn không có quyền từ chối yêu cầu bàn giao này", HttpStatus.FORBIDDEN);
        }

        allocation.setConfirmationStatus(ConfirmationStatus.REJECTED);

        allocationRepository.save(allocation);

        // Phục hồi trạng thái cũ của thiết bị qua AssetService
        if (allocation.getActionType() == ActionType.ASSIGN) {
            assetService.markAssetAsAvailable(allocation.getAsset());
        } else if (allocation.getActionType() == ActionType.TRANSFER) {
            assetService.markAssetAsAssigned(allocation.getAsset());
        }

        auditLogService.log(
                userId,
                "REJECT",
                "ASSET",
                allocation.getAsset(),
                java.util.Map.of("allocationId", allocation.getId().toString())
        );
    }

    @Transactional(readOnly = true)
    public List<MyAssetResponse> getMyAssets(UUID userId) {
        return assetService.getMyAssets(userId).stream()
                .map(holder -> {
                    UUID allocationId = null;
                    if (holder.getConfirmationStatus() != null) {
                        try {
                            ConfirmationStatus status = ConfirmationStatus.valueOf(holder.getConfirmationStatus());
                            allocationId = allocationRepository.findFirstByAssetAndConfirmationStatusOrderByEventTimeDesc(holder.getAssetId(), status)
                                    .map(Allocation::getId)
                                    .orElse(null);
                        } catch (IllegalArgumentException e) {
                            throw new BusinessException("INVALID_CONFIRMATION_STATUS", 
                                    "Trạng thái xác nhận không hợp lệ: " + holder.getConfirmationStatus(), 
                                    HttpStatus.INTERNAL_SERVER_ERROR);
                        }
                    }
                    return new MyAssetResponse(holder.getAssetId(),
                            holder.getAssetCode(),
                            holder.getName(),
                            holder.getAssignedAt(),
                            holder.getConfirmationStatus(),
                            holder.getNotes(),
                            allocationId);
                }
                ).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<AllocationResponse> getAllAllocations(ConfirmationStatus status, Pageable pageable) {
        Page<Allocation> allocationPage;
        if (status != null) {
            allocationPage = allocationRepository.findByConfirmationStatus(status, pageable);
        } else {
            allocationPage = allocationRepository.findAll(pageable);
        }
        Page<AllocationResponse> responsePage = allocationPage.map(this::mapToResponse);
        return new PageResponse<>(responsePage);
    }

    @Transactional(readOnly = true)
    public List<AllocationResponse> getAssetHistory(UUID assetId) {
        return allocationRepository.findByAssetOrderByEventTimeDesc(assetId).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AllocationResponse> getAllAllocationsForReport(java.time.Instant from, java.time.Instant to) {
        return allocationRepository.findByEventTimeBetweenOrderByEventTimeDesc(from, to).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AllocationResponse mapToResponse(Allocation allocation) {
        return new AllocationResponse(
                allocation.getId(),
                allocation.getAsset(),
                allocation.getFromUser(),
                allocation.getToUser(),
                allocation.getActionType(),
                allocation.getEventTime(),
                allocation.getConfirmationStatus(),
                allocation.getConfirmedAt(),
                allocation.getNotes(),
                allocation.getHandoverDocUrl()
        );
    }
}
