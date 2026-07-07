package com.nguyenhoa.itam.asset.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.UUID;

public class CategoryRequest {
    @NotBlank(message = "Mã danh mục không được để trống")
    @Size(max = 50, message = "Mã danh mục không được vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 255,  message = "Tên danh mục không được vượt quá 255 ký tự")
    private String name;

    private String description;
    private Integer defaultUsefulLifeMonths;
    private UUID scoringPolicyId;
    private Map<String, Object> specificationSchema;
    private Boolean isActive = true;

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

    public Integer getDefaultUsefulLifeMonths() {
        return defaultUsefulLifeMonths;
    }

    public void setDefaultUsefulLifeMonths(Integer defaultUsefulLifeMonths) {
        this.defaultUsefulLifeMonths = defaultUsefulLifeMonths;
    }

    public UUID getScoringPolicyId() {
        return scoringPolicyId;
    }

    public void setScoringPolicyId(UUID scoringPolicyId) {
        this.scoringPolicyId = scoringPolicyId;
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
}
