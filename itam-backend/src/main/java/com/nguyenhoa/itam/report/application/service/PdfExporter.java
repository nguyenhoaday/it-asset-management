package com.nguyenhoa.itam.report.application.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.nguyenhoa.itam.maintenance.application.dto.MaintenanceLogResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class PdfExporter {

    private static final DateTimeFormatter LOCAL_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private Font getVietnameseFont(int size, int style, java.awt.Color color) {
        try {
            // Windows Arial
            String winPath = "C:\\Windows\\Fonts\\arial.ttf";
            // Linux Alpine/Debian DejaVu / Liberation
            String linuxPath = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
            if (!new java.io.File(linuxPath).exists()) {
                linuxPath = "/usr/share/fonts/TTF/DejaVuSans.ttf";
            }
            
            String fontPath = null;
            if (new java.io.File(winPath).exists()) {
                fontPath = winPath;
            } else if (new java.io.File(linuxPath).exists()) {
                fontPath = linuxPath;
            }

            if (fontPath != null) {
                BaseFont bf = BaseFont.createFont(fontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                return new Font(bf, size, style, color);
            }
        } catch (Exception e) {
            System.err.println("Could not load custom TTF font, falling back to Helvetica: " + e.getMessage());
        }
        return new Font(Font.HELVETICA, size, style, color);
    }

    public void exportMaintenances(List<MaintenanceLogResponse> logs, Map<UUID, String> assetNames, String lang, OutputStream out) throws IOException {
        Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            boolean isEn = "en".equalsIgnoreCase(lang);

            // Font Styles
            Font titleFont = getVietnameseFont(18, Font.BOLD, java.awt.Color.BLACK);
            Font metaFont = getVietnameseFont(10, Font.ITALIC, java.awt.Color.GRAY);
            Font headerFont = getVietnameseFont(10, Font.BOLD, java.awt.Color.WHITE);
            Font bodyFont = getVietnameseFont(9, Font.NORMAL, java.awt.Color.BLACK);
            Font boldBodyFont = getVietnameseFont(9, Font.BOLD, java.awt.Color.BLACK);

            // Document Header
            String titleText = isEn ? "ASSET MAINTENANCE HISTORY REPORT" : "BÁO CÁO LỊCH SỬ BẢO TRÌ THIẾT BỊ";
            Paragraph title = new Paragraph(titleText, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);
            document.add(title);

            String dateLabel = isEn ? "Exported date: " : "Được xuất ngày: ";
            Paragraph subtitle = new Paragraph(dateLabel + java.time.LocalDate.now().format(LOCAL_DATE_FORMATTER), metaFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Line Separator
            LineSeparator ls = new LineSeparator();
            ls.setLineColor(new java.awt.Color(200, 200, 200));
            document.add(ls);
            document.add(new Paragraph(" ")); // spacer

            // Table
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.2f, 1.2f, 2.0f, 2.0f, 1.2f, 2.5f, 2.5f, 1.2f});
            table.setSpacingBefore(10);

            // Table headers
            String[] headers;
            if (isEn) {
                headers = new String[]{
                    "Start Date", "End Date", "Asset", "Provider", "Cost", "Issue Description", "Action Taken", "Status"
                };
            } else {
                headers = new String[]{
                    "Ngày bắt đầu", "Ngày kết thúc", "Thiết bị", "Đơn vị bảo trì", "Chi phí", "Mô tả sự cố", "Giải pháp xử lý", "Trạng thái"
                };
            }

            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(new java.awt.Color(79, 70, 229)); // Indigo Color
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                cell.setPadding(6);
                table.addCell(cell);
            }

            BigDecimal totalCost = BigDecimal.ZERO;

            // Table body
            for (MaintenanceLogResponse log : logs) {
                String startDate = log.getStartDate() != null ? log.getStartDate().format(LOCAL_DATE_FORMATTER) : "";
                String endDate = log.getEndDate() != null ? log.getEndDate().format(LOCAL_DATE_FORMATTER) : "-";
                String assetName = assetNames.getOrDefault(log.getAssetId(), log.getAssetId().toString());
                String provider = log.getProviderName() != null ? log.getProviderName() : "";
                String cost = log.getRepairCost() != null ? log.getRepairCost().toString() + " VND" : "0 VND";
                String issue = log.getIssueDescription() != null ? log.getIssueDescription() : "";
                String action = log.getActionTaken() != null ? log.getActionTaken() : "-";
                String status = log.getStatus() != null ? log.getStatus().name() : "";

                if (log.getRepairCost() != null) {
                    totalCost = totalCost.add(log.getRepairCost());
                }

                addCell(table, startDate, bodyFont, Element.ALIGN_CENTER);
                addCell(table, endDate, bodyFont, Element.ALIGN_CENTER);
                addCell(table, assetName, bodyFont, Element.ALIGN_LEFT);
                addCell(table, provider, bodyFont, Element.ALIGN_LEFT);
                addCell(table, cost, bodyFont, Element.ALIGN_RIGHT);
                addCell(table, issue, bodyFont, Element.ALIGN_LEFT);
                addCell(table, action, bodyFont, Element.ALIGN_LEFT);
                addCell(table, status, bodyFont, Element.ALIGN_CENTER);
            }

            document.add(table);

            // Total cost
            String sumText = isEn ? "\nAccumulated total maintenance cost: " : "\nTổng chi phí bảo trì tích lũy: ";
            Paragraph summary = new Paragraph(sumText + totalCost.toString() + " VND", boldBodyFont);
            summary.setAlignment(Element.ALIGN_RIGHT);
            summary.setSpacingBefore(15);
            document.add(summary);

            document.close();
        } catch (DocumentException e) {
            throw new IOException("OpenPDF DocumentException encountered: " + e.getMessage(), e);
        }
    }

    private void addCell(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5);
        table.addCell(cell);
    }
}
