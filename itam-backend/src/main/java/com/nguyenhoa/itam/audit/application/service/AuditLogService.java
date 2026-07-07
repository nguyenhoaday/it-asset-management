package com.nguyenhoa.itam.audit.application.service;

import com.nguyenhoa.itam.audit.application.dto.AuditLogResponse;
import com.nguyenhoa.itam.audit.domain.AuditLog;
import com.nguyenhoa.itam.audit.domain.AuditLogRepository;
import com.nguyenhoa.itam.iam.application.dto.UserProfileResponse;
import com.nguyenhoa.itam.iam.application.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;
    private final UserService userService;

    public AuditLogService(AuditLogRepository auditLogRepository, @Lazy UserService userService) {
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
        // Tự động trích xuất IP và User-Agent hiện tại
        RequestAttributes attribs = RequestContextHolder.getRequestAttributes();
        if (attribs instanceof ServletRequestAttributes servletAttribs) {
            HttpServletRequest request = servletAttribs.getRequest();
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            } else {
                ip = ip.split(",")[0].trim();
            }
            auditLog.setIpAddress(ip);
            String userAgent = request.getHeader("User-Agent");
            if (userAgent != null && userAgent.length() > 500) {
                userAgent = userAgent.substring(0, 500);
            }
            auditLog.setUserAgent(userAgent);
        }
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(String entityType, UUID entityId, String action, Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (entityType != null && !entityType.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("entityType"), entityType.trim()));
            }
            if (entityId != null) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
            }
            if (action != null && !action.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("action"), action.trim()));
            }
            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        Page<AuditLog> auditLogsPage = auditLogRepository.findAll(spec, pageable);

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
                    log.getIpAddress(),
                    log.getUserAgent(),
                    log.getCreatedAt()
            );
        });
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllAuditLogsForReport(String entityType, UUID entityId, String action) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (entityType != null && !entityType.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("entityType"), entityType.trim()));
            }
            if (entityId != null) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
            }
            if (action != null && !action.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("action"), action.trim()));
            }
            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        List<AuditLog> auditLogs = auditLogRepository.findAll(spec);

        List<UUID> userIds = auditLogs.stream()
                .map(AuditLog::getUser)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<UUID, UserProfileResponse> userProfiles = userService.getUserProfilesMap(userIds);

        return auditLogs.stream().map(log -> {
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
                    log.getIpAddress(),
                    log.getUserAgent(),
                    log.getCreatedAt()
            );
        }).collect(Collectors.toList());
    }
}
