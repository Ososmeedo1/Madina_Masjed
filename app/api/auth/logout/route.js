import { NextResponse } from 'next/server';
import { AUTH_COOKIE, authCookieOptions } from '@/lib/utils/auth';

export async function POST() {
  const res = NextResponse.json({ message: 'تم تسجيل الخروج' });
  res.cookies.set(AUTH_COOKIE, '', authCookieOptions(0));
  return res;
}
