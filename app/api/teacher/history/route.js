import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/utils/auth';
import { parseHijriIso } from '@/lib/utils/hijri-date';
import { getDateSummary, getAvailableDates } from '@/lib/services/history.service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json({ message: 'غير مسجل الدخول' }, { status: 401 });
  }

  try {
    const date = request.nextUrl.searchParams.get('date');

    if (date) {
      if (!parseHijriIso(date)) {
        return NextResponse.json({ message: 'صيغة التاريخ الهجري يجب أن تكون YYYY-MM-DD' }, { status: 400 });
      }
      return NextResponse.json(await getDateSummary(date));
    }

    return NextResponse.json({ dates: await getAvailableDates() });
  } catch (err) {
    console.error('[hist]', err && (err.stack || err.message));
    return NextResponse.json(
      { message: err.status ? err.message : 'تعذر تحميل السجل' },
      { status: err.status ?? 500 }
    );
  }
}
