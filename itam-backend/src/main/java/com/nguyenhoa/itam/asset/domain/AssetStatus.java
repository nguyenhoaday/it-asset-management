package com.nguyenhoa.itam.asset.domain;

public enum AssetStatus {
    AVAILABLE, // Có sẵn trong kho để cấp phát
    ASSIGNED, // Đã bàn giao cho nhân viên sử dụng
    MAINTENANCE, // Đang sửa chữa, bảo hành
    LOST, // Thiết bị bị thất lạc
    BROKEN, // Thiết bị hư hỏng hoàn toàn (chờ thanh lý)
    PENDING_CONFIRMATION, // Đã được cấp phát/điều chuyển và đang chờ nhân viên xác nhận
    RETIRED // Ngừng hoạt động, đã thanh lý
}
