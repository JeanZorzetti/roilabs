import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { CENARIOS } from '@/lib/centros-custo';

export const dynamic = 'force-dynamic';

// GET — returns global + all linhas (null fields = inherits from above layer).
export async function GET() {
  const rows = await prisma.parametroCentroCusto.findMany({
    orderBy: [{ escopo: 'asc' }, { chave: 'asc' }],
  });
  const global = rows.find((r) => r.escopo === 'global');
  const linhas = rows.filter((r) => r.escopo === 'linha');

  const toObj = (r: (typeof rows)[number]) => ({
    markup: r.markup !== null ? Number(r.markup) : null,
    comissao: r.comissao !== null ? Number(r.comissao) : null,
    aliqIntermediacao: r.aliqIntermediacao !== null ? Number(r.aliqIntermediacao) : null,
    aliqWL: r.aliqWL !== null ? Number(r.aliqWL) : null,
    cenario: r.cenario ?? null,
  });

  return NextResponse.json({
    global: global ? toObj(global) : null,
    linhas: linhas.map((r) => ({ chave: r.chave, ...toObj(r) })),
  });
}

// PATCH — upsert global or a linha. Server-side range validation (FR-003).
export async function PATCH(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const escopo = body.escopo;
  if (escopo !== 'global' && escopo !== 'linha') {
    return NextResponse.json({ ok: false, motivo: "escopo deve ser 'global' ou 'linha'" }, { status: 400 });
  }
  const chave = escopo === 'linha' ? (typeof body.chave === 'string' ? body.chave.trim() : null) : null;
  if (escopo === 'linha' && !chave) {
    return NextResponse.json({ ok: false, motivo: "chave é obrigatória para escopo='linha'" }, { status: 400 });
  }

  // Range validation (FR-003)
  const fields: Record<string, unknown> = {};
  if (body.markup !== undefined && body.markup !== null) {
    const v = Number(body.markup);
    if (!Number.isFinite(v) || v < 0) return NextResponse.json({ ok: false, motivo: 'markup deve ser ≥ 0' }, { status: 400 });
    fields.markup = v;
  } else if (body.markup === null) {
    fields.markup = null;
  }
  for (const key of ['comissao', 'aliqIntermediacao', 'aliqWL'] as const) {
    if (body[key] !== undefined && body[key] !== null) {
      const v = Number(body[key]);
      if (!Number.isFinite(v) || v < 0 || v > 1) {
        return NextResponse.json({ ok: false, motivo: `${key} deve estar em [0, 1]` }, { status: 400 });
      }
      fields[key] = v;
    } else if (body[key] === null) {
      fields[key] = null;
    }
  }

  // Cenario: preset fills aliquotas; manual override sets cenario='ajustado' (FR-013).
  if (typeof body.cenario === 'string') {
    const preset = CENARIOS[body.cenario];
    if (preset) {
      // Preset: fill aliquotas from preset values (only if not overridden in same request)
      if (fields.aliqIntermediacao === undefined) fields.aliqIntermediacao = preset.aliqIntermediacao;
      if (fields.aliqWL === undefined) fields.aliqWL = preset.aliqWL;
      fields.cenario = body.cenario;
    } else if (body.cenario === 'ajustado') {
      fields.cenario = 'ajustado';
    }
  }
  // If aliquotas were manually set without a preset, mark cenario='ajustado'
  if (
    (fields.aliqIntermediacao !== undefined || fields.aliqWL !== undefined) &&
    typeof body.cenario !== 'string'
  ) {
    fields.cenario = 'ajustado';
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ ok: false, motivo: 'nenhum campo para atualizar' }, { status: 400 });
  }

  // Find existing (findFirst avoids compound-unique-with-null issues)
  const existing = await prisma.parametroCentroCusto.findFirst({ where: { escopo, chave } });
  if (existing) {
    await prisma.parametroCentroCusto.update({ where: { id: existing.id }, data: fields });
  } else {
    await prisma.parametroCentroCusto.create({ data: { escopo, chave, ...fields } });
  }

  return NextResponse.json({ ok: true });
}

// DELETE — remove uma linha (?chave=...). Global não é deletável. deleteMany p/ idempotência.
// SKUs que apontavam p/ a linha herdam do global automaticamente (resolveField trata camada ausente).
export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const chave = req.nextUrl.searchParams.get('chave')?.trim();
  if (!chave) return NextResponse.json({ ok: false, motivo: 'chave é obrigatória' }, { status: 400 });
  await prisma.parametroCentroCusto.deleteMany({ where: { escopo: 'linha', chave } });
  return NextResponse.json({ ok: true });
}
