package com.nguyenhoa.itam.audit.application.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class AuditLogResponse {
    private UUID id;
    private UUID userId;
    private String username;
    private String userFullName;
    private String action;
    private String entityType;
    private UUID entityId;
    private Map<String, Object> payloadDiff;
    private Instant createdAt;

    public AuditLogResponse(UUID id, UUID userId, String username, String userFullName,
                            String action, String entityType, UUID entityId,
                            Map<String, Object> payloadDiff, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.userFullName = userFullName;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.payloadDiff = payloadDiff;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUserFullName() {
        return userFullName;
    }

    public void setUserFullName(String userFullName) {
        this.userFullName = userFullName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public UUID getEntityId() {
        return entityId;
    }

    public void setEntityId(UUID entityId) {
        this.entityId = entityId;
    }

    public Map<String, Object> getPayloadDiff() {
        return payloadDiff;
    }

    public void setPayloadDiff(Map<String, Object> payloadDiff) {
        this.payloadDiff = payloadDiff;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
