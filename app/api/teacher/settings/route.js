import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/utils/auth';
import { WEEKDAY_KEYS } from '@/lib/utils/group-status';
import { updateWeeklyHolidays } from '@/lib/services/groups.service';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json({ message: 'غير مسجل الدخول' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body.weeklyHolidays)) {
      return NextResponse.json(
        { message: 'قيمة أيام العطلة غير صالحة' },
        { status: 400 }
      );
    }
    const unique = [...new Set(body.weeklyHolidays)];
    if (!unique.every((d) => WEEKDAY_KEYS.includes(d))) {
      return NextResponse.json({ message: 'يوم غير معروف في أيام العطلة' }, { status: 400 });
    }

    const weeklyHolidays = await updateWeeklyHolidays(unique);
    return NextResponse.json({ weeklyHolidays });
  } catch {
    return NextResponse.json({ message: 'تعذر حفظ الإعدادات' }, { status: 500 });
  }
}
