'use client';

import { useEffect, useMemo, useState } from 'react';
import momentHijri from 'moment-hijri';
import {
  HIJRI_MONTHS_AR,
  getHijriDaysInMonth,
  getCurrentHijriYear,
  isValidHijriDate,
  hijriToGregorian,
  formatHijriShort,
  toArabicDigits,
} from '@/lib/utils/hijri-date';

const YEAR_RANGE = 5;

function hijriPartsFromInput(dateInput) {
  if (!dateInput) return null;
  try {
    const m = momentHijri(new Date(dateInput));
    return { day: m.iDate(), month: m.iMonth() + 1, year: m.iYear() };
  } catch {
    return null;
  }
}

export default function HijriDatePicker({
  idPrefix = 'hdp',
  label = 'التاريخ الهجري',
  value,
  onChange,
}) {
  const currentYear = useMemo(() => getCurrentHijriYear(), []);
  const initial = useMemo(() => hijriPartsFromInput(value), [value]);

  const [year, setYear] = useState(initial?.year ?? currentYear);
  const [month, setMonth] = useState(initial?.month ?? 1);
  const [day, setDay] = useState(initial?.day ?? 1);

  const daysInMonth = useMemo(
    () => (isValidHijriDate(1, month, year) ? getHijriDaysInMonth(month, year) : 30),
    [month, year]
  );

  useEffect(() => {
    setDay((d) => Math.min(d, daysInMonth));
  }, [daysInMonth]);

  function emit(d, m, y) {
    if (!isValidHijriDate(d, m, y)) return;
    let gregorianDate;
    try {
      gregorianDate = hijriToGregorian(d, m, y);
    } catch {
      return;
    }
    const gregorianDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(gregorianDate);
    onChange?.({
      gregorianDate,
      gregorianDateStr,
      hijriLabel: formatHijriShort(gregorianDate),
    });
  }

  function update(next) {
    const d = next.day ?? day;
    const m = next.month ?? month;
    const y = next.year ?? year;
    setDay(d);
    setMonth(m);
    setYear(y);
    if (isValidHijriDate(d, m, y)) emit(d, m, y);
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-on-surface-variant">{label}</span>
      <div className="grid grid-cols-3 gap-2" dir="rtl">
        <select
          id={`${idPrefix}-day`}
          aria-label="اليوم (هجري)"
          value={Math.min(day, daysInMonth)}
          onChange={(e) => update({ day: Number(e.target.value) })}
          className="input-field min-h-[44px]"
        >
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {toArabicDigits(d)}
            </option>
          ))}
        </select>

        <select
          id={`${idPrefix}-month`}
          aria-label="الشهر (هجري)"
          value={month}
          onChange={(e) => update({ month: Number(e.target.value), day: Math.min(day, getHijriDaysInMonth(Number(e.target.value), year)) })}
          className="input-field min-h-[44px]"
        >
          {HIJRI_MONTHS_AR.map((name, idx) => (
            <option key={name} value={idx + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          id={`${idPrefix}-year`}
          aria-label="السنة (هجري)"
          value={year}
          onChange={(e) => update({ year: Number(e.target.value), day: Math.min(day, getHijriDaysInMonth(month, Number(e.target.value))) })}
          className="input-field min-h-[44px]"
        >
          {Array.from({ length: YEAR_RANGE * 2 + 1 }, (_, i) => currentYear - YEAR_RANGE + i).map((y) => (
            <option key={y} value={y}>
              {toArabicDigits(y)}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-on-surface-variant">
        المحدد:{' '}
        <span className="font-semibold">
          {toArabicDigits(Math.min(day, daysInMonth))} {HIJRI_MONTHS_AR[month - 1]} {toArabicDigits(year)}
        </span>
      </p>
    </div>
  );
}
