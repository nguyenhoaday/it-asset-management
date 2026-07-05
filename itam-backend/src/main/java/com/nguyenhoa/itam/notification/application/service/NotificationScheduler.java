package com.nguyenhoa.itam.notification.application.service;

import com.nguyenhoa.itam.asset.application.dto.AssetDto;
import com.nguyenhoa.itam.asset.application.service.AssetService;
import com.nguyenhoa.itam.iam.application.service.UserService;
import com.nguyenhoa.itam.inventory.application.service.InventoryService;
import com.nguyenhoa.itam.notification.application.dto.EmailMessage;
import com.nguyenhoa.itam.notification.domain.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class NotificationScheduler {
    private final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final EmailMessageProducer emailMessageProducer;
    private final AssetService assetService;
    private final UserService userService;
    private final InventoryService inventoryService;
    private final NotificationRepository notificationRepository;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public NotificationScheduler(EmailMessageProducer emailMessageProducer, AssetService assetService, UserService userService, InventoryService inventoryService, NotificationRepository notificationRepository) {
        this.emailMessageProducer = emailMessageProducer;
        this.assetService = assetService;
        this.userService = userService;
        this.inventoryService = inventoryService;
        this.notificationRepository = notificationRepository;
    }

    // Quét định kỳ hàng ngày lúc 8:00 sáng để cảnh báo thiết bị sắp hết bảo hành
    @Scheduled(cron = "0 0 8 * * *")
    public void checkWarrantyExpiry() {
        log.info("Bắt đầu quét lập lịch cảnh báo bảo hành thiết bị");

        LocalDate today = LocalDate.now();
        LocalDate limitDate = today.plusDays(30);

        List<AssetDto> expiringAssets = assetService.getAssetExpiringWarranty(today, limitDate);
        if (expiringAssets.isEmpty()) {
            return;
        }

        List<String> itStaffEmails = userService.getITStaffEmail();
        if (itStaffEmails.isEmpty()) {
            log.warn("Không tìm thấy địa chỉ email nào của nhân viên IT để gửi cảnh báo");
            return;
        }

        // Tạo bảng tóm tắt (top 15 thiết bị)
        StringBuilder assetRows = new StringBuilder();
        int count = 0;
        for (AssetDto asset : expiringAssets) {
            if (count++ >= 15) break;
            assetRows.append(String.format(
                    "<tr>" +
                    "<td style='padding: 10px; border-bottom: 1px solid #eee;'><b>%s</b></td>" +
                    "<td style='padding: 10px; border-bottom: 1px solid #eee;'>%s</td>" +
                    "<td style='padding: 10px; border-bottom: 1px solid #eee; color: #dc2626; font-weight: bold;'>%s</td>" +
                    "</tr>",
                    asset.getAssetCode(), asset.getName(), asset.getWarrantyExpiry()
            ));
        }

        String moreText = expiringAssets.size() > 15 
                ? String.format("<p style='color: #64748b; font-style: italic; font-size: 13px;'>... và %d thiết bị khác / and %d other devices</p>", expiringAssets.size() - 15, expiringAssets.size() - 15)
                : "";

        String subject = String.format("[ITAM] Cảnh báo %d tài sản sắp hết hạn bảo hành | Warranty Expiry Alert", expiringAssets.size());
        String body = String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #333; line-height: 1.6;'>" +
                "<h2 style='color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 8px;'>Cảnh báo Bảo hành / Warranty Alert</h2>" +
                "<p><b>[VI]</b> Hệ thống ghi nhận có <b style='color: #dc2626;'>%d thiết bị</b> sắp hết hạn bảo hành trong 30 ngày tới.<br/>" +
                "<b>[EN]</b> System detected <b style='color: #dc2626;'>%d devices</b> expiring warranty in the next 30 days.</p>" +
                "<table style='width: 100%%; border-collapse: collapse; margin: 20px 0; font-size: 14px;'>" +
                "<tr style='background-color: #f8fafc; text-align: left; color: #475569;'>" +
                "<th style='padding: 10px; border-bottom: 2px solid #cbd5e1;'>Mã tài sản / Asset Code</th>" +
                "<th style='padding: 10px; border-bottom: 2px solid #cbd5e1;'>Tên thiết bị / Asset Name</th>" +
                "<th style='padding: 10px; border-bottom: 2px solid #cbd5e1;'>Hạn bảo hành / Expiry Date</th>" +
                "</tr>%s</table>%s" +
                "<div style='margin: 32px 0; text-align: center;'>" +
                "<a href='%s/assets?export=true' style='background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>📊 Xuất Báo Cáo Excel / Export Full Excel</a>" +
                "</div>" +
                "<hr style='border: none; border-top: 1px solid #e2e8f0; margin-top: 32px;'/>" +
                "<p style='font-size: 12px; color: #94a3b8; text-align: center;'>IT Asset Management System (ITAM) • Automated Notification</p>" +
                "</div>",
                expiringAssets.size(), expiringAssets.size(),
                assetRows.toString(), moreText, frontendUrl
        );

        for (String email : itStaffEmails) {
            EmailMessage emailMessage = new EmailMessage(email, "IT Staff Member",
                    subject, body,
                    "WARRANTY_EXPIRY_SUMMARY", "AssetList", null);
            emailMessageProducer.queueEmail(emailMessage);
        }

        log.info("Đã gửi email {} tài sản hết bảo hành tới {} nhân viên IT", expiringAssets.size(), itStaffEmails.size());
    }

    // Quét định kỳ sáng thứ Hai lúc 8:00 sáng để nhắc nhở đợt kiểm kê đang hoạt động
    @Scheduled(cron = "0 0 8 * * MON")
    public void checkActiveInventorySessions() {
        if (!inventoryService.hasActiveSessions()) {
            return;
        }

        List<String> itStaffEmails = userService.getITStaffEmail();
        if (itStaffEmails.isEmpty()) {
            return;
        }

        String subject = "[ITAM] Nhắc nhở: Có đợt kiểm kê tài sản đang hoạt động | Active Inventory Reminder";
        String body = String.format(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;'>" +
                "<h2 style='color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 8px;'>Kiểm kê Định kỳ / Inventory Reminder</h2>" +
                "<p><b>[VI]</b> Hệ thống hiện đang ghi nhận một đợt kiểm kê tài sản đang hoạt động (ACTIVE). Vui lòng quét mã QR để đối chiếu.<br/>" +
                "<b>[EN]</b> An active inventory session requires your attention. Please scan asset QR codes to record inventory status.</p>" +
                "<div style='margin: 28px 0; text-align: center;'>" +
                "<a href='%s/inventory' style='background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>Vào trang Kiểm kê / Go to Inventory</a>" +
                "</div>" +
                "<hr style='border: none; border-top: 1px solid #e2e8f0; margin-top: 28px;'/>" +
                "<p style='font-size: 12px; color: #94a3b8; text-align: center;'>IT Asset Management System (ITAM)</p>" +
                "</div>",
                frontendUrl
        );

        for (String email : itStaffEmails) {
            EmailMessage emailMessage = new EmailMessage(email, "IT Staff Member",
                    subject, body, "INVENTORY_REMINDER",
                    "InventorySession", null);
            emailMessageProducer.queueEmail(emailMessage);
        }

        log.info("Đã gửi email nhắc kiểm kê tới {} nhân viên IT", itStaffEmails.size());
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldNotifications() {
        Instant ninetyDaysAgo = Instant.now().minus(90, ChronoUnit.DAYS);
        long deletedCount = notificationRepository.deleteBySentAtBefore(ninetyDaysAgo);
        log.info("Clean up old notifications - {} notifications deleted", deletedCount);
    }
}
