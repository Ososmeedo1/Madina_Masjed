import { NextResponse } from 'next/server';
import { getAttendanceEditData, updateAttendanceWithToken } from '@/lib/services/attendance.service';
import { isRateLimited, recordFailure, clearFailures } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_FAILURES = 8;
const RATE_WINDOW_MS = 15 * 60 * 1000;

function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : 'local';
}

function failResponse(status, message, extra = {}) {
  return NextResponse.json({ message, ...extra }, { status });
}

export async function GET(request, { params }) {
  const { attendanceId } = await params;
  const id = attendanceId;
  const rlKey = `edit:${clientIp(request)}:${id}`;

  if (await isRateLimited(rlKey, { max: MAX_FAILURES })) {
    return failResponse(429, 'محاولات كثيرة، انتظر قليلاً ثم أعد المحاولة');
  }

  try {
    const token = request.nextUrl.searchParams.get('token') || '';
    const data = await getAttendanceEditData(id, token);
    clearFailures(rlKey);
    return NextResponse.json(data);
  } catch (err) {
    if (err.status === 401) recordFailure(rlKey, { windowMs: RATE_WINDOW_MS });
    return failResponse(err.status ?? 500, err.status ? err.message : 'تعذر تحميل السجل');
  }
}

export async function PATCH(request, { params }) {
  const { attendanceId } = await params;
  const id = attendanceId;
  const rlKey = `edit:${clientIp(request)}:${id}`;

  if (await isRateLimited(rlKey, { max: MAX_FAILURES })) {
    return failResponse(429, 'محاولات كثيرة، انتظر قليلاً ثم أعد المحاولة');
  }

  try {
    const body = await request.json().catch(() => ({}));
    const token = body.token || '';
    delete body.token;

    const { record, newToken } = await updateAttendanceWithToken(id, token, body);
    clearFailures(rlKey);

    return NextResponse.json({
      message: newToken
        ? record.status === 'absent'
          ? 'تم تحويل السجل إلى غياب'
          : 'تم تحويل السجل إلى حضور'
        : 'تم تحديث السجل بنجاح',
      entry: record.toJSON(),
      editToken: newToken || undefined,
      converted: Boolean(newToken),
    });
  } catch (err) {
    if (err.status === 401) recordFailure(rlKey, { windowMs: RATE_WINDOW_MS });
    return failResponse(
      err.status ?? 500,
      err.status ? err.message : 'تعذر تحديث السجل',
      err.errors ? { errors: err.errors } : {}
    );
  }
}
