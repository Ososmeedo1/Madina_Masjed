import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/utils/auth';
import { getDashboardSnapshot } from '@/lib/services/groups.service';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json({ message: 'غير مسجل الدخول' }, { status: 401 });
  }

  try {
    return NextResponse.json(await getDashboardSnapshot());
  } catch (err) {
    logger.error('teacher.groups', err && (err.stack || err.message));
    return NextResponse.json({ message: 'تعذر تحميل بيانات المجموعات' }, { status: 500 });
  }
}
