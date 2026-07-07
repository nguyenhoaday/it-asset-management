package com.nguyenhoa.itam.audit.infrastructure.web;

import com.nguyenhoa.itam.audit.application.dto.AuditLogResponse;
import com.nguyenhoa.itam.audit.application.service.AuditLogService;
import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.common.dto.PageResponse;
import com.nguyenhoa.itam.report.application.service.ExcelExporter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditLogController {
    private final AuditLogService auditLogService;
    private final ExcelExporter excelExporter;

    public AuditLogController(AuditLogService auditLogService, ExcelExporter excelExporter) {
        this.auditLogService = auditLogService;
        this.excelExporter = excelExporter;
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
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogResponse> logs = auditLogService.getAuditLogs(entityType, entityId, action, pageable);
        return ResponseEntity.ok(ApiResponse.success(new PageResponse<>(logs)));
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<byte[]> exportAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "vi") String lang
    ) throws IOException {
        // Gọi service lấy toàn bộ log không phân trang theo filter
        List<AuditLogResponse> logs = auditLogService.getAllAuditLogsForReport(entityType, entityId, action);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        excelExporter.exportAuditLogs(logs, lang, out);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit_logs_" + LocalDate.now() + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(out.toByteArray());
    }
}
