'use client';

import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { fetchJson } from '@/lib/utils/fetcher';

export default function TeacherAbsence() {
  const [absent, setAbsent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetchJson('/api/teacher/absence');
      if (res.ok) setAbsent((await res.json()).absent);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle() {
    setBusy(true);
    setError('');
    try {
      const res = await fetchJson('/api/teacher/absence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: absent ? 'cancel' : 'mark' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'تعذر تحديث الحالة');
        return;
      }
      setAbsent(data.absent);
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg">غياب المعلم</h2>
      <p className="mt-1 mb-4 text-sm text-on-surface-variant">
        عند تفعيل الغياب يتوقف تسجيل الحضور في جميع المجموعات لهذا اليوم فقط، وينتهي تلقائيًا منتصف الليل بتوقيت الرياض.
      </p>

      {absent === null && !error ? (
        <p className="text-sm text-on-surface-variant">جارٍ التحميل...</p>
      ) : (
        <div aria-live="polite">
          <p
            className={`inline-flex min-h-[32px] items-center rounded-full px-4 py-1.5 text-sm font-bold ${
              absent
                ? 'bg-error-container text-on-error-container'
                : 'bg-primary-fixed text-on-primary-fixed'
            }`}
          >
            {absent ? 'المعلم غائب اليوم' : 'المعلم حاضر اليوم'}
          </p>

          <div className="mt-4">
            <Button
              variant={absent ? 'outline' : 'danger'}
              onClick={toggle}
              disabled={busy}
              loading={busy}
            >
              {absent ? 'إلغاء غياب المعلم' : 'تحديد غياب المعلم اليوم'}
            </Button>
          </div>

          {error && <p className="mt-3 text-sm font-semibold text-error">{error}</p>}
        </div>
      )}
    </Card>
  );
}
