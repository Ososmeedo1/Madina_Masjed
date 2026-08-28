import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { addDays } from 'date-fns';

export const RIYADH_TZ = 'Asia/Riyadh';
export const DATE_FORMAT = 'yyyy-MM-dd';

export function riyadhNow() {
  return utcToZonedTime(new Date(), RIYADH_TZ);
}

export function riyadhDateStr(date = new Date()) {
  return formatInTimeZone(date, RIYADH_TZ, DATE_FORMAT);
}

export function riyadhTimeStr(date = new Date()) {
  return formatInTimeZone(date, RIYADH_TZ, 'HH:mm');
}

export function riyadhDateTimeStr(date = new Date()) {
  return formatInTimeZone(date, RIYADH_TZ, "yyyy-MM-dd'T'HH:mm");
}

export function todayRiyadh() {
  return riyadhDateStr(new Date());
}

/**
 * UTC start/end instants covering one full Riyadh day.
 * @param {string} dateStr 'YYYY-MM-DD'
 * @returns {{start: Date, end: Date}}
 */
export function dayBoundsUtc(dateStr) {
  return {
    start: zonedTimeToUtc(`${dateStr}T00:00:00`, RIYADH_TZ),
    end: zonedTimeToUtc(`${dateStr}T23:59:59.999`, RIYADH_TZ),
  };
}

export function getCurrentRiyadhTime() {
  return new Date();
}

/**
 * Convert any instant to the UTC instant of Riyadh midnight for that day.
 * Stored as attendanceDate so day equality is exact.
 * @param {Date} [date]
 * @returns {Date}
 */
export function getRiyadhDate(date = new Date()) {
  const dateStr = formatInTimeZone(date, RIYADH_TZ, DATE_FORMAT);
  return zonedTimeToUtc(`${dateStr}T00:00:00`, RIYADH_TZ);
}

function timeToMinutesLocal(timeStr) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr || '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * True when current Riyadh time is within [startTime, endTime) of the group.
 * @param {{startTime: string, endTime: string}} group
 * @param {Date} [date]
 * @returns {boolean}
 */
export function isAttendanceOpen(group, date = new Date()) {
  const nowMinutes = minutesSinceMidnightRiyadh(date);
  const start = timeToMinutesLocal(group?.startTime);
  const end = timeToMinutesLocal(group?.endTime);
  if (start === null || end === null) return false;
  return nowMinutes >= start && nowMinutes < end;
}

export function isTodayRiyadh(date = new Date()) {
  return riyadhDateStr(date) === todayRiyadh();
}

export function shiftRiyadhDate(dateStr, days) {
  const anchor = new Date(`${dateStr}T12:00:00Z`);
  return formatInTimeZone(addDays(anchor, days), 'UTC', DATE_FORMAT);
}

export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === value;
}

function timeToMinutes(timeStr) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr || '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function minutesSinceMidnightRiyadh(date = new Date()) {
  const [h, m] = riyadhTimeStr(date).split(':').map(Number);
  return h * 60 + m;
}

export function isWithinWindow(minutes, opensAt, closesAt) {
  const open = timeToMinutes(opensAt);
  const close = timeToMinutes(closesAt);
  if (open === null || close === null) return true;
  return minutes >= open && minutes <= close;
}
