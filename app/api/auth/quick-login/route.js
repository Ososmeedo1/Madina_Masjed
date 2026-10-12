import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import Teacher from '@/lib/models/Teacher';
import { createFirstTeacher } from '@/lib/services/teacher.service';
import { signAuthToken, AUTH_COOKIE, authCookieOptions } from '@/lib/utils/auth';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

const QUICK_EMAIL = process.env.QUICK_LOGIN_EMAIL || 'admin@local.test';
const QUICK_PASSWORD = process.env.QUICK_LOGIN_PASSWORD || 'Admin1234';

function isQuickLoginEnabled() {
  if (process.env.ENABLE_QUICK_LOGIN === 'true') return true;
  if (process.env.ENABLE_QUICK_LOGIN === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

/**
 * POST /api/auth/quick-login — dev/demo shortcut that enters the project
 * without typing credentials.
 * - No teachers yet: creates default admin + default groups, then logs in.
 * - Teachers exist: logs in as the first teacher (oldest account).
 * Disabled in production unless ENABLE_QUICK_LOGIN=true.
 */
export async function POST() {
  if (!isQuickLoginEnabled()) {
    return NextResponse.json({ message: 'الدخول السريع غير متاح' }, { status: 404 });
  }

  try {
    await dbConnect();

    let teacher = null;
    let isNew = false;

    const count = await Teacher.countDocuments();
    if (count === 0) {
      teacher = await createFirstTeacher({ email: QUICK_EMAIL, password: QUICK_PASSWORD });
      isNew = true;
    } else {
      teacher = await Teacher.findOne().sort({ createdAt: 1 });
      if (!teacher) {
        return NextResponse.json({ message: 'تعذر الدخول السريع' }, { status: 500 });
      }
      if (!teacher.isActive) {
        return NextResponse.json({ message: 'الحساب معطل' }, { status: 403 });
      }
      teacher.lastLoginAt = new Date();
      await teacher.save();
    }

    const token = signAuthToken({
      sub: teacher._id.toString(),
      email: teacher.email,
      role: teacher.role,
    });

    const res = NextResponse.json({ teacher: teacher.toJSON(), isNew });
    res.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return res;
  } catch (err) {
    logger.error('quick-login', { message: err && err.message });
    return NextResponse.json({ message: 'تعذر الدخول السريع، حاول مرة أخرى' }, { status: 500 });
  }
}
