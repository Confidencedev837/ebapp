// src/utils/timeFormat.ts
// Standard 12-hour time formatter with AM/PM for consistent display across the app

/**
 * Formats a 24-hour time string (e.g. '08:00', '14:30', '14:30:00')
 * into standard 12-hour format with AM / PM (e.g. '8:00 AM', '2:30 PM').
 */
export const formatTime12Hour = (timeStr: string | null | undefined): string => {
    if (!timeStr) return '';

    const cleaned = timeStr.trim();
    // If it already has AM/PM, normalize casing and return
    if (/am|pm/i.test(cleaned)) {
        return cleaned.toUpperCase();
    }

    const parts = cleaned.split(':');
    if (parts.length < 2) return cleaned;

    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);

    if (isNaN(hours)) return cleaned;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 -> 12

    return `${hours}:${minutes} ${ampm}`;
};

/**
 * Formats a date string (e.g. '2026-08-18') into a friendly short date (e.g. 'Tue, 18 Aug')
 */
export const formatFriendlyDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-NG', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    } catch {
        return dateStr;
    }
};

/**
 * Combines date + time into full 12-hour appointment string: 'Tue, 18 Aug · 2:30 PM'
 */
export const formatAppointmentDateTime = (
    dateStr: string | null | undefined,
    timeStr: string | null | undefined
): string => {
    const formattedDate = formatFriendlyDate(dateStr);
    const formattedTime = formatTime12Hour(timeStr);
    if (formattedDate && formattedTime) return `${formattedDate} · ${formattedTime}`;
    return formattedDate || formattedTime || '';
};
