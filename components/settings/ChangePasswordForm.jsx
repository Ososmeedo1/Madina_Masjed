'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

export default function ChangePasswordForm() {
  const toast = useToast();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess('');
    setErrors({});

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || {});
        setMessage(data.message || 'تعذر تغيير كلمة المرور');
        return;
      }

      setSuccess(data.message);
      toast('success', data.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setMessage('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message && (
        <p className="rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
          {message}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-primary-fixed px-4 py-3 text-sm font-semibold text-on-primary-fixed">
          {success}
        </p>
      )}

      <Input
        id="currentPassword"
        name="currentPassword"
        type="password"
        label="كلمة المرور الحالية"
        autoComplete="current-password"
        value={form.currentPassword}
        error={errors.currentPassword}
        onChange={onChange}
        required
      />

      <Input
        id="newPassword"
        name="newPassword"
        type="password"
        label="كلمة المرور الجديدة"
        autoComplete="new-password"
        value={form.newPassword}
        error={errors.newPassword}
        onChange={onChange}
        required
      />

      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="تأكيد كلمة المرور الجديدة"
        autoComplete="new-password"
        value={form.confirmPassword}
        error={errors.confirmPassword}
        onChange={onChange}
        required
      />

      <Button type="submit" disabled={loading}>
        {loading ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
      </Button>
    </form>
  );
}
