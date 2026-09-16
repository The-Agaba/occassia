package com.occassia.guest;

import com.occassia.category.GuestCategoryRepository;
import com.occassia.event.Event;
import com.occassia.event.EventService;
import com.occassia.guest.dto.GuestRequest;
import com.occassia.shared.enums.AttendanceType;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GuestImportService {

    private final GuestRepository guestRepository;
    private final GuestCategoryRepository categoryRepository;
    private final EventService eventService;

    public Map<String, Object> importGuests(UUID eventId, MultipartFile file) {
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);

        // importGuests should only be invoked by ADMIN or EVENT_MANAGER; controller enforces this.

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        List<String[]> rows;
        try {
            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                rows = parseExcel(file);
            } else {
                throw new IllegalArgumentException("Only Excel workbooks (.xlsx or .xls) are supported");
            }
        } catch (Exception e) {
            throw new com.occassia.shared.exception.ApiException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "PARSE_ERROR", "Failed to parse file: " + e.getMessage());
        }

        if (rows.isEmpty()) {
            return Map.of("total", 0, "imported", 0, "failed", 0, "errors", List.of());
        }

        String[] header = rows.get(0);
        Map<String, Integer> colIndex = new HashMap<>();
        for (int i = 0; i < header.length; i++) {
            colIndex.put(header[i].trim().toLowerCase(), i);
        }

        List<Map<String, Object>> errors = new ArrayList<>();
        int imported = 0;

        for (int r = 1; r < rows.size(); r++) {
            String[] row = rows.get(r);
            if (row.length == 0 || (row.length == 1 && row[0].isBlank())) continue;

            try {
                String fullName = getCol(row, colIndex, "full_name");
                String attendanceStr = getCol(row, colIndex, "attendance_type");
                String categoryName = getCol(row, colIndex, "category_name");

                if (fullName == null || fullName.isBlank()) {
                    errors.add(error(r + 1, "full_name is required"));
                    continue;
                }
                if (attendanceStr == null || attendanceStr.isBlank()) {
                    errors.add(error(r + 1, "attendance_type is required"));
                    continue;
                }
                if (categoryName == null || categoryName.isBlank()) {
                    errors.add(error(r + 1, "category_name is required"));
                    continue;
                }

                AttendanceType attendanceType;
                try {
                    attendanceType = AttendanceType.valueOf(attendanceStr.trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    errors.add(error(r + 1, "Invalid attendance_type: " + attendanceStr));
                    continue;
                }

                var category = categoryRepository.findByEventIdAndNameIgnoreCase(eventId, categoryName.trim())
                        .orElse(null);
                if (category == null) {
                    errors.add(error(r + 1, "Category not found: " + categoryName));
                    continue;
                }

                Integer tableNumber = null;
                String tableStr = getCol(row, colIndex, "table_number");
                if (tableStr != null && !tableStr.isBlank()) {
                    tableNumber = Integer.parseInt(tableStr.trim());
                }

                Guest guest = Guest.builder()
                        .event(event)
                        .category(category)
                        .fullName(fullName.trim())
                        .phoneNumber(getCol(row, colIndex, "phone_number"))
                        .attendanceType(attendanceType)
                        .tableNumber(tableNumber)
                        .mealPreference(getCol(row, colIndex, "meal_preference"))
                        .notes(getCol(row, colIndex, "notes"))
                        .confirmed(false)
                        .paid(false)
                        .build();
                guestRepository.save(guest);
                imported++;
            } catch (Exception e) {
                errors.add(error(r + 1, e.getMessage()));
            }
        }

        int total = rows.size() - 1;
        return Map.of(
                "total", total,
                "imported", imported,
                "failed", total - imported,
                "errors", errors
        );
    }

    private List<String[]> parseExcel(MultipartFile file) throws Exception {
        byte[] bytes = file.getBytes();
        try {
            return parseWorkbook(bytes);
        } catch (Exception workbookError) {
            return parseHtmlWorkbook(new String(bytes, StandardCharsets.UTF_8));
        }
    }

    private List<String[]> parseWorkbook(byte[] bytes) throws Exception {
        List<String[]> rows = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            for (Row row : sheet) {
                List<String> cells = new ArrayList<>();
                for (Cell cell : row) {
                    cells.add(getCellValue(cell));
                }
                rows.add(cells.toArray(new String[0]));
            }
        }
        return rows;
    }

    private List<String[]> parseHtmlWorkbook(String html) {
        List<String[]> rows = new ArrayList<>();
        Matcher rowMatcher = Pattern.compile("(?is)<tr[^>]*>(.*?)</tr>").matcher(html);
        while (rowMatcher.find()) {
            List<String> cells = new ArrayList<>();
            Matcher cellMatcher = Pattern.compile("(?is)<t[dh][^>]*>(.*?)</t[dh]>").matcher(rowMatcher.group(1));
            while (cellMatcher.find()) {
                cells.add(cellMatcher.group(1).replaceAll("(?is)<[^>]+>", "").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").trim());
            }
            if (!cells.isEmpty()) rows.add(cells.toArray(new String[0]));
        }
        if (rows.isEmpty()) throw new IllegalArgumentException("The Excel workbook could not be read");
        return rows;
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((int) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private String getCol(String[] row, Map<String, Integer> colIndex, String name) {
        Integer idx = colIndex.get(name);
        if (idx == null || idx >= row.length) return null;
        return row[idx];
    }

    private Map<String, Object> error(int row, String reason) {
        return Map.of("row", row, "reason", reason);
    }
}
