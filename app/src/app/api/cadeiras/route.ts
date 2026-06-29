import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public read so the site can eventually fetch the live chair map instead of the hard-coded array.
export async function GET() {
  const seats = await prisma.cadeira.findMany({ orderBy: { ordem: 'asc' } });
  return NextResponse.json(seats);
}
