package com.nguyenhoa.itam.maintenance.application.service;

import com.nguyenhoa.itam.asset.application.service.AssetService;
import com.nguyenhoa.itam.iam.application.service.UserService;
import com.nguyenhoa.itam.common.exception.BusinessException;
import com.nguyenhoa.itam.maintenance.application.dto.CompleteMaintenanceRequest;
import com.nguyenhoa.itam.maintenance.application.dto.MaintenanceLogRequest;
import com.nguyenhoa.itam.maintenance.application.dto.MaintenanceLogResponse;
import com.nguyenhoa.itam.maintenance.domain.MaintenanceLog;
import com.nguyenhoa.itam.maintenance.domain.MaintenanceLogRepository;
import com.nguyenhoa.itam.maintenance.domain.MaintenanceStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MaintenanceService {
    private final MaintenanceLogRepository maintenanceLogRepository;
    private final AssetService assetService;
    private final UserService userService;

    public MaintenanceService(MaintenanceLogRepository maintenanceLogRepository, AssetService assetService, UserService userService) {
        this.maintenanceLogRepository = maintenanceLogRepository;
        this.assetService = assetService;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public long getMaintenanceCountByAsset(UUID assetId) {
        return maintenanceLogRepository.countByAsset(assetId);
    }

    // Bắt đầu bảo trì một thiết bị
    @Transactional
    public MaintenanceLogResponse startMaintenance(MaintenanceLogRequest request, UUID createdBy) {
        UUID assetId = request.getAssetId();

        // Kiểm tra thiết bị có tồn tại hay không (ném lỗi 404 nếu đã bị xóa mềm)
        assetService.getAssetById(assetId);

        // Kiểm tra xem thiết bị có đang ở trạng thái bảo trì
        if (assetService.isAssetInMaintenance(assetId)) {
            throw new BusinessException("ASSET_IN_MAINTENANCE",
                    "Thiết bị này đang trong quá trình bảo trì rồi",
                    HttpStatus.CONFLICT);
        }

        MaintenanceLog maintenanceLog = new MaintenanceLog();
        maintenanceLog.setAsset(assetId);
        maintenanceLog.setHandledBy(createdBy); // Người chịu trách nhiệm ban đầu
        maintenanceLog.setProviderName(request.getProviderName() != null ? request.getProviderName().trim() : null);
        maintenanceLog.setIssueDescription(request.getIssueDecription());
        maintenanceLog.setStatus(MaintenanceStatus.IN_PROGRESS);
        maintenanceLog.setStartDate(request.getStartDate());
        maintenanceLog.setCreatedBy(createdBy);

        MaintenanceLog savedMaintenanceLog = maintenanceLogRepository.save(maintenanceLog);
        // Set trạng thái bảo trì cho tài sản
        assetService.markAssetAsMaintenance(savedMaintenanceLog.getAsset());
        return mapToResponse(savedMaintenanceLog);
    }

    // Hoàn tất bảo trì thiết bị
    @Transactional
    public MaintenanceLogResponse completeMaintenance(UUID logId, CompleteMaintenanceRequest request) {
        MaintenanceLog maintenanceLog = maintenanceLogRepository.findById(logId)
                .orElseThrow(() -> new BusinessException("LOG_NOT_FOUND", "Không tìm thấy lịch sử bảo trì", HttpStatus.NOT_FOUND));

        if (maintenanceLog.getStatus() == MaintenanceStatus.COMPLETED) {
            throw new BusinessException("LOG_ALREADY_COMPLETED",
                    "Phiếu bảo trì này đã hoàn thành từ trước",
                    HttpStatus.BAD_REQUEST);
        }

        // Cập nhật thông tin kết quả bảo trì
        maintenanceLog.setStatus(MaintenanceStatus.COMPLETED);
        maintenanceLog.setRepairCost(request.getRepairCost());
        maintenanceLog.setActionTaken(request.getActionTaken().trim());
        maintenanceLog.setEndDate(request.getEndDate());

        MaintenanceLog updated = maintenanceLogRepository.save(maintenanceLog);

        // Trả thiết bị về trạng thái AVAILABLE (sẵn sàng cấp phát) thông qua AssetService
        assetService.markAssetAsAvailable(updated.getAsset());
        return mapToResponse(updated);
    }

    // Xem lịch sử bảo trì
    @Transactional(readOnly = true)
    public List<MaintenanceLogResponse> getAssetHistory(UUID assetId) {
        // Kiểm tra thiết bị có tồn tại
        assetService.getAssetById(assetId);

        List<MaintenanceLog> logs = maintenanceLogRepository.findByAssetOrderByCreatedAtDesc(assetId);
        return logs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MaintenanceLogResponse> getAllMaintenancesForReport(java.time.LocalDate from, java.time.LocalDate to) {
        return maintenanceLogRepository.findByStartDateBetweenOrderByStartDateDesc(from, to).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private MaintenanceLogResponse mapToResponse(MaintenanceLog log) {
        return new MaintenanceLogResponse(log.getId(),
                log.getAsset(),
                log.getHandledBy(),
                log.getProviderName(),
                log.getRepairCost(),
                log.getIssueDescription(),
                log.getActionTaken(),
                log.getStatus(),
                log.getStartDate(),
                log.getEndDate(),
                log.getCreatedBy(),
                log.getCreatedAt(),
                log.getUpdatedAt());
    }
}
