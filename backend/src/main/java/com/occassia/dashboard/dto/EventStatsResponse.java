package com.occassia.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class EventStatsResponse {
    private long totalGuests;
    private long checkedIn;
    private long remaining;
    private List<CategoryStat> byCategory;

    @Data
    @Builder
    public static class CategoryStat {
        private String name;
        private String colorHex;
        private long total;
        private long checkedIn;
    }
}
