package com.nguyenhoa.itam.notification.application.service;

import com.nguyenhoa.itam.notification.application.dto.EmailMessage;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class EmailMessageProducer {
    public static final String EMAIL_QUEUE = "itam:email:queue";
    private final RedisTemplate<String, Object> redisTemplate;

    public EmailMessageProducer(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void queueEmail(EmailMessage message) {
        redisTemplate.opsForList().leftPush(EMAIL_QUEUE, message);
    }
}
