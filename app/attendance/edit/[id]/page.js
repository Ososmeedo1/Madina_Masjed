import { notFound } from 'next/navigation';
import EditAttendanceClient from '@/components/attendance/EditAttendanceClient';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'تعديل الحضور' };

export default async function EditAttendancePage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-fA-F]{24}$/.test(id || '')) notFound();

  const initialToken =
    typeof sp?.token === 'string' && sp.token.length > 0
      ? sp.token
      : null;

  return <EditAttendanceClient attendanceId={id} initialToken={initialToken} />;
}
