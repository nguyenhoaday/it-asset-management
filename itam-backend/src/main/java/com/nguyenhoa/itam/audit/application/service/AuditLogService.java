package com.nguyenhoa.itam.audit.application.service;

import com.nguyenhoa.itam.audit.application.dto.AuditLogResponse;
import com.nguyenhoa.itam.audit.domain.AuditLog;
import com.nguyenhoa.itam.audit.domain.AuditLogRepository;
import com.nguyenhoa.itam.iam.application.dto.UserProfileResponse;
import com.nguyenhoa.itam.iam.application.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final UserService userService;

    public AuditLogService(AuditLogRepository auditLogRepository, UserService userService) {
        this.auditLogRepository = auditLogRepository;
        this.userService = userService;
    }

    @Transactional
    public void log(UUID userId, String action, String entityType, UUID entityId, Map<String, Object> payloadDiff) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUser(userId);
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setPayloadDiff(payloadDiff != null ? payloadDiff : Map.of());
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(String entityType, UUID entityId, String action, Pageable pageable) {
        Page<AuditLog> auditLogsPage = auditLogRepository.searchAuditLogs(entityType, entityId, action, pageable);

        List<UUID> userIds = auditLogsPage.getContent().stream()
                .map(AuditLog::getUser)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<UUID, UserProfileResponse> userProfiles = userService.getUserProfilesMap(userIds);

        return auditLogsPage.map(log -> {
            UUID userId = log.getUser();
            UserProfileResponse profile = userId != null ? userProfiles.get(userId) : null;
            String username = profile != null ? profile.getUsername() : "unknown";
            String userFullName = profile != null ? profile.getFullName() : "Hệ thống / Đã xóa";
            
            return new AuditLogResponse(
                    log.getId(),
                    userId,
                    username,
                    userFullName,
                    log.getAction(),
                    log.getEntityType(),
                    log.getEntityId(),
                    log.getPayloadDiff(),
                    log.getCreatedAt()
            );
        });
    }
}
