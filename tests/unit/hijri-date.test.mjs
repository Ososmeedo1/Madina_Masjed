import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toHijri,
  formatHijriArabic,
  formatHijriShort,
  formatTimeArabic,
  getTodayHijri,
  isSameHijriDay,
  hijriToGregorian,
  formatTimeString12,
  toArabicDigits,
  HIJRI_MONTHS_AR,
} from '../../lib/utils/hijri-date.js';

test('toHijri converts a known Gregorian date (Umm al-Qura)', () => {
  const h = toHijri('2026-08-25');
  assert.equal(h.year, 1448);
  assert.equal(h.month, 3);
  assert.equal(h.day, 12);
  assert.equal(h.monthName, 'ربيع الأول');
});

test('all 12 Hijri month names present in order', () => {
  assert.deepEqual(HIJRI_MONTHS_AR, [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
    'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
    'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
  ]);
});

test('formatHijriArabic includes weekday, Arabic digits and month name', () => {
  const s = formatHijriArabic('2026-08-25');
  assert.match(s, /الثلاثاء/);
  assert.match(s, /١٢/);
  assert.match(s, /ربيع الأول/);
  assert.match(s, /١٤٤٨/);
  assert.doesNotMatch(s, /[0-9]/);
});

test('formatHijriShort omits weekday', () => {
  const s = formatHijriShort('2026-08-25');
  assert.match(s, /ربيع الأول/);
  assert.doesNotMatch(s, /الثلاثاء/);
});

test('formatTimeArabic renders 12-hour with ص/م', () => {
  assert.equal(formatTimeArabic(new Date('2026-08-25T12:37:00Z')), '٣:٣٧ م');
  assert.equal(formatTimeArabic(new Date('2026-08-25T21:00:00Z')), '١٢:٠٠ ص');
  assert.equal(formatTimeArabic(new Date('2026-08-25T09:15:00Z')), '١٢:١٥ م');
});

test('getTodayHijri returns current components with ISO string', () => {
  const t = getTodayHijri();
  assert.match(t.iso, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(HIJRI_MONTHS_AR.includes(t.monthName));
});

test('isSameHijriDay true for same Hijri day across UTC dates', () => {
  const a = new Date('2026-08-24T21:00:00Z');
  const b = new Date('2026-08-25T14:00:00Z');
  assert.equal(isSameHijriDay(a, b), true);
  const c = new Date('2026-08-25T21:30:00Z');
  assert.equal(isSameHijriDay(a, c), false);
});

test('hijriToGregorian round-trips through toHijri', () => {
  const g = hijriToGregorian(12, 3, 1448);
  const back = toHijri(g);
  assert.deepEqual([back.year, back.month, back.day], [1448, 3, 12]);
});

test('formatTimeString12 converts HH:MM with Arabic meridiem', () => {
  assert.equal(formatTimeString12('16:00'), '٤:٠٠ م');
  assert.equal(formatTimeString12('00:05'), '١٢:٠٥ ص');
  assert.equal(formatTimeString12('12:30'), '١٢:٣٠ م');
  assert.equal(formatTimeString12('bad'), '');
});

test('toArabicDigits maps 0-9', () => {
  assert.equal(toArabicDigits(2026), '٢٠٢٦');
  assert.equal(toArabicDigits('05'), '٠٥');
});
