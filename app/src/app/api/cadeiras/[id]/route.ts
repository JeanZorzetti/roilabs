import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: { status?: string; open?: boolean; niche?: string } = {};
  if (typeof body.status === 'string') data.status = body.status.trim().slice(0, 120);
  if (typeof body.open === 'boolean') data.open = body.open;
  if (typeof body.niche === 'string') data.niche = body.niche.trim().slice(0, 200);
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'nada para atualizar' }, { status: 400 });
  }

  const updated = await prisma.cadeira.update({ where: { id }, data });
  return NextResponse.json(updated);
}
