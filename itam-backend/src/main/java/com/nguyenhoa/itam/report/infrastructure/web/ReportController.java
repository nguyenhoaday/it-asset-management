package com.nguyenhoa.itam.report.infrastructure.web;

import com.nguyenhoa.itam.allocation.application.dto.AllocationResponse;
import com.nguyenhoa.itam.allocation.application.service.AllocationService;
import com.nguyenhoa.itam.asset.application.dto.AssetResponse;
import com.nguyenhoa.itam.asset.application.service.AssetService;
import com.nguyenhoa.itam.iam.application.dto.UserProfileResponse;
import com.nguyenhoa.itam.iam.application.service.UserService;
import com.nguyenhoa.itam.inventory.application.dto.InventoryItemResponse;
import com.nguyenhoa.itam.inventory.application.dto.InventorySessionResponse;
import com.nguyenhoa.itam.inventory.application.service.InventoryService;
import com.nguyenhoa.itam.maintenance.application.dto.MaintenanceLogResponse;
import com.nguyenhoa.itam.maintenance.application.service.MaintenanceService;
import com.nguyenhoa.itam.report.application.service.ExcelExporter;
import com.nguyenhoa.itam.report.application.service.PdfExporter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'IT_STAFF')")
public class ReportController {

    private final AssetService assetService;
    private final AllocationService allocationService;
    private final MaintenanceService maintenanceService;
    private final InventoryService inventoryService;
    private final UserService userService;
    private final ExcelExporter excelExporter;
    private final PdfExporter pdfExporter;

    public ReportController(AssetService assetService, AllocationService allocationService,
                            MaintenanceService maintenanceService, InventoryService inventoryService,
                            UserService userService, ExcelExporter excelExporter, PdfExporter pdfExporter) {
        this.assetService = assetService;
        this.allocationService = allocationService;
        this.maintenanceService = maintenanceService;
        this.inventoryService = inventoryService;
        this.userService = userService;
        this.excelExporter = excelExporter;
        this.pdfExporter = pdfExporter;
    }

    @GetMapping("/assets")
    public ResponseEntity<byte[]> exportAssets(@RequestParam(value = "lang", defaultValue = "vi") String lang) throws IOException {
        List<AssetResponse> assets = assetService.getAllAssetsForReport();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        excelExporter.exportAssets(assets, lang, out);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reports_assets_" + LocalDate.now() + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(out.toByteArray());
    }

    @GetMapping("/allocations")
    public ResponseEntity<byte[]> exportAllocations(
            @RequestParam(value = "from", required = false) String fromStr,
            @RequestParam(value = "to", required = false) String toStr,
            @RequestParam(value = "lang", defaultValue = "vi") String lang) throws IOException {

        Instant from = parseInstant(fromStr, Instant.EPOCH);
        Instant to = parseInstant(toStr, Instant.now().plus(36500, java.time.temporal.ChronoUnit.DAYS));

        List<AllocationResponse> allocations = allocationService.getAllAllocationsForReport(from, to);

        // Fetch users map
        List<UUID> userIds = new ArrayList<>();
        for (AllocationResponse a : allocations) {
            if (a.getFromUserId() != null) userIds.add(a.getFromUserId());
            if (a.getToUserId() != null) userIds.add(a.getToUserId());
        }
        Map<UUID, String> userNames = getUserNamesMap(userIds);

        // Fetch assets map
        Map<UUID, String> assetNames = getAssetNamesMap();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        excelExporter.exportAllocations(allocations, userNames, assetNames, lang, out);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reports_allocations_" + LocalDate.now() + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(out.toByteArray());
    }

    @GetMapping("/maintenances")
    public ResponseEntity<byte[]> exportMaintenances(
            @RequestParam(value = "from", required = false) String fromStr,
            @RequestParam(value = "to", required = false) String toStr,
            @RequestParam(value = "lang", defaultValue = "vi") String lang) throws IOException {

        LocalDate from = parseLocalDate(fromStr, LocalDate.of(1970, 1, 1));
        LocalDate to = parseLocalDate(toStr, LocalDate.of(2099, 12, 31));

        List<MaintenanceLogResponse> logs = maintenanceService.getAllMaintenancesForReport(from, to);
        Map<UUID, String> assetNames = getAssetNamesMap();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        pdfExporter.exportMaintenances(logs, assetNames, lang, out);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reports_maintenances_" + LocalDate.now() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }

    @GetMapping("/inventory/{sessionId}")
    public ResponseEntity<byte[]> exportInventory(
            @PathVariable("sessionId") UUID sessionId,
            @RequestParam(value = "lang", defaultValue = "vi") String lang) throws IOException {
        InventorySessionResponse session = inventoryService.getSessionById(sessionId);
        List<InventoryItemResponse> items = inventoryService.getInventoryItemsForReport(sessionId);

        // Fetch users map
        List<UUID> userIds = items.stream()
                .map(InventoryItemResponse::getCheckedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        Map<UUID, String> userNames = getUserNamesMap(userIds);

        // Fetch assets map
        Map<UUID, String> assetNames = getAssetNamesMap();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        excelExporter.exportInventory(session, items, userNames, assetNames, lang, out);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"reports_inventory_" + sessionId + ".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(out.toByteArray());
    }

    private Instant parseInstant(String dateStr, Instant defaultVal) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return defaultVal;
        }
        try {
            return Instant.parse(dateStr);
        } catch (DateTimeParseException e) {
            try {
                LocalDate localDate = LocalDate.parse(dateStr);
                return localDate.atStartOfDay(ZoneOffset.UTC).toInstant();
            } catch (DateTimeParseException ex) {
                return defaultVal;
            }
        }
    }

    private LocalDate parseLocalDate(String dateStr, LocalDate defaultVal) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return defaultVal;
        }
        try {
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException e) {
            return defaultVal;
        }
    }

    private Map<UUID, String> getUserNamesMap(List<UUID> userIds) {
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<UUID, UserProfileResponse> profiles = userService.getUserProfilesMap(userIds);
        return profiles.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getFullName()));
    }

    private Map<UUID, String> getAssetNamesMap() {
        List<AssetResponse> assets = assetService.getAllAssetsForReport();
        return assets.stream()
                .collect(Collectors.toMap(AssetResponse::getId, a -> a.getAssetCode() + " - " + a.getName(), (existing, replacing) -> existing));
    }
}
