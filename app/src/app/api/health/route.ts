import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

// Uptime probe (cron-job.org): one unauthenticated call proves app + DB.
// Returns no data — just 200/503 — so it's safe to expose publicly.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    // The probe answers 503 either way; without this the DB error was silently dropped,
    // leaving nothing to explain WHY uptime went red.
    log.error({ err }, 'health: DB inacessível');
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
