import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { normalizarCampos, validarCupomData, type CupomData } from './_validacao';

export const dynamic = 'force-dynamic';

const EMPTY: CupomData = {
  codigo: '',
  tipo: '',
  valor: NaN,
  validadeInicio: null,
  validadeFim: null,
  minimo: null,
  ativo: true,
};

// GET — lista todos os cupons (tela /admin/cupons). Só admin.
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const rows = await prisma.cupom.findMany({ orderBy: { codigo: 'asc' } });
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      tipo: r.tipo,
      valor: Number(r.valor),
      validadeInicio: r.validadeInicio,
      validadeFim: r.validadeFim,
      minimo: r.minimo !== null ? Number(r.minimo) : null,
      ativo: r.ativo,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  );
}

// POST — cria um cupom. Validação server-side completa (FR-012).
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = normalizarCampos(body, EMPTY);
  if ('motivo' in parsed) return NextResponse.json(parsed, { status: parsed.status });

  const check = await validarCupomData(parsed);
  if (!check.ok) return NextResponse.json(check, { status: check.status });

  const created = await prisma.cupom.create({
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

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
