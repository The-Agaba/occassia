import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const statusColors: Record<string, string> = {
  DRAFT: 'bg-[#f3f0eb] text-[#6b7280]',
  ACTIVE: 'bg-[#e8f5ee] text-[#2d6a4f]',
  CLOSED: 'bg-[#fef3e2] text-[#b45309]',
  ARCHIVED: 'bg-[#f3f0eb] text-[#9ca3af]',
};

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Format a time string like "14:30:00" → "2:30 PM" */
export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  // time may be "HH:mm" or "HH:mm:ss"
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Format an event date range for display.
 * - Same day: "Aug 15, 2026"  (with optional "2:00 PM - 6:00 PM")
 * - Different days: "Aug 15 - Aug 17, 2026"
 */
export function formatEventDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  startTime?: string | null,
  endTime?: string | null
): string {
  if (!startDate) return '—';

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (isNaN(start.getTime())) return '—';

  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

  if (!end || isNaN(end.getTime()) || startDate === endDate) {
    // Same day (or no end)
    let result = start.toLocaleDateString('en-US', opts);
    if (startTime || endTime) {
      const times = [startTime && formatTime(startTime), endTime && formatTime(endTime)]
        .filter(Boolean)
        .join(' - ');
      if (times) result += `  ·  ${times}`;
    }
    return result;
  }

  // Different days
  const startFmt = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endFmt = end.toLocaleDateString('en-US', opts);
  return `${startFmt} - ${endFmt}`;
}
