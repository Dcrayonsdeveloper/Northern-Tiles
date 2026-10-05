/**
 * Dates shown in the business's own timezone, always.
 *
 * Timestamps are stored in UTC — config/app.php keeps the app on UTC and the
 * server clock is UTC — which is the right way round: one unambiguous instant
 * per row, no daylight-saving gaps, and no guessing what an offsetless value
 * meant. Changing APP_TIMEZONE would start writing local times into a table
 * full of UTC ones with nothing to tell them apart.
 *
 * So the conversion belongs here, at the point of display.
 *
 * Bare toLocaleDateString() was the problem it replaces: with no timeZone it
 * renders in whoever is *looking*, so the same order read as 5 Oct in
 * Melbourne and 4 Oct for anyone working from a different country. A shipping
 * cut-off or an order date has to mean one thing.
 */
export const BUSINESS_TIMEZONE = 'Australia/Melbourne';

const LOCALE = 'en-AU';

function toDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** 5 Oct 2026 */
export function formatDate(value, fallback = '—') {
    const date = toDate(value);
    if (!date) return fallback;

    return date.toLocaleDateString(LOCALE, {
        timeZone: BUSINESS_TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** 5 Oct 2026, 6:55 pm */
export function formatDateTime(value, fallback = '—') {
    const date = toDate(value);
    if (!date) return fallback;

    return date.toLocaleString(LOCALE, {
        timeZone: BUSINESS_TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
