import dbConnect from '@/lib/db/mongoose';
import Group from '@/lib/models/Group';
import Attendance from '@/lib/models/Attendance';
import Settings from '@/lib/models/Settings';
import { todayRiyadh, riyadhTimeStr, getRiyadhDate } from '@/lib/utils/timezone';
import {
  formatHijriArabic,
  formatTimeArabic,
  formatTimeString12,
  toHijri,
} from '@/lib/utils/hijri-date';
import {
  statusForGroup,
  timeToMinutes,
  REGISTRATION_MESSAGES_AR,
} from '@/lib/utils/group-status';
import { generateEditToken, hashEditToken, verifyEditToken, isTokenExpired } from '@/lib/utils/edit-token';
import {
  validateRegistrationInput,
  validateAbsenceInput,
  validateListenerInput,
  validateEditFields,
} from '@/lib/utils/validation';
import { sanitizeText } from '@/lib/utils/sanitize';
import { isHolidayOn } from '@/lib/services/groups.service';
import { isTeacherAbsentToday } from '@/lib/services/absence.service';

const MAX_ORDER_RETRIES = 8;
const TEACHER_ABSENT_MESSAGE_AR = 'المعلم غائب اليوم - لا يوجد تسجيل حضور أو غياب أو استماع';

function jitterDelay() {
  const ms = 20 + Math.floor(Math.random() * 60);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fail(status, message, extra) {
  const err = new Error(message);
  err.status = status;
  if (extra) Object.assign(err, extra);
  return err;
}

const normalizeName = (v) => sanitizeText(v, 200);

/**
 * Next order slot among PRESENT records only (absent rows have order = null).
 */
async function nextOrderFor(groupId, attendanceDate) {
  const last = await Attendance.findOne({
    groupId,
    attendanceDate,
    status: 'present',
  })
    .sort('-order')
    .select('order')
    .lean();
  return (last?.order ?? 0) + 1;
}

export async function registerStudent(groupKey, body = {}) {
  await dbConnect();

  const absentToday = await isTeacherAbsentToday();
  if (absentToday) {
    throw fail(403, TEACHER_ABSENT_MESSAGE_AR, { code: 'TEACHER_ABSENT' });
  }

  const group = await Group.findOne({ key: groupKey });
  if (!group) throw fail(404, 'المجموعة غير موجودة', { code: 'GROUP_NOT_FOUND' });

  const settings = await Settings.getSingleton();
  const today = todayRiyadh();

  if (await isHolidayOn(today, settings)) {
    throw fail(403, REGISTRATION_MESSAGES_AR.HOLIDAY);
  }

  const status = statusForGroup(group, timeToMinutes(riyadhTimeStr()), false);
  if (status === 'NOT_STARTED') throw fail(400, REGISTRATION_MESSAGES_AR.NOT_STARTED, { code: 'REGISTRATION_NOT_STARTED' });
  if (status === 'CLOSED') throw fail(400, REGISTRATION_MESSAGES_AR.CLOSED, { code: 'REGISTRATION_CLOSED' });

  const requestedStatus = body.status === 'absent' ? 'absent' : body.status === 'listener' ? 'listener' : 'present';

  let studentName;
  if (requestedStatus === 'present') {
    const { ok, errors } = validateRegistrationInput(body);
    if (!ok) return { invalid: true, errors };
    studentName = normalizeName(body.studentName, 120);
  } else if (requestedStatus === 'listener') {
    const { ok, errors } = validateListenerInput(body);
    if (!ok) return { invalid: true, errors };
    studentName = normalizeName(body.studentName, 120);
  } else {
    const { ok, errors } = validateAbsenceInput(body);
    if (!ok) return { invalid: true, errors };
    studentName = normalizeName(body.studentName, 120);
  }

  const attendanceDate = getRiyadhDate();
  const hijriParts = toHijri(new Date());

  // Mutual exclusivity: one record per student per day (any status).
  const existing = await Attendance.findOne({
    groupId: group._id,
    attendanceDate,
    studentName,
  });

  if (existing) {
    if (existing.status === requestedStatus) {
      return {
        duplicateId: String(existing._id),
        code: 'ALREADY_REGISTERED',
        recordStatus: existing.status,
      };
    }
    // Opposite status exists → explicit confirmation required for conversion.
    if (body.convert !== true) {
      return {
        conflictId: String(existing._id),
        code: 'STATUS_CONFLICT',
        recordStatus: existing.status,
      };
    }

    const editToken = generateEditToken();
    existing.editTokenHash = hashEditToken(editToken);

    if (requestedStatus === 'absent') {
      const reason =
        body.reason !== undefined && String(body.reason).trim() !== ''
          ? sanitizeText(body.reason, 500)
          : undefined;
      existing.status = 'absent';
      existing.revision = null;
      existing.pagesCount = null;
      existing.countOfSard = null;
      existing.order = null;
      existing.reason = reason ?? 'تم التحويل من حضور';
    } else if (requestedStatus === 'listener') {
      existing.status = 'listener';
      existing.revision = null;
      existing.pagesCount = null;
      existing.countOfSard = null;
      existing.order = null;
      existing.reason = null;
    } else {
      existing.status = 'present';
      existing.revision = normalizeName(body.revision, 220);
      existing.pagesCount = Number(body.pagesCount);
      existing.countOfSard =
        body.countOfSard !== undefined && String(body.countOfSard).trim() !== ''
          ? normalizeName(body.countOfSard, 520)
          : null;
      existing.reason = null;
      for (let attempt = 0; attempt < MAX_ORDER_RETRIES; attempt++) {
        existing.order = await nextOrderFor(group._id, attendanceDate);
        try {
          await existing.save();
          break;
        } catch (err) {
          if (err.code === 11000 && String(err.message).includes('order')) {
            await jitterDelay();
            continue;
          }
          throw err;
        }
      }
      if (existing.order == null) throw fail(500, 'ازدحام في التسجيل، حاول مرة أخرى');
    }

    await existing.save();
    return { record: existing, editToken, converted: true };
  }

  const baseDoc = {
    groupId: group._id,
    studentName,
    status: requestedStatus,
    attendanceDate,
    hijriDate: hijriParts.iso,
    hijriDateFormatted: formatHijriArabic(new Date()),
    registeredAt: new Date(),
  };

  if (requestedStatus === 'absent' || requestedStatus === 'listener') {
    baseDoc.reason =
      body.reason !== undefined && String(body.reason).trim() !== ''
        ? sanitizeText(body.reason, 500)
        : null;
    baseDoc.order = null;
    if (requestedStatus === 'listener') {
      baseDoc.revision = null;
      baseDoc.pagesCount = null;
      baseDoc.countOfSard = null;
    }
  } else {
    baseDoc.revision = normalizeName(body.revision, 220);
    baseDoc.pagesCount = body.pagesCount;
    baseDoc.countOfSard =
      body.countOfSard !== undefined && String(body.countOfSard).trim() !== ''
        ? normalizeName(body.countOfSard, 520)
        : null;
  }

  const editToken = generateEditToken();
  baseDoc.editTokenHash = hashEditToken(editToken);

  if (requestedStatus !== 'present') {
    try {
      const record = await Attendance.create(baseDoc);
      return { record, editToken };
    } catch (err) {
      if (err.code === 11000 && String(err.message).includes('studentName')) {
        const raced = await Attendance.findOne({ groupId: group._id, attendanceDate, studentName }).select('_id').lean();
        return { duplicateId: raced ? String(raced._id) : null, code: 'ALREADY_REGISTERED' };
      }
      throw err;
    }
  }

  for (let attempt = 0; attempt < MAX_ORDER_RETRIES; attempt++) {
    try {
      baseDoc.order = await nextOrderFor(group._id, attendanceDate);
      const record = await Attendance.create(baseDoc);
      return { record, editToken };
    } catch (err) {
      if (err.code === 11000) {
        if (String(err.message).includes('studentName')) {
          const raced = await Attendance.findOne({ groupId: group._id, attendanceDate, studentName }).select('_id').lean();
          return { duplicateId: raced ? String(raced._id) : null, code: 'ALREADY_REGISTERED' };
        }
        await jitterDelay();
        continue;
      }
      throw err;
    }
  }

  throw fail(500, 'ازدحام في التسجيل، حاول مرة أخرى');
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
    registeredAtTime: formatTimeArabic(new Date(doc.registeredAt)),
  };
}

