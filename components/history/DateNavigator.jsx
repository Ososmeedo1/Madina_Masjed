'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import Button from '@/components/ui/Button';
import HijriDatePicker from '@/components/ui/HijriDatePicker';
import { toHijri, getTodayHijri, parseHijriIso, hijriToGregorian } from '@/lib/utils/hijri-date';
import { riyadhDateStr } from '@/lib/utils/timezone';

export default function DateNavigator({ date, prev, next }) {
  const router = useRouter();

  const go = useCallback(
    (d) => router.push(`/history?date=${d}`),
    [router]
  );

  function onPick({ gregorianDateStr }) {
    if (!gregorianDateStr) return;
    const hijriIso = toHijri(new Date(`${gregorianDateStr}T12:00:00Z`)).iso;
    if (hijriIso !== date) go(hijriIso);
  }

  const todayHijri = getTodayHijri().iso;

  const gregorianValue = useMemo(() => {
    const p = parseHijriIso(date);
    if (!p) return `${date}T09:00:00Z`;
    const g = hijriToGregorian(p.day, p.month, p.year);
    return `${riyadhDateStr(g)}T09:00:00Z`;
  }, [date]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => go(prev)}>
          السابق
        </Button>
        <Button variant="ghost" size="sm" onClick={() => go(next)}>
          التالي
        </Button>
        {date !== todayHijri && (
          <Button variant="gold" size="sm" onClick={() => go(todayHijri)}>
            اليوم
          </Button>
        )}
      </div>

      <HijriDatePicker
        idPrefix="hist-nav"
        label="اختر التاريخ الهجري"
        value={gregorianValue}
        onChange={onPick}
      />
    </div>
  );
}
