package com.occassia.invitation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class BatchInviteRequest {
    private List<UUID> guestIds;
    @NotBlank
    private String channel;
    private String templateId;
    private String imageUrl;
    private Map<String, Object> letterDetails;
}
