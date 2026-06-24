package com.nguyenhoa.itam.notification.application.service;

import com.nguyenhoa.itam.asset.application.dto.AssetDto;
import com.nguyenhoa.itam.asset.application.service.AssetService;
import com.nguyenhoa.itam.iam.application.service.UserService;
import com.nguyenhoa.itam.inventory.application.service.InventoryService;
import com.nguyenhoa.itam.notification.application.dto.EmailMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class NotificationScheduler {
    private final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final EmailMessageProducer emailMessageProducer;
    private final AssetService assetService;
    private final UserService userService;
    private final InventoryService inventoryService;

    public NotificationScheduler(EmailMessageProducer emailMessageProducer, AssetService assetService, UserService userService, InventoryService inventoryService) {
        this.emailMessageProducer = emailMessageProducer;
        this.assetService = assetService;
        this.userService = userService;
        this.inventoryService = inventoryService;
    }

    // Quét định kỳ hàng ngày lúc 8:00 sáng để cảnh báo thiết bị sắp hết bảo hành
    @Scheduled(cron = "0 0 8 * * *")
    public void checkWarrantyExpiry() {
        log.info("Bắt đầu quét lập lịch cảnh báo bảo hành thiết bị");

        LocalDate today = LocalDate.now();
        LocalDate limitDate = today.plusDays(30);

        List<AssetDto> expiringAssets = assetService.getAssetExpiringWarranty(today, limitDate);
        if (expiringAssets.isEmpty()) {
            log.info("Không có thiết bị nào sắp hết hạn bảo hành trong 30 ngày tới.");
            return;
        }

        // Lấy danh sách email phòng IT qua UserService
        List<String> itStaffEmails = userService.getITStaffEmail();

        if (itStaffEmails.isEmpty()) {
            log.warn("Không tìm thấy địa chỉ email nào của nhân viên IT để gửi cảnh báo");
            return;
        }

        // Tạo email cảnh báo cho từng thiết bị và đẩy vào queue
        for (AssetDto asset : expiringAssets) {
            String subject = "CẢNH BÁO: Thiết bị [" + asset.getAssetCode() + "] sắp hết hạn bảo hành";
            String body = String.format(
                    "<h3>Cảnh báo bảo hành tài sản</h3>" +
                            "<p>Thiết bị: <b>%s</b> (Mã: %s)</p>" +
                            "<p>Ngày hết hạn bảo hành: <b style='color: red;'>%s</b></p>" +
                            "<p>Vui lòng kiểm tra trạng thái thiết bị và thực hiện gia hạn bảo hành hoặc bảo trì nếu cần thiết.</p>",
                    asset.getName(),
                    asset.getAssetCode(),
                    asset.getWarrantyExpiry()
            );

            for (String email : itStaffEmails) {
                EmailMessage emailMessage = new EmailMessage(email, "IT Staff Member",
                        subject, body,
                        "WARRANTY_EXPIRY", "Asset", asset.getId());
                emailMessageProducer.queueEmail(emailMessage);
            }
        }

        log.info("Đã lập lịch thành công {} email cảnh báo bảo hành", expiringAssets.size() * itStaffEmails.size());
    }

    // Quét định kỳ sáng thứ Hai lúc 8:00 sáng để nhắc nhở đợt kiểm kê đang hoạt động
    @Scheduled(cron = "0 0 8 * * MON")
    public void checkActiveInventorySessions() {
        log.info("Bắt đầu quét lập lịch nhắc nhở đợt kiểm kê");

        if (!inventoryService.hasActiveSessions()) {
            log.info("Không có đợt kiểm kê nào đang hoạt động");
            return;
        }

        List<String> itStaffEmails = userService.getITStaffEmail();
        if (itStaffEmails.isEmpty()) {
            log.warn("Không tìm thấy địa chỉ email nào của nhân viên IT để nhắc kiểm kê");
            return;
        }

        String subject = "NHẮC NHỞ: Có đợt kiểm kê tài sản đang hoạt động";
        String body = "<h3>Nhắc nhở kiểm kê tài sản định kỳ</h3>" +
                "<p>Hệ thống hiện đang ghi nhận một đợt kiểm kê tài sản đang hoạt động (ACTIVE).</p>" +
                "<p>Vui lòng truy cập hệ thống ITAM, quét mã QR các thiết bị để ghi nhận trạng thái kiểm định kho.</p>";

        for (String email : itStaffEmails) {
            EmailMessage emailMessage = new EmailMessage(email, "IT Staff Member",
                    subject, body, "INVENTORY_REMINDER",
                    "InventorySession", null);
            emailMessageProducer.queueEmail(emailMessage);
        }

        log.info("Đã lập lịch nhắc nhở kiểm kê gửi tới {} nhân viên IT.", itStaffEmails.size());
    }
}
