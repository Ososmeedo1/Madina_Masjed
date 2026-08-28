import Link from 'next/link';
import { getSessionPayload } from '@/lib/utils/auth';
import dbConnect from '@/lib/db/mongoose';
import Group from '@/lib/models/Group';
import Card from '@/components/ui/Card';
import AppShell from '@/components/layout/AppShell';
import { getWeeklyHolidays } from '@/lib/services/groups.service';
import GroupsSettingsForm from '@/components/settings/GroupsSettingsForm';
import WeeklyHolidaysToggle from '@/components/settings/WeeklyHolidaysToggle';
import ChangePasswordForm from '@/components/settings/ChangePasswordForm';
import LogoutButton from '@/components/settings/LogoutButton';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'الإعدادات' };

export default async function DashboardSettingsPage() {
  const payload = await getSessionPayload();

  let groups = [];
  let weeklyHolidays = ['friday', 'saturday'];
  let loadError = false;

  try {
    await dbConnect();
    groups = (await Group.find().sort('key').lean()).map((g) => ({
      _id: String(g._id),
      key: g.key,
      name: g.name,
      startTime: g.startTime,
      endTime: g.endTime,
    }));
    weeklyHolidays = await getWeeklyHolidays();
  } catch {
    loadError = true;
  }

  return (
    <AppShell>
      <main className="container-app py-6 md:py-8">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl">الإعدادات</h1>
          <p className="mt-1 text-sm text-on-surface-variant">إدارة المجموعات والعطلة الأسبوعية والحساب</p>
        </header>

      {loadError ? (
        <div className="card mx-auto max-w-md p-8 text-center">
          <svg width="100" height="80" viewBox="0 0 120 100" fill="none" className="mx-auto mb-4 text-primary opacity-25" aria-hidden="true">
            <rect x="35" y="40" width="50" height="45" rx="4" fill="currentColor" />
            <rect x="40" y="25" width="40" height="20" rx="3" fill="currentColor" />
            <circle cx="60" cy="18" r="10" fill="currentColor" />
            <rect x="25" y="50" width="10" height="35" rx="2" fill="currentColor" />
            <rect x="85" y="50" width="10" height="35" rx="2" fill="currentColor" />
            <path d="M57 18 l3-6 3 6" fill="currentColor" className="opacity-80" />
            <path d="M30 85 h60" stroke="currentColor" strokeWidth="2" className="opacity-40" />
          </svg>
          <h2 className="text-xl">تعذر تحميل الإعدادات</h2>
          <p className="mt-3 text-on-surface-variant">تأكد من تشغيل قاعدة البيانات ثم أعد المحاولة</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-primary">المجموعات</h2>
            <GroupsSettingsForm groups={groups} />
            <WeeklyHolidaysToggle initialDays={weeklyHolidays} />
          </div>

          <div className="space-y-4">
            <Card>
              <h2 className="text-lg">معلومات الحساب</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-2">
                  <dt className="font-semibold text-on-surface-variant">البريد الإلكتروني</dt>
                  <dd dir="ltr" className="font-jakarta">{payload?.email ?? '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-semibold text-on-surface-variant">الدور</dt>
                  <dd>{payload?.role === 'admin' ? 'مدير النظام' : 'معلم'}</dd>
                </div>
              </dl>
              <div className="mt-6">
                <LogoutButton />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg">تغيير كلمة المرور</h2>
              <div className="mt-4">
                <ChangePasswordForm />
              </div>
            </Card>
          </div>
        </div>
      )}
    </main>
    </AppShell>
  );
}
