export const GROUP_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  HOLIDAY: 'HOLIDAY',
};

export const GROUP_STATUS_LABELS_AR = {
  NOT_STARTED: 'لم تبدأ بعد',
  OPEN: 'مفتوحة الآن',
  CLOSED: 'انتهت اليوم',
  HOLIDAY: 'عطلة',
};

export const REGISTRATION_MESSAGES_AR = {
  NOT_STARTED: 'لم يبدأ وقت التسجيل بعد',
  OPEN: 'التسجيل مفتوح',
  CLOSED: 'انتهى وقت التسجيل',
  HOLIDAY: 'اليوم إجازة',
};

export const WEEKDAY_KEYS = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

export const DAY_LABELS_AR = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

export function timeToMinutes(value) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value || '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function isValidTimeString(value) {
  return timeToMinutes(value) !== null;
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const a1 = timeToMinutes(aStart);
  const a2 = timeToMinutes(aEnd);
  const b1 = timeToMinutes(bStart);
  const b2 = timeToMinutes(bEnd);
  if (a1 === null || a2 === null || b1 === null || b2 === null) return false;
  return Math.max(a1, b1) < Math.min(a2, b2);
}

export function statusForGroup(group, nowMinutes, isHolidayToday) {
  if (isHolidayToday) return GROUP_STATUS.HOLIDAY;
  const start = timeToMinutes(group.startTime);
  const end = timeToMinutes(group.endTime);
  if (start === null || end === null || nowMinutes === null) return GROUP_STATUS.NOT_STARTED;
  if (nowMinutes < start) return GROUP_STATUS.NOT_STARTED;
  if (nowMinutes >= end) return GROUP_STATUS.CLOSED;
  return GROUP_STATUS.OPEN;
}
