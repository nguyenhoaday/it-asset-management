package com.nguyenhoa.itam.common.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class ErrorResponse {
    private boolean success;
    private ErrorDetail error;
    private LocalDateTime timestamp;

    public static class ErrorDetail {
        private String code;
        private String message;
        private Map<String, String> details; // Lưu chi tiết validate nếu có

        public ErrorDetail(String code, String message) {
            this.code = code;
            this.message = message;
        }

        // Constructor cho lỗi Validation (có map các trường lỗi nhập liệu)
        public ErrorDetail(String code, String message, Map<String, String> details) {
            this.code = code;
            this.message = message;
            this.details = details;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public Map<String, String> getDetails() {
            return details;
        }

        public void setDetails(Map<String, String> details) {
            this.details = details;
        }
    }

    // Constructor cho lỗi chung (Hệ thống, Không tìm thấy...)
    public ErrorResponse(String code, String message) {
        this.success = false;
        this.error = new ErrorDetail(code, message);
        this.timestamp = LocalDateTime.now();
    }

    // Constructor cho lỗi Validation (Nhập liệu sai nhiều trường)
    public ErrorResponse(String code, String message, Map<String, String> details) {
        this.success = false;
        this.error = new ErrorDetail(code, message, details);
        this.timestamp = LocalDateTime.now();
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public ErrorDetail getError() {
        return error;
    }

    public void setError(ErrorDetail error) {
        this.error = error;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}