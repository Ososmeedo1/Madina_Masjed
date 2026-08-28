import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import Teacher from '@/lib/models/Teacher';
import { verifyPassword, signAuthToken, AUTH_COOKIE, authCookieOptions } from '@/lib/utils/auth';
import { validateLoginInput } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';
import { isRateLimited, recordFailure, clearFailures } from '@/lib/utils/rate-limit';

const LOGIN_MAX_FAILURES = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : 'local';
}

export async function POST(request) {
  const rlKey = `login:${clientIp(request)}`;

  if (await isRateLimited(rlKey, { max: LOGIN_MAX_FAILURES })) {
    return NextResponse.json({ message: 'محاولات دخول كثيرة، انتظر ربع ساعة ثم أعد المحاولة', code: 'RATE_LIMITED' }, { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { ok, errors } = validateLoginInput(body);
    if (!ok) {
      return NextResponse.json({ message: 'تحقق من الحقول', errors }, { status: 400 });
    }

    await dbConnect();
    const teacher = await Teacher.findByEmail(body.email);
    const valid = teacher && (await verifyPassword(body.password, teacher.passwordHash));

    if (!valid) {
      await recordFailure(rlKey, { windowMs: LOGIN_WINDOW_MS });
      return NextResponse.json(
        { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    if (!teacher.isActive) {
      return NextResponse.json({ message: 'الحساب معطل', code: 'UNAUTHORIZED' }, { status: 403 });
    }

    await clearFailures(rlKey);
    teacher.lastLoginAt = new Date();
    await teacher.save();

    const token = signAuthToken({
      sub: teacher._id.toString(),
      email: teacher.email,
      role: teacher.role,
    });

    const res = NextResponse.json({ teacher: teacher.toJSON() });
    res.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return res;
  } catch (err) {
    logger.error('login', { message: err && err.message });
    return NextResponse.json({ message: 'خطأ في الخادم، حاول مرة أخرى' }, { status: 500 });
  }
}
