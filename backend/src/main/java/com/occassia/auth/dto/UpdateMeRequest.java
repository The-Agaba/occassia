package com.occassia.auth.dto;

import lombok.Data;

@Data
public class UpdateMeRequest {

    private String fullName;
    private String email;
    private String password;
}
