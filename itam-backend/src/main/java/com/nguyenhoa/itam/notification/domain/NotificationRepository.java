package com.nguyenhoa.itam.notification.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findTop20ByRecipientEmailOrderBySentAtDesc(String recipientEmail);
    long countByRecipientEmailAndStatus(String recipientEmail, NotificationStatus status);
    long deleteBySentAtBefore(Instant sentAt);
}
