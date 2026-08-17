package com.occassia.dashboard;

import com.occassia.category.GuestCategory;
import com.occassia.category.GuestCategoryRepository;
import com.occassia.checkin.CheckInRepository;
import com.occassia.dashboard.dto.EventStatsResponse;
import com.occassia.event.Event;
import com.occassia.event.EventService;
import com.occassia.guest.Guest;
import com.occassia.guest.GuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final GuestRepository guestRepository;
    private final CheckInRepository checkInRepository;
    private final GuestCategoryRepository categoryRepository;
    private final EventService eventService;

    @Transactional(readOnly = true)
    public EventStatsResponse getStats(UUID eventId) {
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);

        long total = guestRepository.countByEventId(eventId);
        long checkedIn = checkInRepository.countByEventId(eventId);

        List<GuestCategory> categories = categoryRepository.findByEventIdOrderByPriorityLevelAsc(eventId);
        List<Guest> guests = guestRepository.findByEventIdOrderByFullNameAsc(eventId);

        List<EventStatsResponse.CategoryStat> byCategory = new ArrayList<>();
        for (GuestCategory cat : categories) {
            long catTotal = guests.stream().filter(g -> g.getCategory().getId().equals(cat.getId())).count();
            long catCheckedIn = guests.stream()
                    .filter(g -> g.getCategory().getId().equals(cat.getId()))
                    .filter(g -> checkInRepository.findByGuestId(g.getId()).isPresent())
                    .count();
            byCategory.add(EventStatsResponse.CategoryStat.builder()
                    .name(cat.getName())
                    .colorHex(cat.getColorHex())
                    .total(catTotal)
                    .checkedIn(catCheckedIn)
                    .build());
        }

        return EventStatsResponse.builder()
                .totalGuests(total)
                .checkedIn(checkedIn)
                .remaining(total - checkedIn)
                .byCategory(byCategory)
                .build();
    }
}
