package com.nguyenhoa.itam.allocation.domain;

public enum ActionType {
    ASSIGN, // cấp phát mới từ kho cho nhân viên
    RETURN, // thu hồi từ nhân viên về kho
    TRANSFER // điều chuyển trực tếp giữa các nhân viên
}
