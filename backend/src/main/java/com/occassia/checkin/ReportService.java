package com.occassia.checkin;

import com.occassia.event.Event;
import com.occassia.event.EventService;
import com.occassia.guest.Guest;
import com.occassia.guest.GuestRepository;
import com.occassia.shared.enums.UserRole;
import com.occassia.shared.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final GuestRepository guestRepository;
    private final CheckInRepository checkInRepository;
    private final EventService eventService;

    @Transactional(readOnly = true)
    public String exportCsv(UUID eventId) {
        SecurityUtils.requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EVENT_MANAGER, UserRole.VIEWER);
        Event event = eventService.findOrThrow(eventId);
        eventService.verifyEventAccess(event);

        StringBuilder sb = new StringBuilder();
        sb.append("full_name,category,attendance_type,confirmed,paid,checked_in,table_number,meal_preference\n");

        for (Guest guest : guestRepository.findByEventIdOrderByFullNameAsc(eventId)) {
            boolean checkedIn = checkInRepository.findByGuestId(guest.getId()).isPresent();
            sb.append(csv(guest.getFullName())).append(',')
                    .append(csv(guest.getCategory().getName())).append(',')
                    .append(guest.getAttendanceType()).append(',')
                    .append(guest.isConfirmed()).append(',')
                    .append(guest.isPaid()).append(',')
                    .append(checkedIn).append(',')
                    .append(guest.getTableNumber() != null ? guest.getTableNumber() : "").append(',')
                    .append(csv(guest.getMealPreference() != null ? guest.getMealPreference() : ""))
                    .append('\n');
        }
        return sb.toString();
    }

    private String csv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
