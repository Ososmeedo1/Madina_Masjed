import moment from 'moment-hijri';

export const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Convert Western digits in a string/number to Arabic-Indic digits.
 * @param {string|number} value
 * @returns {string}
 */
export function toArabicDigits(value) {
  return String(value).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

/**
 * Convert any date/instant to its Hijri (Umm al-Qura) components in Asia/Riyadh.
 * @param {Date|string|number} [date=new Date()]
 * @returns {{year:number, month:number, day:number, monthName:string, iso:string}}
 */
export function toHijri(date = new Date()) {
  const m = moment(new Date(date));
  const monthIndex = m.iMonth();
  const month = monthIndex + 1;
  const day = m.iDate();
  const year = m.iYear();
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return {
    year,
    month,
    day,
    monthName: HIJRI_MONTHS_AR[monthIndex],
    iso: `${year}-${mm}-${dd}`,
  };
}

/**
 * Today's Hijri components in Asia/Riyadh.
 * @returns {{year:number, month:number, day:number, monthName:string, iso:string}}
 */
export function getTodayHijri() {
  return toHijri(new Date());
}

/**
 * Full Arabic Hijri date string, e.g. "الثلاثاء، ١٠ رمضان ١٤٤٦".
 * @param {Date|string|number} [date=new Date()]
 * @returns {string}
 */
export function formatHijriArabic(date = new Date()) {
  const h = toHijri(date);
  const weekday = new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(date));
  return `${weekday}، ${toArabicDigits(h.day)} ${h.monthName} ${toArabicDigits(h.year)}`;
}

/**
 * Short Hijri label (no weekday), e.g. "١٠ رمضان ١٤٤٦".
 * @param {Date|string|number} [date=new Date()]
 * @returns {string}
 */
export function formatHijriShort(date = new Date()) {
  const h = toHijri(date);
  return `${toArabicDigits(h.day)} ${h.monthName} ${toArabicDigits(h.year)}`;
}

/**
 * Format an instant as 12-hour Arabic time, e.g. "٤:٣٧ م" / "١٢:٠٠ ص".
 * @param {Date|string|number} [date=new Date()]
 * @returns {string}
 */
export function formatTimeArabic(date = new Date()) {
  return new Intl.DateTimeFormat('ar-SA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Riyadh',
  }).format(new Date(date));
}

/**
 * Live clock string with seconds, e.g. "٣:٣٧:٤٥ م" (Latin digits variant
 * available via formatClockSecondsLatn for large numeric displays).
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function formatClockSeconds(date = new Date()) {
  return new Intl.DateTimeFormat('ar-SA', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Riyadh',
  }).format(new Date(date));
}

/**
 * Live clock with seconds using Latin digits — used by large dashboard-style clocks.
 * @param {Date} [date=new Date()]
 * @returns {string} e.g. "3:37:45 م"
 */
