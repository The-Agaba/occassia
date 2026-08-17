package com.occassia.category;

import com.occassia.category.dto.CategoryRequest;
import com.occassia.category.dto.CategoryResponse;
import com.occassia.event.Event;
import com.occassia.event.EventService;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final GuestCategoryRepository categoryRepository;
    private final EventService eventService;

    @Transactional
    public CategoryResponse create(UUID eventId, CategoryRequest request) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.EVENT_MANAGER);
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);

        GuestCategory category = GuestCategory.builder()
                .event(event)
                .name(request.getName())
                .priorityLevel(request.getPriorityLevel())
                .colorHex(request.getColorHex())
                .build();
        category = categoryRepository.save(category);
        return toResponse(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(UUID eventId) {
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);
        return categoryRepository.findByEventIdOrderByPriorityLevelAsc(eventId).stream()
                .map(this::toResponse).toList();
    }

    public GuestCategory findOrThrow(UUID id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new com.occassia.shared.exception.ApiException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "NOT_FOUND", "Category not found"));
    }

    private CategoryResponse toResponse(GuestCategory c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .priorityLevel(c.getPriorityLevel())
                .colorHex(c.getColorHex())
                .build();
    }
}
