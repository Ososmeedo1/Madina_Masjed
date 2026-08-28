import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import Group from '@/lib/models/Group';
import { getAttendancePageData } from '@/lib/services/attendance.service';
import AttendanceClient from '@/components/attendance/AttendanceClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  try {
    const { groupKey } = await params;
    await dbConnect();
    const group = await Group.findOne({ key: groupKey }).lean();
    return { title: group ? group.name : 'الحضور' };
  } catch {
    return { title: 'الحضور' };
  }
}

export default async function AttendanceGroupPage({ params }) {
  const { groupKey } = await params;
  let snapshot = null;
  try {
    snapshot = await getAttendancePageData(groupKey);
  } catch {
    snapshot = null;
  }

  if (!snapshot) notFound();

  return <AttendanceClient initial={snapshot} />;
}
