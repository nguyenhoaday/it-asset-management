package com.nguyenhoa.itam.notification.application.service;

import org.springframework.beans.factory.annotation.Value;
import tools.jackson.databind.ObjectMapper;
import com.nguyenhoa.itam.notification.application.dto.EmailMessage;
import com.nguyenhoa.itam.notification.domain.Notification;
import com.nguyenhoa.itam.notification.domain.NotificationRepository;
import com.nguyenhoa.itam.notification.domain.NotificationStatus;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.RedisTemplate;
import com.nguyenhoa.itam.notification.infrastructure.websocket.NotificationWebSocketHandler;

import java.time.Instant;

@Service
public class EmailMessageConsumer {
    private static final Logger log = LoggerFactory.getLogger(EmailMessageConsumer.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;
    private final String fromEmail;
    private final String fromName;
    private final ObjectMapper objectMapper;
    private final NotificationWebSocketHandler webSocketHandler;

    public EmailMessageConsumer(RedisTemplate<String, Object> redisTemplate,
                                JavaMailSender mailSender,
                                NotificationRepository notificationRepository,
                                ObjectMapper objectMapper,
                                NotificationWebSocketHandler webSocketHandler,
                                @Value("${app.mail.from-email}") String fromEmail,
                                @Value("${app.mail.from-name}") String fromName) {
        this.redisTemplate = redisTemplate;
        this.mailSender = mailSender;
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
        this.webSocketHandler = webSocketHandler;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
    }

    @Scheduled(fixedDelay = 5000)
    public void consumeEmail() {
        Object msgObj = redisTemplate.opsForList().rightPop(EmailMessageProducer.EMAIL_QUEUE);

        if (msgObj == null) {
            return;
        }

        EmailMessage emailMessage;
        try {
            emailMessage = objectMapper.convertValue(msgObj, EmailMessage.class);
        } catch (Exception e) {
            log.warn("Nhận tin nhắn không đúng định dạng từ Redis: {}", msgObj, e);
            return;
        }

        log.info("Bắt đầu xử lý gửi email tới: {}", emailMessage.getRecipientEmail());

        Notification notification = new Notification();
        notification.setRecipientEmail(emailMessage.getRecipientEmail());
        notification.setRecipientName(emailMessage.getRecipientName());
        notification.setSubject(emailMessage.getSubject());
        notification.setBody(emailMessage.getBody());
        notification.setNotificationType(emailMessage.getNotificationType());
        notification.setRelatedEntityType(emailMessage.getRelatedEntityType());
        notification.setRelatedEntityId(emailMessage.getRelatedEntityId());
        notification.setSentAt(Instant.now());

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(emailMessage.getRecipientEmail());
            helper.setSubject(emailMessage.getSubject());
            helper.setText(emailMessage.getBody(), true);
            mailSender.send(mimeMessage);

            notification.setStatus(NotificationStatus.SENT);
            log.info("Đã gửi email thành công tới {}", emailMessage.getRecipientEmail());
        } catch (Exception e) {
            log.error("Lỗi gửi email tới {}: {}", emailMessage.getRecipientEmail(), e.getMessage());
            notification.setStatus(NotificationStatus.FAILED);
        } finally {
            Notification saved = notificationRepository.save(notification);
            // Chỉ push WebSocket khi email gửi thành công
            if (saved.getStatus() == NotificationStatus.SENT) {
                try {
                    String payload = objectMapper.writeValueAsString(saved);
                    webSocketHandler.sendMessageToUser(saved.getRecipientEmail(), payload);
                } catch (Exception e) {
                    log.error("Failed to send WebSocket notification to {}: {}", saved.getRecipientEmail(), e.getMessage());
                }
            }
        }
    }
}
