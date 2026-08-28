import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GROUP_STATUS,
  GROUP_STATUS_LABELS_AR,
  REGISTRATION_MESSAGES_AR,
  timeToMinutes,
  isValidTimeString,
  rangesOverlap,
  statusForGroup,
} from '../../lib/utils/group-status.js';

test('timeToMinutes parses HH:MM', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('16:30'), 990);
  assert.equal(timeToMinutes('23:59'), 1439);
  assert.equal(timeToMinutes('24:00'), null);
  assert.equal(timeToMinutes('-1:00'), null);
  assert.equal(timeToMinutes('abc'), null);
  assert.equal(timeToMinutes(undefined), null);
});

test('isValidTimeString', () => {
  assert.equal(isValidTimeString('05:05'), true);
  assert.equal(isValidTimeString('5:05'), true);
  assert.equal(isValidTimeString('05:60'), false);
});

test('rangesOverlap detects intersection but allows touching edges', () => {
  assert.equal(rangesOverlap('16:00', '17:00', '16:30', '18:00'), true);
  assert.equal(rangesOverlap('16:00', '17:00', '17:00', '18:00'), false);
  assert.equal(rangesOverlap('16:00', '17:00', '15:00', '16:01'), true);
  assert.equal(rangesOverlap('16:00', '17:00', '18:00', '19:00'), false);
  assert.equal(rangesOverlap('bad', '17:00', '16:00', '17:00'), false);
});

const group = { startTime: '16:00', endTime: '17:00' };

test('statusForGroup before window', () => {
  assert.equal(statusForGroup(group, 15 * 60, false), GROUP_STATUS.NOT_STARTED);
});

test('statusForGroup during window', () => {
  assert.equal(statusForGroup(group, 16 * 60 + 30, false), GROUP_STATUS.OPEN);
  assert.equal(statusForGroup(group, 16 * 60, false), GROUP_STATUS.OPEN);
});

test('statusForGroup after window', () => {
  assert.equal(statusForGroup(group, 17 * 60, false), GROUP_STATUS.CLOSED);
  assert.equal(statusForGroup(group, 22 * 60, false), GROUP_STATUS.CLOSED);
});

test('statusForGroup holiday overrides time', () => {
  assert.equal(statusForGroup(group, 16 * 60 + 30, true), GROUP_STATUS.HOLIDAY);
});

test('statusForGroup handles invalid group times defensively', () => {
  assert.equal(statusForGroup({}, 900, false), GROUP_STATUS.NOT_STARTED);
});

test('Arabic label maps cover every status', () => {
  for (const key of Object.values(GROUP_STATUS)) {
    assert.ok(GROUP_STATUS_LABELS_AR[key]);
    assert.ok(REGISTRATION_MESSAGES_AR[key]);
  }
});
