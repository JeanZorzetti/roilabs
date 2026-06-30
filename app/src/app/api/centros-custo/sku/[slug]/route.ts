import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { getProduto } from '@/lib/precos';

export const dynamic = 'force-dynamic';

// PATCH — upsert sku_config for a slug. null clears the field (reverts to inherit/estimate).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });

  const { slug } = await params;
  const produto = getProduto(slug);
  if (!produto) {
    return NextResponse.json({ ok: false, motivo: `slug '${slug}' não existe no catálogo` }, { status: 400 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  // piso: >= 0 or null (clears)
  if (body.piso !== undefined) {
    if (body.piso === null) {
      data.piso = null;
    } else {
      const v = Number(body.piso);
      if (!Number.isFinite(v) || v < 0) {
        return NextResponse.json({ ok: false, motivo: 'piso deve ser ≥ 0' }, { status: 400 });
      }
      data.piso = v;
    }
  }

  // modalidadeAlvo: 'wl'|'intermediacao'|null
  if (body.modalidadeAlvo !== undefined) {
    if (body.modalidadeAlvo === null) {
      data.modalidadeAlvo = null;
    } else if (body.modalidadeAlvo === 'wl' || body.modalidadeAlvo === 'intermediacao') {
      data.modalidadeAlvo = body.modalidadeAlvo;
    } else {
      return NextResponse.json({ ok: false, motivo: "modalidadeAlvo deve ser 'wl', 'intermediacao' ou null" }, { status: 400 });
    }
  }

  // linha: string or null
  if (body.linha !== undefined) {
    data.linha = body.linha === null ? null : String(body.linha).trim() || null;
  }

  // param overrides: same ranges as /parametros
  if (body.markup !== undefined) {
    if (body.markup === null) {
      data.markup = null;
    } else {
      const v = Number(body.markup);
      if (!Number.isFinite(v) || v < 0) return NextResponse.json({ ok: false, motivo: 'markup deve ser ≥ 0' }, { status: 400 });
      data.markup = v;
    }
  }
  for (const key of ['comissao', 'aliqIntermediacao', 'aliqWL'] as const) {
    if (body[key] !== undefined) {
      if (body[key] === null) {
        data[key] = null;
      } else {
        const v = Number(body[key]);
        if (!Number.isFinite(v) || v < 0 || v > 1) {
          return NextResponse.json({ ok: false, motivo: `${key} deve estar em [0, 1]` }, { status: 400 });
        }
        data[key] = v;
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, motivo: 'nenhum campo para atualizar' }, { status: 400 });
  }

  const existing = await prisma.skuConfig.findUnique({ where: { slug } });
  if (existing) {
    await prisma.skuConfig.update({ where: { slug }, data });
  } else {
    await prisma.skuConfig.create({ data: { slug, ...data } });
  }

  // Detect prejuizo: check if the resolved piso > varejo (FR-008)
  const pisoValue = data.piso !== undefined ? (data.piso as number | null) : (existing?.piso ? Number(existing.piso) : null);
  const prejuizo = pisoValue !== null && pisoValue > produto.preco;

  return NextResponse.json({ ok: true, prejuizo });
}
