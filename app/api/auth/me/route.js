import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import Teacher from '@/lib/models/Teacher';
import { getAuthFromRequest } from '@/lib/utils/auth';

export async function GET(request) {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json({ message: 'غير مسجل الدخول' }, { status: 401 });
  }

  try {
    await dbConnect();
    const teacher = await Teacher.findById(payload.sub);
    if (!teacher || !teacher.isActive) {
      return NextResponse.json({ message: 'غير مسجل الدخول' }, { status: 401 });
    }
    return NextResponse.json({ teacher: teacher.toJSON() });
  } catch {
    return NextResponse.json({ message: 'خطأ في الخادم' }, { status: 500 });
  }
}
