import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { registerStudent } from '@/lib/services/attendance.service';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

async function setAttendanceCookie(groupKey, token) {
  const cookieStore = await cookies();
  let tokens = {};
  try {
    tokens = JSON.parse(cookieStore.get('att_tokens')?.value || '{}');
  } catch {}
  tokens[groupKey] = token;
  cookieStore.set('att_tokens', JSON.stringify(tokens), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function POST(request, { params }) {
  const { groupKey } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const result = await registerStudent(groupKey, body);

    if (result.invalid) {
      return NextResponse.json(
        { message: 'تحقق من الحقول المطلوبة', errors: result.errors, code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    if (result.duplicateId !== undefined) {
      const statusLabel = result.recordStatus === 'absent' ? 'غياب' : result.recordStatus === 'listener' ? 'استماع' : 'حضور';
      return NextResponse.json(
        {
          message: `أنت مسجل ${statusLabel} اليوم بالفعل`,
          attendanceId: result.duplicateId,
          recordStatus: result.recordStatus,
          code: 'ALREADY_REGISTERED',
        },
        { status: 409 }
      );
    }

    if (result.conflictId !== undefined) {
      const existingLabel = result.recordStatus === 'present' ? 'حضور' : result.recordStatus === 'listener' ? 'استماع' : 'غياب';
      const targetLabel = result.recordStatus === 'present' ? 'غياب أو استماع' : result.recordStatus === 'listener' ? 'حضور أو غياب' : 'حضور أو استماع';
      return NextResponse.json(
        {
          message: `أنت مسجل ${existingLabel} اليوم، هل تريد التحويل إلى ${targetLabel}؟`,
          attendanceId: result.conflictId,
          recordStatus: result.recordStatus,
          code: 'STATUS_CONFLICT',
        },
        { status: 409 }
      );
    }

    const { record, editToken, converted } = result;
    const statusLabel = record.status === 'absent' ? 'غياب' : record.status === 'listener' ? 'استماع' : 'حضور';

    await setAttendanceCookie(groupKey, editToken);

    return NextResponse.json(
      {
        message: converted
          ? `تم تحويل السجل إلى ${statusLabel}`
          : `تم تسجيل ${statusLabel}ك بنجاح`,
        entry: record.toJSON(),
        editToken,
        converted: Boolean(converted),
      },
      { status: converted ? 200 : 201 }
    );
  } catch (err) {
    if ((err.status ?? 500) >= 500) logger.error('register', { groupKey, message: err.message });
    const status = err.status ?? 500;
    return NextResponse.json(
      {
        message: err.status ? err.message : 'تعذر التسجيل، حاول مرة أخرى',
        errors: err.errors,
        attendanceId: err.attendanceId,
        code: err.code,
      },
      { status }
    );
  }
}
