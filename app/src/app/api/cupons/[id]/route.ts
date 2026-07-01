import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { normalizarCampos, validarCupomData } from '../_validacao';

export const dynamic = 'force-dynamic';

// PATCH — edita um cupom existente. Unicidade de código ignora o próprio id (FR-012).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.cupom.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, motivo: 'cupom não encontrado' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = normalizarCampos(body, {
    codigo: existing.codigo,
    tipo: existing.tipo,
    valor: Number(existing.valor),
    validadeInicio: existing.validadeInicio,
    validadeFim: existing.validadeFim,
    minimo: existing.minimo !== null ? Number(existing.minimo) : null,
    ativo: existing.ativo,
  });
  if ('motivo' in parsed) return NextResponse.json(parsed, { status: parsed.status });

  const check = await validarCupomData(parsed, id);
  if (!check.ok) return NextResponse.json(check, { status: check.status });

  await prisma.cupom.update({
    where: { id },
    data: {
      codigo: parsed.codigo,
      tipo: parsed.tipo,
      valor: parsed.valor,
      validadeInicio: parsed.validadeInicio,
      validadeFim: parsed.validadeFim,
      minimo: parsed.minimo,
      ativo: parsed.ativo,
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — apaga (hard delete). Idempotente; pedidos passados intactos (snapshot).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;
  await prisma.cupom.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
