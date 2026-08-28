import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/utils/auth';
import { updateGroup } from '@/lib/services/groups.service';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const payload = getAuthFromRequest(request);
  if (!payload) {
    return NextResponse.json({ message: 'غير مسجل الدخول', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const { groupId } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await updateGroup(groupId, body);

    if (result.notFound) {
      return NextResponse.json({ message: result.message, code: result.code }, { status: 404 });
    }
    if (result.invalid || result.conflict) {
      return NextResponse.json({ message: result.message, code: result.code }, { status: 400 });
    }

    return NextResponse.json({ group: result.toJSON() });
  } catch (err) {
    logger.error('teacher.groups.patch', err && (err.stack || err.message));
    return NextResponse.json(
      { message: 'تعذر تحديث المجموعة', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
