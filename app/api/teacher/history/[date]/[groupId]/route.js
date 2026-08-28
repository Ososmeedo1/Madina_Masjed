import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/utils/auth';
import { getGroupDayDetail } from '@/lib/services/history.service';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json({ message: 'غير مسجل الدخول' }, { status: 401 });
  }

  try {
    const { date, groupId } = await params;
    return NextResponse.json(await getGroupDayDetail(date, groupId));
  } catch (err) {
    return NextResponse.json(
      { message: err.status ? err.message : 'تعذر تحميل السجل' },
      { status: err.status ?? 500 }
    );
  }
}
