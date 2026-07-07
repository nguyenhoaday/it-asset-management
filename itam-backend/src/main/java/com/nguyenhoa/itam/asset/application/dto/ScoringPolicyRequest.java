package com.nguyenhoa.itam.asset.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ScoringPolicyRequest {
    @NotBlank(message = "Tên chính sách không được để trống")
    @Size(max = 255, message = "Tên chính sách không được quá 255 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Trọng số tuổi đời không được để trống")
    @Min(0) @Max(100)
    private Integer weightAge = 30;

    @NotNull(message = "Trọng số bảo hành không được để trống")
    @Min(0) @Max(100)
    private Integer weightWarranty = 20;

    @NotNull(message = "Trọng số sự cố không được để trống")
    @Min(0) @Max(100)
    private Integer weightIncident = 30;

    @NotNull(message = "Trọng số tình trạng không được để trống")
    @Min(0) @Max(100)
    private Integer weightCondition = 20;

    private Boolean isDefault = false;

    public ScoringPolicyRequest() {
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
}
