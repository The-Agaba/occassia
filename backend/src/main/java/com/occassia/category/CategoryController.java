package com.occassia.category;

import com.occassia.category.dto.CategoryRequest;
import com.occassia.category.dto.CategoryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping("/api/v1/events/{eventId}/categories")
    public CategoryResponse create(@PathVariable UUID eventId, @Valid @RequestBody CategoryRequest request) {
        return categoryService.create(eventId, request);
    }

    @GetMapping("/api/v1/events/{eventId}/categories")
    public List<CategoryResponse> list(@PathVariable UUID eventId) {
        return categoryService.list(eventId);
    }
}
