package com.nguyenhoa.itam.maintenance.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CompleteMaintenanceRequest {
    @NotNull(message =  "Chi phí sửa chữa không được để trống")
    @DecimalMin(value = "0.0", message = "Chi phí sửa chữa phải lớn hơn hoặc bằng 0")
    private BigDecimal repairCost;

    @NotBlank(message = "Hành động khắc phục không được để trống")
    private String actionTaken;

    @NotNull(message = "Ngày kết thúc bảo trì không được để trống")
    private LocalDate endDate;

    public CompleteMaintenanceRequest(BigDecimal repairCost, String actionTaken, LocalDate endDate) {
        this.repairCost = repairCost;
        this.actionTaken = actionTaken;
        this.endDate = endDate;
    }

    public BigDecimal getRepairCost() {
        return repairCost;
    }

    public void setRepairCost(BigDecimal repairCost) {
        this.repairCost = repairCost;
    }

    public String getActionTaken() {
        return actionTaken;
    }

    public void setActionTaken(String actionTaken) {
        this.actionTaken = actionTaken;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}
