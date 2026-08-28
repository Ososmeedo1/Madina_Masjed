'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { DAY_LABELS_AR } from '@/lib/utils/group-status';

const TOGGLE_DAYS = ['friday', 'saturday'];

export default function WeeklyHolidaysToggle({ initialDays }) {
  const toast = useToast();
  const [days, setDays] = useState(new Set(initialDays));
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function toggle(day) {
    const next = new Set(days);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setDays(next);
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/teacher/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyHolidays: [...next] }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'تعذر الحفظ');
        setDays(new Set(initialDays));
        return;
      }
      setMessage('تم الحفظ');
      toast('success', 'تم تحديث العطلة الأسبوعية');
      setTimeout(() => setMessage(''), 2000);
    } catch {
      setMessage('خطأ في الاتصال بالخادم');
      setDays(new Set(initialDays));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg">العطلة الأسبوعية</h2>
      <p className="mt-1 mb-4 text-sm text-on-surface-variant">
        في أيام العطلة لا يُحتسب الحضور وتظهر المجموعات بحالة عطلة
      </p>

      <div className="space-y-3">
        {TOGGLE_DAYS.map((day) => (
          <label
            key={day}
            className="flex cursor-pointer items-center justify-between rounded-md bg-surface-container-low px-4 py-3 transition-colors hover:bg-surface-container-high"
          >
            <span className="font-semibold">{DAY_LABELS_AR[day]}</span>
            <input
              type="checkbox"
              checked={days.has(day)}
              onChange={() => toggle(day)}
              disabled={saving}
              className="h-5 w-5 accent-primary"
            />
          </label>
        ))}
      </div>

      {message && (
        <p className={`mt-3 text-sm font-semibold ${message === 'تم الحفظ' ? 'text-primary' : 'text-error'}`}>
          {message}
        </p>
      )}
    </Card>
  );
}
