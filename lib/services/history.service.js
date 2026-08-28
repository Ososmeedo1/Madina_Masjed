import dbConnect from '@/lib/db/mongoose';
import Group from '@/lib/models/Group';
import Attendance from '@/lib/models/Attendance';
import {
  formatHijriArabicFromIso,
  formatHijriShortFromIso,
  formatTimeArabic,
  formatTimeString12,
  shiftHijriIso,
  parseHijriIso,
  getTodayHijri,
} from '@/lib/utils/hijri-date';
const LIMIT_ENTRIES = 500;
const LIMIT_DATES = 90;

function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function toEntry(doc) {
  return {
    _id: String(doc._id),
    order: doc.order,
    status: doc.status ?? 'present',
    studentName: doc.studentName,
    reason: doc.reason ?? null,
    revision: doc.revision ?? null,
    pagesCount: doc.pagesCount ?? null,
    countOfSard: doc.countOfSard ?? null,
    registeredAtTime: formatTimeArabic(doc.registeredAt),
  };
}

function presentPages(expr) {
  return { $sum: { $cond: [{ $eq: [expr, 'present'] }, '$pagesCount', 0] } };
}

/**
 * Weekly summary buckets (Saturday-anchored Hijri weeks, recorded days only).
 * @param {number} [limitWeeks=12]
 * @returns {Promise<Array<{hijriDate: string, weekStart: string, label: string, days: number, students: number, absents: number, pages: number}>>}
 */
export async function getWeeklySummary(limitWeeks = 12) {
  const dates = await getAvailableDates(90);
  const buckets = new Map();
  for (const d of dates) {
    const key = d.hijriDate;
    const b = buckets.get(key) || { students: 0, pages: 0, absents: 0, listeners: 0, days: 0 };
    b.students += Number(d.students) || 0;
    b.absents += Number(d.absents) || 0;
    b.listeners += Number(d.listeners) || 0;
    b.pages += Number(d.pages) || 0;
    b.days += 1;
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, limitWeeks)
    .map(([hijriDate, b]) => ({
      hijriDate,
      weekStart: hijriDate,
      label: formatHijriShortFromIso(hijriDate),
      days: b.days,
      students: b.students,
      listeners: b.listeners,
      absents: b.absents,
      pages: b.pages,
    }));
}

function dateMeta(hijriStr) {
  return {
    value: hijriStr,
    hijri: formatHijriArabicFromIso(hijriStr),
    hijriShort: formatHijriShortFromIso(hijriStr),
    prev: shiftHijriIso(hijriStr, -1),
    next: shiftHijriIso(hijriStr, 1),
    isToday: hijriStr === getTodayHijri().iso,
  };
}

/**
 * Most recent Hijri dates containing attendance records, newest first.
 * @param {number} [limit=90]
 * @returns {Promise<Array<{hijriDate: string, label: string, students: number, absents: number, pages: number}>>}
 */
export async function getAvailableDates(limit = LIMIT_DATES) {
  await dbConnect();
  const agg = await Attendance.aggregate([
    {
      $group: {
        _id: '$hijriDate',
        students: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        listeners: { $sum: { $cond: [{ $eq: ['$status', 'listener'] }, 1, 0] } },
        absents: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        pages: presentPages('$status'),
      },
    },
    { $sort: { _id: -1 } },
    { $limit: limit },
  ]);
  return agg.map((a) => ({
    hijriDate: a._id,
    label: formatHijriShortFromIso(a._id),
    students: a.students,
    listeners: a.listeners,
    absents: a.absents,
    pages: a.pages,
  }));
}

/**
 * Per-group student/page totals for one Hijri date plus formatted metadata.
 * @param {string} hijriStr 'YYYY-MM-DD' Hijri ISO.
 */
export async function getDateSummary(hijriStr) {
  const parts = parseHijriIso(hijriStr);
  if (!parts) throw fail(400, 'صيغة التاريخ الهجري يجب أن تكون YYYY-MM-DD');

  await dbConnect();

  const agg = await Attendance.aggregate([
    { $match: { hijriDate: hijriStr } },
    {
      $group: {
        _id: '$groupId',
        students: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        listeners: { $sum: { $cond: [{ $eq: ['$status', 'listener'] }, 1, 0] } },
        absents: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        pages: presentPages('$status'),
      },
    },
  ]);
  const stats = new Map(agg.map((x) => [String(x._id), x]));

  const docs = await Group.find().sort('key').lean();
  const groups = docs.map((g) => {
    const s = stats.get(String(g._id));
    return {
      id: String(g._id),
      key: g.key,
      name: g.name,
      startTimeLabel: formatTimeString12(g.startTime),
      endTimeLabel: formatTimeString12(g.endTime),
      students: s ? s.students : 0,
      listeners: s ? s.listeners : 0,
      absents: s ? s.absents : 0,
      pages: s ? s.pages : 0,
    };
  });

  const totals = groups.reduce(
    (acc, g) => ({
      students: acc.students + g.students,
      listeners: acc.listeners + g.listeners,
      absents: acc.absents + g.absents,
      pages: acc.pages + g.pages,
    }),
    { students: 0, listeners: 0, absents: 0, pages: 0 }
  );

  return { date: dateMeta(hijriStr), groups, totals };
}