export function formatClockSecondsLatn(date = new Date()) {
  return new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
    timeZone: 'Asia/Riyadh',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

/**
 * Convert a stored "HH:MM" group time string to 12-hour Arabic display, e.g. "٤:٠٠ م".
 * @param {string} hhmm
 * @returns {string}
 */
export function formatTimeString12(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return '';
  let h = Number(m[1]);
  const min = toArabicDigits(m[2]);
  const mer = h < 12 ? 'ص' : 'م';
  h = h % 12;
  if (h === 0) h = 12;
  return `${toArabicDigits(h)}:${min} ${mer}`;
}

/**
 * True when both instants fall on the same Hijri day in Asia/Riyadh.
 * @param {Date|string|number} a
 * @param {Date|string|number} b
 * @returns {boolean}
 */
export function isSameHijriDay(a, b) {
  return toHijri(a).iso === toHijri(b).iso;
}

/**
 * Convert a Hijri date string ("YYYY-MM-DD" Hijri) to a Gregorian Date at midnight.
 * @param {string} hijriIso e.g. "1447-03-12"
 * @returns {Date}
 */
/**
 * Convert Hijri components to a Gregorian Date at midnight Asia/Riyadh.
 * @param {number} day   Hijri day 1..30
 * @param {number} month Hijri month 1..12
 * @param {number} year  Hijri year
 * @returns {Date}
 * @throws {RangeError} When the Hijri date is not valid.
 */
export function hijriToGregorian(day, month, year) {
  if (!isValidHijriDate(day, month, year)) {
    throw new RangeError('تاريخ هجري غير صالح');
  }
  const mh = moment();
  mh.iYear(year);
  mh.iMonth(month - 1);
  mh.iDate(day);
  mh.hours(0).minutes(0).seconds(0).milliseconds(0);
  return mh.toDate();
}

/**
 * Arabic names of the 12 Hijri months.
 * @returns {string[]}
 */
export function getHijriMonths() {
  return [...HIJRI_MONTHS_AR];
}

/**
 * Current Hijri year in Asia/Riyadh.
 * @returns {number}
 */
export function getCurrentHijriYear() {
  return moment().iYear();
}

/**
 * Number of days in a Hijri month (29 or 30).
 * @param {number} month 1..12
 * @param {number} year
 * @returns {number}
 */
export function getHijriDaysInMonth(month, year) {
  if (!Number.isInteger(month) || month < 1 || month > 12) return 0;
  if (!Number.isInteger(year)) return 0;
  return isValidHijriDate(30, month, year) ? 30 : 29;
}

/**
 * Validate a Hijri day/month/year triple against the Umm al-Qura calendar.
 * @param {number} day
 * @param {number} month
 * @param {number} year
 * @returns {boolean}
 */
export function isValidHijriDate(day, month, year) {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 30) return false;
  if (year < 1300 || year > 1600) return false;
  const mh = moment();
  try {
    mh.iYear(year);
    mh.iMonth(month - 1);
    mh.iDate(day);
    return mh.iYear() === year && mh.iMonth() === month - 1 && mh.iDate() === day;
  } catch {
    return false;
  }
}

/**
 * Convert a Gregorian Date to the 'YYYY-MM-DD' civil string used by DB queries,
 * evaluated in Asia/Riyadh.
 * @param {Date} date
 * @returns {string}
 */
export function gregorianToDateString(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Parse a 'YYYY-MM-DD' Hijri ISO string into validated components.
 * @param {string} iso
 * @returns {{year:number, month:number, day:number}|null}
 */
export function parseHijriIso(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!isValidHijriDate(day, month, year)) return null;
  return { year, month, day };
}

/**
 * Shift a Hijri ISO date by N days (via its Gregorian equivalent).
 * @param {string} iso 'YYYY-MM-DD' Hijri.
 * @param {number} days Positive or negative.
 * @returns {string|null} Shifted Hijri ISO string.
 */
export function shiftHijriIso(iso, days) {
  const p = parseHijriIso(iso);
  if (!p) return null;
  const g = hijriToGregorian(p.day, p.month, p.year);
  return toHijri(new Date(g.getTime() + days * 86400000)).iso;
}

/**
 * Full Arabic Hijri label directly from a Hijri ISO string.
 * @param {string} iso
 * @returns {string}
 */
export function formatHijriArabicFromIso(iso) {
  const p = parseHijriIso(iso);
  if (!p) return '';
  const weekday = new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long',
    timeZone: 'Asia/Riyadh',
  }).format(hijriToGregorian(p.day, p.month, p.year));
  return `${weekday}، ${toArabicDigits(p.day)} ${HIJRI_MONTHS_AR[p.month - 1]} ${toArabicDigits(p.year)}`;
}

/**
 * Short Arabic Hijri label directly from a Hijri ISO string.
 * @param {string} iso
 * @returns {string}
 */
export function formatHijriShortFromIso(iso) {
  const p = parseHijriIso(iso);
  if (!p) return '';
  return `${toArabicDigits(p.day)} ${HIJRI_MONTHS_AR[p.month - 1]} ${toArabicDigits(p.year)}`;
}
