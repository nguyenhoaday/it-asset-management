package com.nguyenhoa.itam.inventory.application.service;

import com.nguyenhoa.itam.asset.application.service.AssetService;
import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.inventory.application.dto.*;
import com.nguyenhoa.itam.inventory.domain.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.nguyenhoa.itam.common.dto.PageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InventoryService {
    private final InventorySessionRepository inventorySessionRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final AssetService assetService;

    public InventoryService(InventorySessionRepository inventorySessionRepository, InventoryItemRepository inventoryItemRepository, AssetService assetService) {
        this.inventorySessionRepository = inventorySessionRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.assetService = assetService;
    }

    // Tạo đợt kiểm kê mới
    @Transactional
    public InventorySessionResponse createSession(InventorySessionRequest request, UUID createdBy) {
        if (inventorySessionRepository.existsByStatus(InventorySessionStatus.ACTIVE)) {
            throw new BusinessException("ACTIVE_SESSION_EXISTS",
                    "Đã có một đợt kiểm kê đang hoạt động. Vui lòng đóng đợt hiện tại trước khi tạo mới.",
                    HttpStatus.CONFLICT);
        }

        InventorySession session = new InventorySession();
        session.setTitle(request.getTitle());
        session.setCreatedBy(createdBy);
        session.setStatus(InventorySessionStatus.ACTIVE);
        session.setCreatedAt(Instant.now());

        InventorySession savedSession = inventorySessionRepository.save(session);
        return mapToSessionResponse(savedSession);
    }

    // Ghi nhận kết quả quét một tài sản
    @Transactional
    public InventoryItemResponse checkItem(UUID sessionId, InventoryItemRequest request, UUID checkedBy) {
        InventorySession inventorySession = inventorySessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException("SESSION_NOT_FOUND", "Không tìm thấy đợt kiểm kê", HttpStatus.NOT_FOUND));

        if (inventorySession.getStatus() != InventorySessionStatus.ACTIVE) {
            throw new BusinessException("SESSION_CLOSED", "Đợt kiểm kê này đã được đóng", HttpStatus.BAD_REQUEST);
        }

        // Kiểm tra tài sản tồn tại (thông qua AssetService trong module asset)
        assetService.getAssetById(request.getAssetId());

        // Kiểm tra xem thiết bị này đã được quét trong phiên hiện tại chưa
        if (inventoryItemRepository.existsBySessionIdAndAsset(sessionId, request.getAssetId())) {
            throw new BusinessException("DUPLICATE_SCAN",
                    "Thiết bị này đã được quét trong đợt kiểm kê này",
                    HttpStatus.CONFLICT);
        }

        InventoryItem inventoryItem = new InventoryItem();
        inventoryItem.setSession(inventorySession);
        inventoryItem.setAsset(request.getAssetId());
        inventoryItem.setCheckedBy(checkedBy);
        inventoryItem.setCheckedStatus(request.getCheckedStatus());
        inventoryItem.setCheckedAt(Instant.now());
        inventoryItem.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);

        InventoryItem savedItem = inventoryItemRepository.save(inventoryItem);
        return mapToItemResponse(savedItem);
    }

    // Đồng bộ quét hàng loạt (bỏ qua trùng lặp)
    @Transactional
    public BatchScanResultResponse checkItemsBatch(UUID sessionId, List<InventoryItemRequest> requests, UUID checkedBy) {
        InventorySession session = inventorySessionRepository.findById(sessionId)
                .orElseThrow(() -> new  BusinessException("SESSION_NOT_FOUND", "Không tìm thấy đợt kiểm kê", HttpStatus.NOT_FOUND));

        if (session.getStatus() != InventorySessionStatus.ACTIVE) {
            throw new BusinessException("SESSION_CLOSED", "Đợt kiểm kê này đã được đóng", HttpStatus.BAD_REQUEST);
        }

        List<UUID> successfulAssetIds = new ArrayList<>();
        List<UUID> duplicateAssetIds = new ArrayList<>();
        List<InventoryItem> itemsToSave = new ArrayList<>();

        for (InventoryItemRequest inventoryItemRequest : requests) {
            UUID assetId = inventoryItemRequest.getAssetId();
            //Kiểm tra tài sản có tồn tại
            try {
                assetService.getAssetById(assetId);
            } catch (BusinessException e) {
                throw new BusinessException("ASSET_NOT_FOUND", "Mã thiết bị quét không tồn tại: " + assetId, HttpStatus.NOT_FOUND);
            }

            // Kiểm tra quét trùng
            if (inventoryItemRepository.existsBySessionIdAndAsset(sessionId, assetId)) {
                duplicateAssetIds.add(assetId);
            } else {
                InventoryItem inventoryItem = new InventoryItem();
                inventoryItem.setSession(session);
                inventoryItem.setAsset(assetId);
                inventoryItem.setCheckedBy(checkedBy);
                inventoryItem.setCheckedStatus(inventoryItemRequest.getCheckedStatus());
                inventoryItem.setCheckedAt(Instant.now());
                inventoryItem.setNotes(inventoryItemRequest.getNotes() != null ? inventoryItemRequest.getNotes().trim() : null);

                itemsToSave.add(inventoryItem);
                successfulAssetIds.add(assetId);
            }
        }

        if (!itemsToSave.isEmpty()) {
            inventoryItemRepository.saveAll(itemsToSave);
        }

        return new BatchScanResultResponse(requests.size(),
                successfulAssetIds.size(),
                duplicateAssetIds.size(),
                successfulAssetIds,
                duplicateAssetIds);
    }


    // Đóng phiên kiểm kê và tự động sinh bản ghi UNVERIFIED cho các tài sản chưa quét
    @Transactional
    public InventorySessionResponse closeSession(UUID sessionId) {
        InventorySession session = inventorySessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException("SESSION_NOT_FOUND", "Không tìm thấy đợt kiểm kê", HttpStatus.NOT_FOUND));

        if (session.getStatus() == InventorySessionStatus.CLOSED) {
            return mapToSessionResponse(session); // Đã đóng session trước đó
        }

        session.setStatus(InventorySessionStatus.CLOSED);
        session.setClosedAt(Instant.now());
        InventorySession savedSession = inventorySessionRepository.save(session);

        List<UUID> allActiveAssetIds = assetService.getAllActiveAssetsIds();

        List<InventoryItem> scannedItems = inventoryItemRepository.findBySessionId(sessionId);
        Set<UUID> scannedAssetIds = scannedItems.stream()
                .map(InventoryItem::getAsset)
                .collect(Collectors.toSet());

        List<InventoryItem> unverifiedItems = new ArrayList<>();
        for (UUID assetId : allActiveAssetIds) {
            if (!scannedAssetIds.contains(assetId)) {
                InventoryItem inventoryItem = new InventoryItem();
                inventoryItem.setSession(session);
                inventoryItem.setAsset(assetId);
                inventoryItem.setCheckedBy(session.getCreatedBy()); // Lấy ID người tạo đợt làm người ghi nhận hệ thống
                inventoryItem.setCheckedStatus(CheckedStatus.UNVERIFIED);
                inventoryItem.setCheckedAt(Instant.now());
                inventoryItem.setNotes("Thiết bị không được quét trong đợt kiểm kê. Tự động đánh dấu chưa xác minh.");

                unverifiedItems.add(inventoryItem);
            }
        }

        if (!unverifiedItems.isEmpty()) {
            inventoryItemRepository.saveAll(unverifiedItems);
        }

        return mapToSessionResponse(savedSession);
    }

    // Xuất báo cáo đợt kiểm kê
    @Transactional
    public InventoryReportResponse getReport(UUID sessionId) {
        InventorySession session = inventorySessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException("SESSION_NOT_FOUND", "Không tìm thấy đợt kiểm kê", HttpStatus.NOT_FOUND));

        long totalAssets = assetService.countActiveAssets();
        long found = inventoryItemRepository.countBySessionIdAndCheckedStatus(sessionId, CheckedStatus.FOUND);
        long missing = inventoryItemRepository.countBySessionIdAndCheckedStatus(sessionId, CheckedStatus.MISSING);
        long damaged = inventoryItemRepository.countBySessionIdAndCheckedStatus(sessionId, CheckedStatus.DAMAGED);
        long unverified = inventoryItemRepository.countBySessionIdAndCheckedStatus(sessionId, CheckedStatus.UNVERIFIED);
        long scannedCount = found + missing + damaged;

        return new InventoryReportResponse(session.getId(),
                session.getTitle(),
                session.getStatus(),
                totalAssets,
                scannedCount,
                found,
                missing,
                damaged,
                unverified);
    }

    @Transactional(readOnly = true)
    public boolean hasActiveSessions() {
        return inventorySessionRepository.existsByStatus(InventorySessionStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public PageResponse<InventorySessionResponse> getAllSessions(Pageable pageable) {
        Page<InventorySession> sessionPage = inventorySessionRepository.findAll(pageable);
        Page<InventorySessionResponse> responsePage = sessionPage.map(this::mapToSessionResponse);
        return new PageResponse<>(responsePage);
    }

    @Transactional(readOnly = true)
    public InventorySessionResponse getActiveSession() {
        return inventorySessionRepository.findFirstByStatus(InventorySessionStatus.ACTIVE)
                .map(this::mapToSessionResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getInventoryItemsForReport(UUID sessionId) {
        return inventoryItemRepository.findBySessionId(sessionId).stream()
                .map(this::mapToItemResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InventorySessionResponse getSessionById(UUID sessionId) {
        return inventorySessionRepository.findById(sessionId)
                .map(this::mapToSessionResponse)
                .orElseThrow(() -> new BusinessException("SESSION_NOT_FOUND", "Không tìm thấy đợt kiểm kê", HttpStatus.NOT_FOUND));
    }

    private InventoryItemResponse mapToItemResponse(InventoryItem item) {
        return new InventoryItemResponse(item.getId(),
                item.getSession().getId(),
                item.getAsset(),
                item.getCheckedBy(),
                item.getCheckedStatus(),
                item.getCheckedAt(),
                item.getNotes());
    }

    private InventorySessionResponse mapToSessionResponse(InventorySession session) {
        return new InventorySessionResponse(session.getId(),
                session.getTitle(),
                session.getCreatedBy(),
                session.getStatus(),
                session.getCreatedAt(),
                session.getClosedAt()
        );
    }
}
