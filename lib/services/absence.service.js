import dbConnect from '@/lib/db/mongoose';
import TeacherAbsence from '@/lib/models/TeacherAbsence';
import { getRiyadhDate, todayRiyadh } from '@/lib/utils/timezone';
import { formatHijriArabic } from '@/lib/utils/hijri-date';

/**
 * Riyadh-midnight instant for today.
 * @returns {Date}
 */
function todayMidnight() {
  return getRiyadhDate(new Date());
}

/**
 * Mark the teacher absent for TODAY (idempotent upsert on the unique day key).
 * @param {string|null} [teacherId]
 * @returns {Promise<any>} The absence document.
 */
export async function markTeacherAbsent(teacherId = null) {
  await dbConnect();
  const date = todayMidnight();
  const hijriDate = formatHijriArabic();

  const doc = await TeacherAbsence.findOneAndUpdate(
    { date },
    { $setOnInsert: { date, hijriDate, createdBy: teacherId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return doc;
}

/**
 * Remove today's absence record (if any).
 * @returns {Promise<boolean>} true when a record was removed.
 */
export async function cancelTeacherAbsentToday() {
  await dbConnect();
  const res = await TeacherAbsence.deleteOne({ date: todayMidnight() });
  return res.deletedCount > 0;
}

/**
 * Is the teacher marked absent for today?
 * @returns {Promise<boolean>}
 */
export async function isTeacherAbsentToday() {
  await dbConnect();
  return Boolean(await TeacherAbsence.exists({ date: todayMidnight() }));
}

/**
 * Full status payload for dashboard/UI consumption.
 * @returns {Promise<{absent:boolean, hijri:string, date:string}>}
 */
export async function getAbsenceStatus() {
  await dbConnect();
  const absent = await isTeacherAbsentToday();
  return {
    absent,
    hijri: formatHijriArabic(),
    date: todayRiyadh(),
  };
}
