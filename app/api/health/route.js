import { NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/utils/auth';
import { isValidDateString } from '@/lib/utils/timezone';
import { logger } from '@/lib/utils/logger';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  let db = 'down';
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 1500 });
    db = 'up';
  } catch {
    db = 'down';
  } finally {
    try { await mongoose.disconnect(); } catch {}
  }

  const healthy = db === 'up';
  if (!healthy) logger.error('health', { db });

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      db,
      time: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    },
    { status: healthy ? 200 : 503 }
  );
}
