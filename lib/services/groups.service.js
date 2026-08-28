import { formatInTimeZone } from 'date-fns-tz';
import dbConnect from '@/lib/db/mongoose';
import Group from '@/lib/models/Group';
import Attendance from '@/lib/models/Attendance';
import Settings from '@/lib/models/Settings';
import {
  RIYADH_TZ,
  todayRiyadh,
  riyadhTimeStr,
  getRiyadhDate,
} from '@/lib/utils/timezone';
import { formatHijriArabic, formatTimeString12 } from '@/lib/utils/hijri-date';
import {
  statusForGroup,
  timeToMinutes,
  rangesOverlap,
  isValidTimeString,
  GROUP_STATUS_LABELS_AR,
  REGISTRATION_MESSAGES_AR,
} from '@/lib/utils/group-status';

export const DEFAULT_GROUPS = [
  { key: 'group-1', name: 'المجموعة الأولى', startTime: '16:00', endTime: '17:00' },
  { key: 'group-2', name: 'المجموعة الثانية', startTime: '16:00', endTime: '17:00' },
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function weekdayKeyForDate(date = new Date()) {
  return formatInTimeZone(date, RIYADH_TZ, 'EEEE').toLowerCase();
}

/**
 * Idempotently seed group-1/group-2 (المجموعة الأولى/الثانية، 16:00–17:00) when none exist.
 * Called on first-run setup and before every dashboard/groups read.
 * @returns {Promise<void>}
 */
export async function ensureDefaultGroups() {
  await dbConnect();
  if ((await Group.countDocuments()) === 0) {
    await Group.insertMany(DEFAULT_GROUPS.map((g) => ({ ...g })));
  }
}

/**
 * Weekly-holiday check for a Riyadh date (exceptional holidays were replaced
 * by the TeacherAbsence feature).
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {any} [settings] Pre-loaded settings document.
 * @returns {Promise<boolean>}
 */
export async function isHolidayOn(dateStr, settings) {
  const s = settings ?? (await Settings.getSingleton());
  const weekday = weekdayKeyForDate(new Date(`${dateStr}T12:00:00Z`));
  return Array.isArray(s.weeklyHolidays) && s.weeklyHolidays.includes(weekday);
}

/**
 * Everything the dashboard needs: today meta (incl. Hijri/gregorian), per-group
 * status labels, studentsToday/pagesToday aggregates, and grand totals.
 * @returns {Promise<object>} Snapshot consumed by DashboardClient & GET /api/teacher/groups.
 */
export async function getDashboardSnapshot() {
  await dbConnect();
  await ensureDefaultGroups();

  const settings = await Settings.getSingleton();
  const holiday = await isHolidayOn(todayRiyadh(), settings);
  const today = todayRiyadh();
  const attendanceDate = getRiyadhDate();

  const agg = await Attendance.aggregate([
    { $match: { attendanceDate } },
    {
      $group: {
        _id: '$groupId',
        students: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        listeners: { $sum: { $cond: [{ $eq: ['$status', 'listener'] }, 1, 0] } },
        absents: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        pages: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, '$pagesCount', 0] } },
      },
    },
  ]);
  const stats = new Map(agg.map((a) => [String(a._id), a]));

  const nowMinutes = timeToMinutes(riyadhTimeStr());
  const docs = await Group.find().sort('key').lean();

  const groups = docs.map((g) => {
    const st = stats.get(String(g._id));
    const status = statusForGroup(g, nowMinutes, holiday);
    return {
      _id: String(g._id),
      key: g.key,
      name: g.name,
      startTime: g.startTime,
      endTime: g.endTime,
      status,
      statusAr: GROUP_STATUS_LABELS_AR[status],
      studentsToday: st ? st.students : 0,
      listenersToday: st ? st.listeners : 0,
      absentToday: st ? st.absents : 0,
      pagesToday: st ? st.pages : 0,
      startTimeLabel: formatTimeString12(g.startTime),
      endTimeLabel: formatTimeString12(g.endTime),
    };
  });

  const totals = groups.reduce(
    (acc, g) => ({
      students: acc.students + g.studentsToday,
      listeners: acc.listeners + g.listenersToday,
      absents: acc.absents + g.absentToday,
      pages: acc.pages + g.pagesToday,
    }),
    { students: 0, listeners: 0, absents: 0, pages: 0 }
  );

  return {
    today: {
      date: today,
      hijri: formatHijriArabic(),
      weekday: weekdayKeyForDate(),
      isHoliday: holiday,
    },
    serverTime: riyadhTimeStr(),
    groups,
    totals,
  };
}

export async function getWeeklyHolidays() {
  const settings = await Settings.getSingleton();
  return Array.isArray(settings.weeklyHolidays) ? settings.weeklyHolidays : [];
}

export async function updateWeeklyHolidays(days) {
  await dbConnect();
  const settings = await Settings.getSingleton();
  settings.weeklyHolidays = days;
  await settings.save();
  return settings.weeklyHolidays;
}

/**
 * Validate + update name/times for one of the two fixed groups.
 * Rejects invalid ranges and overlaps with the sibling group (Arabic errors, .status set).
 * @param {string} groupId Mongo _id.
 * @param {{name?: string, startTime?: string, endTime?: string}} payload
 * @returns {Promise<any>} Updated Group document.
 * @throws {Error} With .status 400/404 on validation failures.
 */
export async function updateGroup(groupId, payload = {}) {
  await dbConnect();

  if (!/^[0-9a-fA-F]{24}$/.test(groupId)) {
    return { notFound: true, code: 'GROUP_NOT_FOUND', message: 'المجموعة غير موجودة' };
  }
  const group = await Group.findById(groupId);
  if (!group) {
    return { notFound: true, code: 'GROUP_NOT_FOUND', message: 'المجموعة غير موجودة' };
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : group.name;
  const startTime = payload.startTime ?? group.startTime;
  const endTime = payload.endTime ?? group.endTime;

  if (name.length < 2 || name.length > 120) {
    return { invalid: true, code: 'INVALID_INPUT', message: 'اسم المجموعة مطلوب (حرفان على الأقل)' };
  }
  if (!isValidTimeString(startTime) || !TIME_RE.test(startTime)) {
    return { invalid: true, code: 'INVALID_INPUT', message: 'صيغة وقت البداية يجب أن تكون HH:MM' };
  }
  if (!isValidTimeString(endTime) || !TIME_RE.test(endTime)) {
    return { invalid: true, code: 'INVALID_INPUT', message: 'صيغة وقت النهاية يجب أن تكون HH:MM' };
  }
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    return {
      invalid: true,
      code: 'INVALID_TIME_RANGE',
      message: 'وقت البداية يجب أن يكون قبل وقت النهاية',
    };
  }

  const other = await Group.findOne({ _id: { $ne: group._id } }).lean();
  if (other && rangesOverlap(startTime, endTime, other.startTime, other.endTime)) {
    return {
      conflict: true,
      code: 'GROUP_TIME_CONFLICT',
      message: `تتعارض أوقات المجموعتين: ${other.name} (${other.startTime} - ${other.endTime})`,
    };
  }

  group.name = name;
  group.startTime = startTime;
  group.endTime = endTime;
  await group.save();
  return group;
}
