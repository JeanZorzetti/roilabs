import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';

// Consumer-lead lifecycle: 'novo' feeds the follow-up queue, the rest clears it.
const STATUSES = new Set(['novo', 'contatado', 'convertido', 'perdido']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (typeof body.status !== 'string' || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 });
  }

  const updated = await prisma.leadConsumidor
    .update({ where: { id }, data: { status: body.status } })
    .catch(() => null);
  if (!updated) return NextResponse.json({ error: 'lead não encontrado' }, { status: 404 });
  return NextResponse.json(updated);
}