export async function getAttendanceForEdit(attendanceId, token) {
  await dbConnect();

  if (!/^[0-9a-fA-F]{24}$/.test(attendanceId || '')) throw fail(404, 'السجل غير موجود');

  const record = await Attendance.findById(attendanceId);
  if (!record) throw fail(404, 'السجل غير موجود');

  if (isTokenExpired(record.createdAt)) {
    throw fail(401, 'انتهت صلاحية رمز التعديل (٣٠ يوماً)');
  }

  if (!verifyEditToken(token, record.editTokenHash)) {
    throw fail(401, 'رمز التعديل غير صالح');
  }

  return record;
}

export async function getAttendanceEditData(attendanceId, token) {
  const record = await getAttendanceForEdit(attendanceId, token);
  const group = await Group.findById(record.groupId).select('name key startTime endTime').lean();
  return {
    record: record.toJSON(),
    group: group
      ? {
          name: group.name,
          key: group.key,
          startTimeLabel: formatTimeString12(group.startTime),
          endTimeLabel: formatTimeString12(group.endTime),
        }
      : null,
    labels: {
      attendanceHijri: formatHijriArabic(new Date(record.attendanceDate)),
      registeredAt: formatTimeArabic(new Date(record.registeredAt)),
    },
  };
}

export async function updateAttendanceWithToken(attendanceId, token, body = {}) {
  const record = await getAttendanceForEdit(attendanceId, token);

  const previousStatus = record.status;
  const targetStatus = body.status ?? previousStatus;

  const { ok, errors, cleaned } = validateEditFields(body, targetStatus);
  if (!ok) throw fail(400, 'تحقق من الحقول المطلوبة', { errors });

  if (cleaned.studentName !== undefined) record.studentName = cleaned.studentName;

  if (targetStatus === 'absent') {
    record.status = 'absent';
    record.revision = null;
    record.pagesCount = null;
    record.countOfSard = null;
    record.order = null;
    record.reason =
      cleaned.reason !== undefined && cleaned.reason !== ''
        ? cleaned.reason
        : previousStatus === 'present'
          ? 'تم التحويل من حضور'
          : (record.reason ?? 'تم التحويل من حضور');
  } else if (targetStatus === 'listener') {
    record.status = 'listener';
    record.revision = null;
    record.pagesCount = null;
    record.countOfSard = null;
    record.order = null;
    record.reason = null;
  } else {
    const revision = cleaned.revision ?? record.revision;
    const pagesCount = cleaned.pagesCount ?? record.pagesCount;
    const countOfSard =
      cleaned.countOfSard !== undefined ? cleaned.countOfSard : record.countOfSard;
    const missing = {};
    if (!revision || String(revision).trim().length < 2) missing.revision = 'اسم السورة مطلوب (حروف عربية فقط)';
    if (!Number.isInteger(pagesCount) || pagesCount < 1) missing.pagesCount = 'عدد الأوجه يجب أن يكون رقماً صحيحاً موجباً';
    if (Object.keys(missing).length > 0) {
      throw fail(400, 'بيانات الحضور ناقصة، أكمل الحقول المطلوبة', { errors: missing });
    }

    record.revision = typeof revision === 'string' ? revision.trim() : revision;
    record.pagesCount = pagesCount;
    record.countOfSard = countOfSard;
    record.status = 'present';
    record.reason = null;

    if (record.order == null) {
      record.order = await nextOrderFor(record.groupId, record.attendanceDate);
    }
  }

  try {
    await record.save();
  } catch (err) {
    if (err.code === 11000 && String(err.message).includes('order')) {
      record.order = await nextOrderFor(record.groupId, record.attendanceDate);
      await record.save();
    } else {
      throw err;
    }
  }

  let newToken = null;
  if (previousStatus !== record.status) {
    newToken = generateEditToken();
    record.editTokenHash = hashEditToken(newToken);
    await record.save();
  }

  return { record, newToken };
}

