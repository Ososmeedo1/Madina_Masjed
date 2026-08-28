import { NextResponse } from 'next/server';
import { getAttendancePageData } from '@/lib/services/attendance.service';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { groupKey } = await params;
    const data = await getAttendancePageData(groupKey);
    if (!data) {
      return NextResponse.json({ message: 'المجموعة غير موجودة' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    logger.error('attendance.page', err && (err.stack || err.message));
    return NextResponse.json({ message: 'تعذر تحميل البيانات' }, { status: 500 });
  }
}
