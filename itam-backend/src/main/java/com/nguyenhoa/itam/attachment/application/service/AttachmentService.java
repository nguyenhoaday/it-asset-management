package com.nguyenhoa.itam.attachment.application.service;

import com.nguyenhoa.itam.attachment.domain.Attachment;
import com.nguyenhoa.itam.attachment.domain.AttachmentRepository;
import com.nguyenhoa.itam.common.application.service.FileStorageService;
import com.nguyenhoa.itam.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final FileStorageService fileStorageService;

    public AttachmentService(AttachmentRepository attachmentRepository, FileStorageService fileStorageService) {
        this.attachmentRepository = attachmentRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public Attachment createAttachment(MultipartFile file, String entityType, UUID entityId, UUID uploadedById) {
        String uniqueFileName = fileStorageService.storeFile(file);
        String fileUrl = "/api/v1/attachments/files/" + uniqueFileName;

        Attachment attachment = new Attachment();
        attachment.setEntityType(entityType);
        attachment.setEntityId(entityId != null ? entityId : UUID.fromString("00000000-0000-0000-0000-000000000000"));
        attachment.setFileType(file.getContentType());
        attachment.setFileUrl(fileUrl);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setUploadedBy(uploadedById);

        return attachmentRepository.save(attachment);
    }

    @Transactional
    public void updateEntityId(UUID attachmentId, UUID entityId) {
        Attachment attachment = attachmentRepository.findById(attachmentId).orElseThrow(() ->
                new BusinessException("ATTACHMENT_NOT_FOUND", "Không tìm thấy tài liệu đính kèm", HttpStatus.NOT_FOUND)
        );
        attachment.setEntityId(entityId);
        attachmentRepository.save(attachment);
    }

    @Transactional
    public void updateEntityIdByUrl(String fileUrl, UUID entityId) {
        attachmentRepository.findByFileUrl(fileUrl).ifPresent(attachment -> {
            attachment.setEntityId(entityId);
            attachmentRepository.save(attachment);
        });
    }

    @Transactional(readOnly = true)
    public List<Attachment> getAttachments(String entityType, UUID entityId) {
        return attachmentRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    @Transactional
    public void deleteAttachment(UUID id) {
        Attachment attachment = attachmentRepository.findById(id).orElseThrow(() ->
                new BusinessException("ATTACHMENT_NOT_FOUND", "Không tìm thấy tài liệu đính kèm", HttpStatus.NOT_FOUND)
        );
        
        attachmentRepository.delete(attachment);

        String fileUrl = attachment.getFileUrl();
        String fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads").resolve(fileName).toAbsolutePath().normalize();
            java.nio.file.Files.deleteIfExists(filePath);
        } catch (Exception ex) {
            System.err.println("Failed to delete physical file: " + fileName + ". Reason: " + ex.getMessage());
        }
    }
}