export async function getCurrentRecord(groupKey, token) {
  await dbConnect();

  const group = await Group.findOne({ key: groupKey }).lean();
  if (!group) return null;

  const record = await Attendance.findOne({
    groupId: group._id,
    attendanceDate: getRiyadhDate(),
  }).lean();

  if (!record) return null;

  if (isTokenExpired(record.createdAt)) return null;

  if (!verifyEditToken(token, record.editTokenHash)) return null;

  return {
    record: {
      _id: String(record._id),
      status: record.status,
      studentName: record.studentName,
      revision: record.revision ?? null,
      pagesCount: record.pagesCount ?? null,
      countOfSard: record.countOfSard ?? null,
      reason: record.reason ?? null,
      order: record.order ?? null,
      registeredAtTime: formatTimeArabic(new Date(record.registeredAt)),
    },
    group: {
      key: group.key,
      name: group.name,
    },
  };
}

export async function getAttendancePageData(groupKey) {
  await dbConnect();

  const group = await Group.findOne({ key: groupKey }).lean();
  if (!group) return null;

  const teacherAbsent = await isTeacherAbsentToday();

  const settings = await Settings.getSingleton();
  const today = todayRiyadh();
  const holiday = await isHolidayOn(today, settings);

  const status = statusForGroup(group, timeToMinutes(riyadhTimeStr()), holiday);

  const docs = await Attendance.find({
    groupId: group._id,
    attendanceDate: getRiyadhDate(),
  })
    .sort('order registeredAt')
    .limit(300)
    .lean();

  const entries = docs.map(toEntry);
  const presentEntries = entries.filter((e) => e.status === 'present');
  const listenerEntries = entries.filter((e) => e.status === 'listener');
  const absentEntries = entries.filter((e) => e.status === 'absent');
  const totalPages = presentEntries.reduce((s, e) => s + (e.pagesCount || 0), 0);

  return {
    group: {
      key: group.key,
      name: group.name,
      startTime: group.startTime,
      endTime: group.endTime,
      startTimeLabel: formatTimeString12(group.startTime),
      endTimeLabel: formatTimeString12(group.endTime),
    },
    today: {
      date: today,
      hijri: formatHijriArabic(),
      isHoliday: holiday,
    },
    teacherAbsent,
    status,
    statusMessage: REGISTRATION_MESSAGES_AR[status],
    serverTime: riyadhTimeStr(),
    entries: [...presentEntries, ...listenerEntries, ...absentEntries],
    stats: {
      presentCount: presentEntries.length,
      listenerCount: listenerEntries.length,
      absentCount: absentEntries.length,
      totalPages,
    },
  };
}
