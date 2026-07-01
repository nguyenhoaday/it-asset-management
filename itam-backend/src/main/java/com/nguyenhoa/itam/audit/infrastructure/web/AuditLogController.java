package com.nguyenhoa.itam.audit.infrastructure.web;

import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.common.dto.PageResponse;
import com.nguyenhoa.itam.audit.application.dto.AuditLogResponse;
import com.nguyenhoa.itam.audit.application.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditLogController {
    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogResponse> logs = auditLogService.getAuditLogs(entityType, entityId, action, pageable);
        return ResponseEntity.ok(ApiResponse.success(new PageResponse<>(logs)));
    }
}