/**
 * Paginated list of distinct attendance dates with per-group breakdown.
 * @param {number} [page=1]
 * @param {number} [perPage=5]
 * @returns {Promise<{dates:Array, totalPages:number, currentPage:number, hasNext:boolean, hasPrev:boolean}>}
 */
export async function getPaginatedDates(page = 1, perPage = 5) {
  await dbConnect();

  const allDates = await Attendance.aggregate([
    {
      $group: {
        _id: '$hijriDate',
        students: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        listeners: { $sum: { $cond: [{ $eq: ['$status', 'listener'] }, 1, 0] } },
        absents: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        pages: presentPages('$status'),
      },
    },
    { $sort: { _id: -1 } },
  ]);

  const totalDates = allDates.length;
  const totalPages = Math.max(1, Math.ceil(totalDates / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const skip = (safePage - 1) * perPage;
  const pageDates = allDates.slice(skip, skip + perPage);

  if (pageDates.length === 0) {
    return { dates: [], totalPages, currentPage: safePage, hasNext: false, hasPrev: false };
  }

  const pageDateIds = pageDates.map((d) => d._id);

  const [groupStats, groupDocs] = await Promise.all([
    Attendance.aggregate([
      { $match: { hijriDate: { $in: pageDateIds } } },
      {
        $group: {
          _id: { hijriDate: '$hijriDate', groupId: '$groupId' },
          students: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          listeners: { $sum: { $cond: [{ $eq: ['$status', 'listener'] }, 1, 0] } },
          absents: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          pages: presentPages('$status'),
        },
      },
    ]),
    Group.find().sort('key').lean(),
  ]);

  const dateTotalsMap = new Map(allDates.map((d) => [d._id, d]));
  const groupStatsMap = new Map();
  for (const gs of groupStats) {
    groupStatsMap.set(`${gs._id.hijriDate}|${gs._id.groupId}`, gs);
  }

  const dates = pageDateIds.map((hijriDate) => {
    const totals = dateTotalsMap.get(hijriDate);
    const groups = groupDocs.map((g) => {
      const s = groupStatsMap.get(`${hijriDate}|${String(g._id)}`);
      return {
        id: String(g._id),
        key: g.key,
        name: g.name,
        startTimeLabel: formatTimeString12(g.startTime),
        endTimeLabel: formatTimeString12(g.endTime),
        students: s ? s.students : 0,
        listeners: s ? s.listeners : 0,
        absents: s ? s.absents : 0,
        pages: s ? s.pages : 0,
      };
    });

    return {
      hijriDate,
      hijri: formatHijriArabicFromIso(hijriDate),
      hijriShort: formatHijriShortFromIso(hijriDate),
      students: totals ? totals.students : 0,
      listeners: totals ? totals.listeners : 0,
      absents: totals ? totals.absents : 0,
      pages: totals ? totals.pages : 0,
      groups,
    };
  });

  return {
    dates,
    totalPages,
    currentPage: safePage,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

/**
 * Full entry list for one group on one Hijri date (order asc) with totals.
 * @param {string} hijriStr
 * @param {string} groupId
 */
export async function getGroupDayDetail(hijriStr, groupId) {
  if (!parseHijriIso(hijriStr)) throw fail(400, 'صيغة التاريخ الهجري يجب أن تكون YYYY-MM-DD');
  if (!/^[0-9a-fA-F]{24}$/.test(groupId || '')) throw fail(404, 'المجموعة غير موجودة');

  await dbConnect();
  const group = await Group.findById(groupId).lean();
  if (!group) throw fail(404, 'المجموعة غير موجودة');

  const docs = await Attendance.find({
    groupId: group._id,
    hijriDate: hijriStr,
  })
    .sort('order registeredAt')
    .limit(LIMIT_ENTRIES)
    .lean();

  const entries = docs.map(toEntry);
  const presentEntries = entries.filter((e) => e.status === 'present');
  const listenerEntries = entries.filter((e) => e.status === 'listener');
  const totals = {
    students: presentEntries.length,
    listeners: listenerEntries.length,
    absents: entries.length - presentEntries.length - listenerEntries.length,
    pages: presentEntries.reduce((sum, e) => sum + (e.pagesCount || 0), 0),
  };

  return {
    group: {
      id: String(group._id),
      key: group.key,
      name: group.name,
      startTimeLabel: formatTimeString12(group.startTime),
      endTimeLabel: formatTimeString12(group.endTime),
    },
    date: dateMeta(hijriStr),
    entries,
    totals,
  };
}