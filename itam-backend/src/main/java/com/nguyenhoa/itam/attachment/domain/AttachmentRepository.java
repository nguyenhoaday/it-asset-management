package com.nguyenhoa.itam.attachment.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findByEntityTypeAndEntityId(String entityType, UUID entityId);
    Optional<Attachment> findByFileUrl(String fileUrl);
}
