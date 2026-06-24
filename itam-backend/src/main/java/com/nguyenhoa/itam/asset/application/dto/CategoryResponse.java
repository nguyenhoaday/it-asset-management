package com.nguyenhoa.itam.asset.application.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class CategoryResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private Map<String, Object> specificationSchema;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;

    public CategoryResponse(UUID id, String code, String name, String description, Map<String, Object> specificationSchema, Boolean isActive, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.specificationSchema = specificationSchema;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }


    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, Object> getSpecificationSchema() {
        return specificationSchema;
    }

    public void setSpecificationSchema(Map<String, Object> specificationSchema) {
        this.specificationSchema = specificationSchema;
    }

    public Boolean getActive() {
        return isActive;
    }

    public void setActive(Boolean active) {
        isActive = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
