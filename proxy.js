import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE = 'masjed_token';
const DEV_FALLBACK_SECRET = new TextEncoder().encode('masjed-dev-secret-change-me');

const PROTECTED_PAGES = ['/dashboard', '/history', '/teacher/history'];
const PROTECTED_API = ['/api/teacher'];

function getSecret() {
  return process.env.JWT_SECRET
    ? new TextEncoder().encode(process.env.JWT_SECRET)
    : DEV_FALLBACK_SECRET;
}

async function isAuthed(token) {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return true;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    if (!sameOrigin(request)) {
      return NextResponse.json(
        { message: 'طلب غير مصرح به', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    if (PROTECTED_API.some((p) => pathname.startsWith(p))) {
      if (!(await isAuthed(request.cookies.get(AUTH_COOKIE)?.value))) {
        const res = NextResponse.json({ message: 'غير مصرح به', code: 'UNAUTHORIZED' }, { status: 401 });
        res.cookies.delete(AUTH_COOKIE);
        return res;
      }
    }

    return NextResponse.next();
  }

  if (pathname === '/login') {
    if (await isAuthed(request.cookies.get(AUTH_COOKIE)?.value)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  const needsAuth =
    PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (needsAuth && !(await isAuthed(request.cookies.get(AUTH_COOKIE)?.value))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/history/:path*',
    '/teacher/history/:path*',
    '/login',
  ],
};
