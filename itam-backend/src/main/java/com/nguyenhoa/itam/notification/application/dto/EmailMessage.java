package com.nguyenhoa.itam.notification.application.dto;

import java.io.Serializable;
import java.util.UUID;

public class EmailMessage implements Serializable {
    private static final long serialVersionUID = 1L;

    private String recipientEmail;
    private String recipientName;
    private String subject;
    private String body;
    private String notificationType;
    private String relatedEntityType;
    private UUID relatedEntityId;

    public EmailMessage() {}

    public EmailMessage(String recipientEmail, String recipientName, String subject, String body, String notificationType, String relatedEntityType, UUID relatedEntityId) {
        this.recipientEmail = recipientEmail;
        this.recipientName = recipientName;
        this.subject = subject;
        this.body = body;
        this.notificationType = notificationType;
        this.relatedEntityType = relatedEntityType;
        this.relatedEntityId = relatedEntityId;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(String notificationType) {
        this.notificationType = notificationType;
    }

    public String getRelatedEntityType() {
        return relatedEntityType;
    }

    public void setRelatedEntityType(String relatedEntityType) {
        this.relatedEntityType = relatedEntityType;
    }

    public UUID getRelatedEntityId() {
        return relatedEntityId;
    }

    public void setRelatedEntityId(UUID relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }
}
