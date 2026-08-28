import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/utils/auth';
import { logger } from '@/lib/utils/logger';
import {
  getAbsenceStatus,
  markTeacherAbsent,
  cancelTeacherAbsentToday,
} from '@/lib/services/absence.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json(
      { message: 'غير مصرح به', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json(await getAbsenceStatus());
  } catch (err) {
    if ((err.status ?? 500) >= 500) logger.error('absence.status', err && (err.stack || err.message));
    return NextResponse.json({ message: 'تعذر تحميل حالة الغياب' }, { status: 500 });
  }
}

export async function POST(request) {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json(
      { message: 'غير مصرح به', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));

    if (body.action === 'mark') {
      await markTeacherAbsent(payload.sub);
      return NextResponse.json({
        absent: true,
        message: 'تم تحديد غياب المعلم اليوم',
      });
    }

    if (body.action === 'cancel') {
      await cancelTeacherAbsentToday();
      return NextResponse.json({
        absent: false,
        message: 'تم إلغاء غياب المعلم',
      });
    }

    return NextResponse.json({ message: 'إجراء غير معروف' }, { status: 400 });
  } catch (err) {
    logger.error('absence.toggle', err && (err.stack || err.message));
    return NextResponse.json({ message: 'تعذر تحديث حالة الغياب' }, { status: 500 });
  }
}
