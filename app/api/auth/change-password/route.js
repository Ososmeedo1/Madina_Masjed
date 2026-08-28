import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import Teacher from '@/lib/models/Teacher';
import { getAuthFromRequest, verifyPassword, hashPassword } from '@/lib/utils/auth';
import { validateChangePasswordInput } from '@/lib/utils/validation';

export async function POST(request) {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json({ message: 'غير مسجل الدخول' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { ok, errors } = validateChangePasswordInput(body);
    if (!ok) {
      return NextResponse.json({ message: 'تحقق من الحقول', errors }, { status: 400 });
    }

    await dbConnect();
    const teacher = await Teacher.findById(payload.sub);
    if (!teacher || !teacher.isActive) {
      return NextResponse.json({ message: 'غير مسجل الدخول' }, { status: 401 });
    }

    const valid = await verifyPassword(body.currentPassword, teacher.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { message: 'كلمة المرور الحالية غير صحيحة', errors: { currentPassword: 'غير صحيحة' } },
        { status: 400 }
      );
    }

    teacher.passwordHash = await hashPassword(body.newPassword);
    await teacher.save();

    return NextResponse.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch {
    return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 });
  }
}
