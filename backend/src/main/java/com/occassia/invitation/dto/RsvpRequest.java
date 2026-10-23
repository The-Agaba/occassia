package com.occassia.invitation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RsvpRequest {
    @NotBlank
    private String status;
    private int headcount = 1;
    private String dietary;
    private String message;
    private String phoneConfirm;
    /** Phone the guest used to unlock the invitation; must match the recipient on file. */
    private String verifyPhone;
}
