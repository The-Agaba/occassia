package com.occassia.user.dto;

import com.occassia.shared.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserRequest {

    @NotBlank
    private String fullName;

    @NotBlank @Email
    private String email;

    private String password;

    @NotNull
    private UserRole role;
}
