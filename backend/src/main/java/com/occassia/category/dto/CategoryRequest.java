package com.occassia.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank
    private String name;

    @NotNull
    private Integer priorityLevel;

    @NotBlank
    private String colorHex;
}
