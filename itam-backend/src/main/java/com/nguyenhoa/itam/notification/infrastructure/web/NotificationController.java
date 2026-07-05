package com.nguyenhoa.itam.notification.infrastructure.web;

import com.nguyenhoa.itam.common.dto.ApiResponse;
import com.nguyenhoa.itam.iam.api.UserPrincipal;
import com.nguyenhoa.itam.notification.application.service.NotificationService;
import com.nguyenhoa.itam.notification.domain.Notification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        List<Notification> list = notificationService.getMyNotifications(userPrincipal.getEmail());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.ok(ApiResponse.success(0L));
        }
        long count = notificationService.getUnreadCount(userPrincipal.getEmail());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal != null) {
            notificationService.markAsRead(id, userPrincipal.getEmail());
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal != null) {
            notificationService.markAllAsRead(userPrincipal.getEmail());
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
