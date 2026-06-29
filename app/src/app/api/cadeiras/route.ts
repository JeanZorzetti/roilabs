import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public read: the static site fetches this live from the browser (cross-origin) to render
// the chair map, so it reflects /admin edits without a rebuild. Simple GET → no preflight,
// just needs the CORS allow-origin header for the browser to read the response.
export async function GET() {
  const seats = await prisma.cadeira.findMany({ orderBy: { ordem: 'asc' } });
  return NextResponse.json(seats, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
