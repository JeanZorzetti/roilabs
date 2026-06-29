import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { isLeadStatus } from '@/lib/status';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (!isLeadStatus(body.status)) {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 });
  }

  const updated = await prisma.candidatura.update({ where: { id }, data: { status: body.status } });
  return NextResponse.json(updated);
}
