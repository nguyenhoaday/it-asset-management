package com.nguyenhoa.itam.asset.application.dto;

import com.nguyenhoa.itam.asset.domain.ScoringPolicy;

import java.time.Instant;
import java.util.UUID;

public class ScoringPolicyResponse {
    private UUID id;
    private String name;
    private String description;
    private Integer weightAge;
    private Integer weightWarranty;
    private Integer weightIncident;
    private Integer weightCondition;
    private Boolean isDefault;
    private Instant createdAt;
    private Instant updatedAt;

    public ScoringPolicyResponse() {
    }

    public static ScoringPolicyResponse fromEntity(ScoringPolicy policy) {
        if (policy == null) return null;
        ScoringPolicyResponse res = new ScoringPolicyResponse();
        res.setId(policy.getId());
        res.setName(policy.getName());
        res.setDescription(policy.getDescription());
        res.setWeightAge(policy.getWeightAge());
        res.setWeightWarranty(policy.getWeightWarranty());
        res.setWeightIncident(policy.getWeightIncident());
        res.setWeightCondition(policy.getWeightCondition());
        res.setIsDefault(policy.getIsDefault());
        res.setCreatedAt(policy.getCreatedAt());
        res.setUpdatedAt(policy.getUpdatedAt());
        return res;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public Integer getWeightAge() {
        return weightAge;
    }

    public void setWeightAge(Integer weightAge) {
        this.weightAge = weightAge;
    }

    public Integer getWeightWarranty() {
        return weightWarranty;
    }

    public void setWeightWarranty(Integer weightWarranty) {
        this.weightWarranty = weightWarranty;
    }

    public Integer getWeightIncident() {
        return weightIncident;
    }

    public void setWeightIncident(Integer weightIncident) {
        this.weightIncident = weightIncident;
    }

    public Integer getWeightCondition() {
        return weightCondition;
    }

    public void setWeightCondition(Integer weightCondition) {
        this.weightCondition = weightCondition;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
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
