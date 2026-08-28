import { parseHijriIso, toHijri } from '@/lib/utils/hijri-date';

/**
 * Resolve a date string (from URL or default) to a Hijri ISO date.
 * Handles three cases:
 *  1. Already a valid Hijri ISO → return as-is
 *  2. A Gregorian YYYY-MM-DD string → convert to Hijri
 *  3. Null/undefined → today's Hijri date
 * @param {string|null|undefined} dateStr
 * @returns {string} Hijri ISO date (YYYY-MM-DD)
 */
export function resolveHijriDate(dateStr) {
  if (dateStr && parseHijriIso(dateStr)) {
    return dateStr;
  }
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const gregorian = new Date(`${dateStr}T12:00:00Z`);
    return toHijri(gregorian).iso;
  }
  return toHijri(new Date()).iso;
}
