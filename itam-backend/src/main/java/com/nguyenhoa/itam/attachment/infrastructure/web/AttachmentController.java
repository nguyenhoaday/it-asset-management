package com.nguyenhoa.itam.attachment.infrastructure.web;

import com.nguyenhoa.itam.attachment.domain.Attachment;
import com.nguyenhoa.itam.attachment.application.service.AttachmentService;
import com.nguyenhoa.itam.common.application.service.FileStorageService;
import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final FileStorageService fileStorageService;

    public AttachmentController(AttachmentService attachmentService, FileStorageService fileStorageService) {
        this.attachmentService = attachmentService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<Attachment>> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam(value = "entityId", required = false) UUID entityId,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        Attachment attachment = attachmentService.createAttachment(file, entityType, entityId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(attachment));
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> getAttachmentFile(@PathVariable String fileName, HttpServletRequest request) {
        Resource resource = fileStorageService.loadFileAsResource(fileName);

        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            // Fallback
        }

        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<Attachment>>> getAttachments(
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") UUID entityId
    ) {
        List<Attachment> attachments = attachmentService.getAttachments(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.success(attachments));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable UUID id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
