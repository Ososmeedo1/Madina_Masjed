'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

function GroupFields({ group }) {
  const [form, setForm] = useState({
    name: group.name,
    startTime: group.startTime,
    endTime: group.endTime,
  });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch(`/api/teacher/groups/${group._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'تعذر حفظ التغييرات');
        return;
      }

      setSaved(true);
      toast('success', 'تم حفظ التغييرات بنجاح');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="text-lg">{group.key === 'group-1' ? 'المجموعة الأولى' : 'المجموعة الثانية'}</h2>

        {error && (
          <p className="rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-md bg-primary-fixed px-4 py-3 text-sm font-semibold text-on-primary-fixed">
            تم الحفظ بنجاح
          </p>
        )}

        <div>
          <label htmlFor={`name-${group._id}`} className="mb-1 block text-sm font-semibold text-on-surface-variant">
            اسم المجموعة
          </label>
          <input
            id={`name-${group._id}`}
            name="name"
            value={form.name}
            onChange={onChange}
            className="input-field"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`start-${group._id}`} className="mb-1 block text-sm font-semibold text-on-surface-variant">
              وقت البداية
            </label>
            <input
              id={`start-${group._id}`}
              name="startTime"
              type="time"
              dir="ltr"
              value={form.startTime}
              onChange={onChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label htmlFor={`end-${group._id}`} className="mb-1 block text-sm font-semibold text-on-surface-variant">
              وقت النهاية
            </label>
            <input
              id={`end-${group._id}`}
              name="endTime"
              type="time"
              dir="ltr"
              value={form.endTime}
              onChange={onChange}
              className="input-field"
              required
            />
          </div>
        </div>

      <Button type="submit" disabled={loading} loading={loading}>
        {loading ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
      </Button>
      </form>
    </Card>
  );
}

export default function GroupsSettingsForm({ groups }) {
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <GroupFields key={g._id} group={g} />
      ))}
    </div>
  );
}
