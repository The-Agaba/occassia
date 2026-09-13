package com.occassia.checkin;

import com.occassia.checkin.dto.CheckInResponse;
import com.occassia.checkin.dto.NfcCheckInRequest;
import com.occassia.checkin.dto.QrCheckInRequest;
import com.occassia.dashboard.StatsService;
import com.occassia.dashboard.dto.EventStatsResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Check-in", description = "NFC check-in with QR backup - IoT gate device contract")
public class CheckInController {

    private final CheckInService checkInService;
    private final StatsService statsService;
    private final ReportService reportService;

    @PostMapping("/api/v1/checkin/nfc")
    public CheckInResponse nfc(@Valid @RequestBody NfcCheckInRequest request) {
        return checkInService.checkInByNfc(request.getNfcUid(), request.getGateId());
    }

    @PostMapping("/api/v1/checkin/qr")
    public CheckInResponse qr(@Valid @RequestBody QrCheckInRequest request) {
        return checkInService.checkInByQr(request.getQrToken(), request.getGateId());
    }

    @PatchMapping("/api/v1/checkin/{id}/print")
    public Map<String, String> print(@PathVariable UUID id) {
        checkInService.markTicketPrinted(id);
        return Map.of("message", "Ticket marked as printed");
    }

    @GetMapping("/api/v1/events/{eventId}/checkins")
    public List<CheckInResponse> listCheckIns(@PathVariable UUID eventId) {
        return checkInService.listForEvent(eventId);
    }

    @GetMapping("/api/v1/events/{eventId}/stats")
    public EventStatsResponse stats(@PathVariable UUID eventId) {
        return statsService.getStats(eventId);
    }

    @GetMapping("/api/v1/events/{eventId}/reports/summary")
    public EventStatsResponse summary(@PathVariable UUID eventId) {
        return statsService.getStats(eventId);
    }

    @GetMapping("/api/v1/events/{eventId}/reports/export")
    public ResponseEntity<byte[]> export(@PathVariable UUID eventId) {
        String csv = reportService.exportCsv(eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance-" + eventId + ".csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv.getBytes(StandardCharsets.UTF_8));
    }
}
