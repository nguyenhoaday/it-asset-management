package com.nguyenhoa.itam.notification.infrastructure.web;

import com.nguyenhoa.itam.notification.application.service.NotificationScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/test-mail")
public class TestMailController {

    private final NotificationScheduler scheduler;

    public TestMailController(NotificationScheduler scheduler) {
        this.scheduler = scheduler;
    }

    @PostMapping("/trigger-warranty")
    public ResponseEntity<String> triggerWarranty() {
        scheduler.checkWarrantyExpiry();
        return ResponseEntity.ok("Đã kích hoạt quét bảo hành");
    }

    @PostMapping("/trigger-inventory")
    public ResponseEntity<String> triggerInventory() {
        scheduler.checkActiveInventorySessions();
        return ResponseEntity.ok("Đã kích hoạt nhắc nhở kiểm kê");
    }
}
