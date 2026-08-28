import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentRecord } from '@/lib/services/attendance.service';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { groupKey } = await params;
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('att_tokens')?.value;
    if (!raw) {
      return NextResponse.json({ record: null }, { status: 200 });
    }

    let tokens;
    try {
      tokens = JSON.parse(raw);
    } catch {
      return NextResponse.json({ record: null }, { status: 200 });
    }

    const token = tokens[groupKey];
    if (!token) {
      return NextResponse.json({ record: null }, { status: 200 });
    }

    const result = await getCurrentRecord(groupKey, token);
    if (!result) {
      return NextResponse.json({ record: null }, { status: 200 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ record: null }, { status: 200 });
  }
}
