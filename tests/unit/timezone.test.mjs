import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RIYADH_TZ,
  riyadhDateStr,
  riyadhTimeStr,
  getRiyadhDate,
  dayBoundsUtc,
  shiftRiyadhDate,
  isValidDateString,
  isTodayRiyadh,
  isAttendanceOpen,
} from '../../lib/utils/timezone.js';

test('riyadhDateStr converts UTC instant to Riyadh calendar date', () => {
  assert.equal(riyadhDateStr(new Date('2026-08-25T12:00:00Z')), '2026-08-25');
  assert.equal(riyadhDateStr(new Date('2026-08-24T21:00:00Z')), '2026-08-25');
});

test('riyadhTimeStr applies +03:00 offset', () => {
  assert.equal(riyadhTimeStr(new Date('2026-08-25T12:00:00Z')), '15:00');
  assert.equal(riyadhTimeStr(new Date('2026-08-25T20:45:00Z')), '23:45');
});

test('getRiyadhDate returns Riyadh midnight as UTC instant', () => {
  const d = getRiyadhDate(new Date('2026-08-25T18:00:00Z'));
  assert.equal(d.toISOString(), '2026-08-24T21:00:00.000Z');
});

test('dayBoundsUtc spans exactly the Riyadh day', () => {
  const { start, end } = dayBoundsUtc('2026-08-25');
  assert.equal(start.toISOString(), '2026-08-24T21:00:00.000Z');
  assert.equal(end.toISOString(), '2026-08-25T20:59:59.999Z');
});

test('shiftRiyadhDate crosses month boundaries', () => {
  assert.equal(shiftRiyadhDate('2026-08-31', 1), '2026-09-01');
  assert.equal(shiftRiyadhDate('2026-09-01', -1), '2026-08-31');
  assert.equal(shiftRiyadhDate('2026-12-31', 1), '2027-01-01');
});

test('isValidDateString rejects malformed and impossible dates', () => {
  assert.equal(isValidDateString('2026-08-25'), true);
  assert.equal(isValidDateString('2026-02-30'), false);
  assert.equal(isValidDateString('bad'), false);
  assert.equal(isValidDateString('2026-8-5'), false);
  assert.equal(isValidDateString(20260825), false);
});

test('isTodayRiyadh matches only current Riyadh day', () => {
  const now = new Date();
  assert.equal(isTodayRiyadh(now), true);
  assert.equal(isTodayRiyadh(new Date(Date.now() - 48 * 3600 * 1000)), false);
});

test('isAttendanceOpen respects inclusive start exclusive end', () => {
  const group = { startTime: '16:00', endTime: '17:00' };
  const at = (h, m) => new Date(`2026-08-25T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);

  const shifted = (d) => d;

  assert.equal(isAttendanceOpen(group, shifted(at(13, 0))), true);
  assert.equal(isAttendanceOpen(group, shifted(at(13, 59))), true);
  assert.equal(isAttendanceOpen(group, shifted(at(14, 0))), false);
  assert.equal(isAttendanceOpen(group, shifted(at(12, 59))), false);
  assert.equal(isAttendanceOpen({ startTime: 'bad', endTime: '17:00' }, at(13, 30)), false);
});

test('hijriDateStr replaced by Hijri-only utils (see tests/unit/hijri-date.test.mjs)', () => {
  assert.ok(true);
});
