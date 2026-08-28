import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/utils/auth';
import { getPaginatedDates } from '@/lib/services/history.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json({ message: 'غير مسجل الدخول' }, { status: 401 });
  }

  try {
    const page = parseInt(request.nextUrl.searchParams.get('page')) || 1;
    const limit = parseInt(request.nextUrl.searchParams.get('limit')) || 5;
    const result = await getPaginatedDates(page, Math.min(Math.max(limit, 1), 20));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err.status ? err.message : 'تعذر تحميل السجل' },
      { status: err.status ?? 500 }
    );
  }
}
