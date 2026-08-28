import { NextResponse } from 'next/server';
import { createFirstTeacher } from '@/lib/services/teacher.service';
import { signAuthToken, AUTH_COOKIE, authCookieOptions } from '@/lib/utils/auth';
import { validateSetupInput } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { isRateLimited, recordFailure, clearFailures } from '@/lib/utils/rate-limit';

function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : 'local';
}

export async function POST(request) {
  const rlKey = 'setup:' + clientIp(request);
  if (await isRateLimited(rlKey, { max: 5 })) {
    return NextResponse.json({ message: 'محاولات إعداد كثيرة، حاول لاحقًا' }, { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { ok, errors } = validateSetupInput(body);
    if (!ok) {
      return NextResponse.json({ message: 'تحقق من الحقول المطلوبة', errors }, { status: 400 });
    }

    const teacher = await createFirstTeacher(body);
    const token = signAuthToken({
      sub: teacher._id.toString(),
      email: teacher.email,
      role: teacher.role,
    });

    const res = NextResponse.json({ teacher: teacher.toJSON() }, { status: 201 });
    await clearFailures(rlKey);
    res.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return res;
  } catch (err) {
    if ((err.status ?? (err.code === 11000 ? 409 : 500)) >= 500) logger.error('setup', { message: err.message });
    if (err.code === 11000) {
      return NextResponse.json(
        { message: 'هذا البريد الإلكتروني مسجل مسبقاً' },
        { status: 409 }
      );
    }
    const status = err.status ?? 500;
    const message = err.status ? err.message : 'خطأ في الخادم، حاول مرة أخرى';
    return NextResponse.json({ message }, { status });
  }
}
