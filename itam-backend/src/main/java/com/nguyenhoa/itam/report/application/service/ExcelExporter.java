package com.nguyenhoa.itam.report.application.service;

import com.nguyenhoa.itam.asset.application.dto.AssetResponse;
import com.nguyenhoa.itam.allocation.application.dto.AllocationResponse;
import com.nguyenhoa.itam.inventory.application.dto.InventorySessionResponse;
import com.nguyenhoa.itam.inventory.application.dto.InventoryItemResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class ExcelExporter {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.systemDefault());

    private static final DateTimeFormatter LOCAL_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Làm sạch chuỗi để tránh lỗi Excel
    private String sanitize(Object val) {
        if (val == null) return "";
        String str = val.toString();
        if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
            return "'" + str;
        }
        return str;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.INDIGO.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createAlternatingStyle(Workbook workbook, boolean alternate) {
        CellStyle style = workbook.createCellStyle();
        if (alternate) {
            style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        }
        return style;
    }

    public void exportAssets(List<AssetResponse> assets, String lang, OutputStream out) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            boolean isEn = "en".equalsIgnoreCase(lang);
            String sheetName = isEn ? "Assets" : "Tài sản";
            Sheet sheet = workbook.createSheet(sheetName);
            
            String[] headers;
            if (isEn) {
                headers = new String[]{
                    "Asset Code", "Asset Name", "Category", "Status", 
                    "Serial Number", "Purchase Date", "Purchase Cost", "Currency", "Warranty Expiry"
                };
            } else {
                headers = new String[]{
                    "Mã tài sản", "Tên tài sản", "Danh mục", "Trạng thái", 
                    "Số Serial", "Ngày mua", "Giá mua", "Đơn vị tiền tệ", "Hết hạn bảo hành"
                };
            }

            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = createHeaderStyle(workbook);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (AssetResponse asset : assets) {
                Row row = sheet.createRow(rowIdx++);
                CellStyle rowStyle = createAlternatingStyle(workbook, rowIdx % 2 == 0);
                
                Cell c0 = row.createCell(0); c0.setCellValue(sanitize(asset.getAssetCode())); c0.setCellStyle(rowStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(sanitize(asset.getName())); c1.setCellStyle(rowStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(sanitize(asset.getCategoryName())); c2.setCellStyle(rowStyle);
                Cell c3 = row.createCell(3); c3.setCellValue(sanitize(asset.getStatus())); c3.setCellStyle(rowStyle);
                Cell c4 = row.createCell(4); c4.setCellValue(sanitize(asset.getSerialNumber())); c4.setCellStyle(rowStyle);
                
                Cell c5 = row.createCell(5); 
                c5.setCellValue(asset.getPurchaseDate() != null ? LOCAL_DATE_FORMATTER.format(asset.getPurchaseDate()) : ""); 
                c5.setCellStyle(rowStyle);
                
                Cell c6 = row.createCell(6);
                c6.setCellValue(asset.getPurchaseCost() != null ? asset.getPurchaseCost().doubleValue() : 0.0);
                c6.setCellStyle(rowStyle);
                
                Cell c7 = row.createCell(7); c7.setCellValue(sanitize(asset.getCurrency())); c7.setCellStyle(rowStyle);
                
                Cell c8 = row.createCell(8);
                c8.setCellValue(asset.getWarrantyExpiry() != null ? LOCAL_DATE_FORMATTER.format(asset.getWarrantyExpiry()) : "");
                c8.setCellStyle(rowStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
        }
    }

    public void exportAllocations(List<AllocationResponse> allocations, Map<UUID, String> userNames, Map<UUID, String> assetNames, String lang, OutputStream out) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            boolean isEn = "en".equalsIgnoreCase(lang);
            String sheetName = isEn ? "Allocations - Returns" : "Cấp phát - Thu hồi";
            Sheet sheet = workbook.createSheet(sheetName);
            
            String[] headers;
            if (isEn) {
                headers = new String[]{
                    "Event Date", "Asset", "Action", "Handed Over By", "Received By", "Confirmation Status", "Notes"
                };
            } else {
                headers = new String[]{
                    "Ngày thực hiện", "Thiết bị", "Hành động", "Người bàn giao", "Người nhận", "Trạng thái xác nhận", "Ghi chú"
                };
            }

            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = createHeaderStyle(workbook);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (AllocationResponse alloc : allocations) {
                Row row = sheet.createRow(rowIdx++);
                CellStyle rowStyle = createAlternatingStyle(workbook, rowIdx % 2 == 0);

                String assetName = assetNames.getOrDefault(alloc.getAssetId(), "Unknown Asset (" + alloc.getAssetId() + ")");
                String fromUser = alloc.getFromUserId() != null ? userNames.getOrDefault(alloc.getFromUserId(), alloc.getFromUserId().toString()) : "";
                String toUser = alloc.getToUserId() != null ? userNames.getOrDefault(alloc.getToUserId(), alloc.getToUserId().toString()) : "";

                Cell c0 = row.createCell(0);
                c0.setCellValue(alloc.getEventTime() != null ? DATE_FORMATTER.format(alloc.getEventTime()) : "");
                c0.setCellStyle(rowStyle);
                
                Cell c1 = row.createCell(1); c1.setCellValue(sanitize(assetName)); c1.setCellStyle(rowStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(sanitize(alloc.getActionType())); c2.setCellStyle(rowStyle);
                Cell c3 = row.createCell(3); c3.setCellValue(sanitize(fromUser)); c3.setCellStyle(rowStyle);
                Cell c4 = row.createCell(4); c4.setCellValue(sanitize(toUser)); c4.setCellStyle(rowStyle);
                Cell c5 = row.createCell(5); c5.setCellValue(sanitize(alloc.getConfirmationStatus())); c5.setCellStyle(rowStyle);
                Cell c6 = row.createCell(6); c6.setCellValue(sanitize(alloc.getNotes())); c6.setCellStyle(rowStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
        }
    }

    public void exportInventory(InventorySessionResponse session, List<InventoryItemResponse> items, Map<UUID, String> userNames, Map<UUID, String> assetNames, String lang, OutputStream out) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            boolean isEn = "en".equalsIgnoreCase(lang);
            String sheetName = isEn ? "Inventory" : "Kiểm kê";
            Sheet sheet = workbook.createSheet(sheetName);

            // Header
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            String titleLabel = isEn ? "INVENTORY SESSION: " : "ĐỢT KIỂM KÊ: ";
            titleCell.setCellValue(titleLabel + sanitize(session.getTitle()));
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            Row infoRow = sheet.createRow(1);
            String statusLabel = isEn ? "Status: " : "Trạng thái: ";
            String dateLabel = isEn ? "Start Date: " : "Ngày bắt đầu: ";
            infoRow.createCell(0).setCellValue(statusLabel + session.getStatus());
            infoRow.createCell(1).setCellValue(dateLabel + (session.getCreatedAt() != null ? DATE_FORMATTER.format(session.getCreatedAt()) : ""));
            
            String[] headers;
            if (isEn) {
                headers = new String[]{
                    "Asset", "Scanned By", "Checked Status", "Scanned At", "Notes"
                };
            } else {
                headers = new String[]{
                    "Thiết bị", "Người quét", "Trạng thái kiểm kê", "Thời gian quét", "Ghi chú"
                };
            }

            Row headerRow = sheet.createRow(3);
            CellStyle headerStyle = createHeaderStyle(workbook);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 4;
            for (InventoryItemResponse item : items) {
                Row row = sheet.createRow(rowIdx++);
                CellStyle rowStyle = createAlternatingStyle(workbook, rowIdx % 2 == 0);

                String assetName = assetNames.getOrDefault(item.getAssetId(), "Unknown (" + item.getAssetId() + ")");
                String checkedBy = item.getCheckedBy() != null ? userNames.getOrDefault(item.getCheckedBy(), item.getCheckedBy().toString()) : "";

                Cell c0 = row.createCell(0); c0.setCellValue(sanitize(assetName)); c0.setCellStyle(rowStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(sanitize(checkedBy)); c1.setCellStyle(rowStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(sanitize(item.getCheckedStatus())); c2.setCellStyle(rowStyle);
                
                Cell c3 = row.createCell(3);
                c3.setCellValue(item.getCheckedAt() != null ? DATE_FORMATTER.format(item.getCheckedAt()) : "");
                c3.setCellStyle(rowStyle);
                
                Cell c4 = row.createCell(4); c4.setCellValue(sanitize(item.getNotes())); c4.setCellStyle(rowStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
        }
    }
}
