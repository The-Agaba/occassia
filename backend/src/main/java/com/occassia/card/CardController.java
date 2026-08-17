package com.occassia.card;

import com.occassia.card.dto.CardRegisterRequest;
import com.occassia.card.dto.CardResponse;
import com.occassia.shared.enums.CardStatus;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "NFC Cards", description = "Org-level NFC card registration, batch import, and status management")
public class CardController {

    private final CardService cardService;

    @PostMapping("/cards")
    public CardResponse register(@Valid @RequestBody CardRegisterRequest request) {
        return cardService.register(request);
    }

    @PostMapping("/cards/batch")
    public Map<String, Object> batchRegister(@RequestParam("file") MultipartFile file) {
        return cardService.batchRegister(file);
    }

    @GetMapping("/cards")
    public List<CardResponse> list(@RequestParam(required = false) CardStatus status) {
        return cardService.list(status);
    }

    @GetMapping("/cards/{uid}")
    public CardResponse get(@PathVariable String uid) {
        return cardService.get(uid);
    }

    @PatchMapping("/cards/{uid}/status")
    public CardResponse updateStatus(@PathVariable String uid, @RequestBody Map<String, CardStatus> body) {
        return cardService.updateStatus(uid, body.get("status"));
    }

    @PatchMapping("/guests/{guestId}/assign-card")
    public Map<String, String> assignCard(@PathVariable UUID guestId, @RequestBody Map<String, String> body) {
        cardService.assignToGuest(guestId, body.get("nfcUid"));
        return Map.of("message", "Card assigned");
    }

    @PatchMapping("/guests/{guestId}/unassign-card")
    public Map<String, String> unassignCard(@PathVariable UUID guestId) {
        cardService.unassignFromGuest(guestId);
        return Map.of("message", "Card unassigned");
    }
}
