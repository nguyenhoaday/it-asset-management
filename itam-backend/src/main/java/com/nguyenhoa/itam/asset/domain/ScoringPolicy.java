package com.nguyenhoa.itam.asset.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "scoring_policies")
public class ScoringPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("uuid_generate_v4()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @Size(max = 255)
    @NotNull
    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @NotNull
    @Min(0)
    @Max(100)
    @Column(name = "weight_age", nullable = false)
    private Integer weightAge = 30;

    @NotNull
    @Min(0)
    @Max(100)
    @Column(name = "weight_warranty", nullable = false)
    private Integer weightWarranty = 20;

    @NotNull
    @Min(0)
    @Max(100)
    @Column(name = "weight_incident", nullable = false)
    private Integer weightIncident = 30;

    @NotNull
    @Min(0)
    @Max(100)
    @Column(name = "weight_condition", nullable = false)
    private Integer weightCondition = 20;

    @ColumnDefault("false")
    @Column(name = "is_default")
    private Boolean isDefault = false;

    @CreationTimestamp
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private Instant updatedAt;

    public ScoringPolicy() {
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
