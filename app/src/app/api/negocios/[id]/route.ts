import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ESTAGIOS = ['repassado', 'aceito', 'ganho', 'perdido'];

// PATCH — avança estágio / ajusta isenção. Bloqueia edição se já vinculado a uma fatura.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.negocioOriginado.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, motivo: 'negócio não encontrado' }, { status: 404 });
  if (existing.faturaId) return NextResponse.json({ ok: false, motivo: 'negócio já faturado' }, { status: 409 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (body.estagio !== undefined) {
    if (typeof body.estagio !== 'string' || !ESTAGIOS.includes(body.estagio)) {
      return NextResponse.json({ ok: false, motivo: 'estágio inválido' }, { status: 400 });
    }
    data.estagio = body.estagio;
  }
  if (body.faturavel !== undefined) data.faturavel = body.faturavel === true;
  if (body.isencaoMotivo !== undefined) data.isencaoMotivo = body.isencaoMotivo || null;

  await prisma.negocioOriginado.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
