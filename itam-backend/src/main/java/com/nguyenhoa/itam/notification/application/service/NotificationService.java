package com.nguyenhoa.itam.notification.application.service;

import com.nguyenhoa.itam.notification.domain.Notification;
import com.nguyenhoa.itam.notification.domain.NotificationRepository;
import com.nguyenhoa.itam.notification.domain.NotificationStatus;
import com.nguyenhoa.itam.notification.infrastructure.websocket.NotificationWebSocketHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;


import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationWebSocketHandler webSocketHandler,
                               ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.webSocketHandler = webSocketHandler;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void sendInAppNotification(String recipientEmail, String recipientName,
                                      String subject, String body,
                                      String notificationType,
                                      String relatedEntityType, UUID relatedEntityId) {
        Notification notification = new Notification();
        notification.setRecipientEmail(recipientEmail);
        notification.setRecipientName(recipientName);
        notification.setSubject(subject);
        notification.setBody(body);
        notification.setNotificationType(notificationType);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setStatus(NotificationStatus.SENT);

        Notification saved = notificationRepository.save(notification);

        try {
            String payload = objectMapper.writeValueAsString(saved);
            webSocketHandler.sendMessageToUser(saved.getRecipientEmail(), payload);
        } catch (Exception e) {
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> getMyNotifications(String email) {
        return notificationRepository.findTop20ByRecipientEmailOrderBySentAtDesc(email);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        return notificationRepository.countByRecipientEmailAndStatus(email, NotificationStatus.SENT);
    }

    @Transactional
    public void markAsRead(UUID notificationId, String email) {
        notificationRepository.findById(notificationId).ifPresent(notif -> {
            if (notif.getRecipientEmail().equalsIgnoreCase(email)) {
                notif.setStatus(NotificationStatus.READ);
                notificationRepository.save(notif);
            }
        });
    }

    @Transactional
    public void markAllAsRead(String email) {
        List<Notification> list = notificationRepository.findTop20ByRecipientEmailOrderBySentAtDesc(email);
        for (Notification notif : list) {
            if (notif.getStatus() == NotificationStatus.SENT) {
                notif.setStatus(NotificationStatus.READ);
            }
        }
        notificationRepository.saveAll(list);
    }
}
