package com.nguyenhoa.itam.inventory.application.dto;

import jakarta.validation.constraints.NotBlank;

public class InventorySessionRequest {
    @NotBlank(message = "Tiêu đề đợt kiểm kê không được để trống")
    private String title;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
