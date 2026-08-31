import { isAuthed } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { linhasPorPedido, type ItemPagoInput } from '@/lib/financeiro';
import { log } from '@/lib/log';

const MES_RE = /^\d{4}-\d{2}$/;

function fmtNum(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const toNum = (v: unknown): number | null => (v !== null && v !== undefined ? Number(v) : null);

export async function GET(req: Request): Promise<Response> {
  if (!(await isAuthed())) {
    return new Response(JSON.stringify({ ok: false }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const de = searchParams.get('de');
  const ate = searchParams.get('ate');

  if ((de && !MES_RE.test(de)) || (ate && !MES_RE.test(ate))) {
    return new Response(JSON.stringify({ ok: false, motivo: 'de/ate devem ser YYYY-MM' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const [paramRows, skuRows, itensPagosRaw] = await Promise.all([
    prisma.parametroCentroCusto.findMany(),
    prisma.skuConfig.findMany({ select: { slug: true, modalidadeAlvo: true } }),
    prisma.itemPedido.findMany({
      where: { pedido: { statusPagamento: 'pago' } },
      select: {
        pedidoId: true,
        slug: true,
        subtotal: true,
        pisoSnapshot: true,
        modalidadeSnapshot: true,
        comissaoSnapshot: true,
        aliqIntermediacaoSnapshot: true,
        aliqWLSnapshot: true,
        pedido: { select: { createdAt: true } },
      },
    }),
  ]);

  const globalRow = paramRows.find((r) => r.escopo === 'global') ?? null;
  const globalParams = globalRow
    ? {
        markup: toNum(globalRow.markup),
        comissao: toNum(globalRow.comissao),
        aliqIntermediacao: toNum(globalRow.aliqIntermediacao),
        aliqWL: toNum(globalRow.aliqWL),
      }
    : null;

  const skuMap = new Map(skuRows.map((r) => [r.slug, r.modalidadeAlvo]));

  const itens: ItemPagoInput[] = itensPagosRaw.map((it) => ({
    pedidoId: it.pedidoId,
    createdAt: it.pedido.createdAt,
    subtotal: Number(it.subtotal),
    pisoSnapshot: it.pisoSnapshot !== null ? Number(it.pisoSnapshot) : null,
    modalidadeSnapshot: it.modalidadeSnapshot,
    comissaoSnapshot: it.comissaoSnapshot !== null ? Number(it.comissaoSnapshot) : null,
    aliqIntermediacaoSnapshot:
      it.aliqIntermediacaoSnapshot !== null ? Number(it.aliqIntermediacaoSnapshot) : null,
    aliqWLSnapshot: it.aliqWLSnapshot !== null ? Number(it.aliqWLSnapshot) : null,
    slug: it.slug,
    skuModalidadeAlvo: skuMap.get(it.slug) ?? null,
  }));

  const itensFiltrados = itens.filter((it) => {
    const mes = it.createdAt.toISOString().slice(0, 7);
    if (de && mes < de) return false;
    if (ate && mes > ate) return false;
    return true;
  });

  const linhas = linhasPorPedido(itensFiltrados, globalParams).sort((a, b) =>
    a.data.localeCompare(b.data),
  );

  const periodo =
    de && ate ? `${de}_${ate}` : de ? `de-${de}` : ate ? `ate-${ate}` : 'todos';
  const filename = `roilabs-financeiro-${periodo}.csv`;

  // Trilha de auditoria: exportação de dado financeiro bruto (GMV/líquido por pedido)
  // saindo do sistema — quem gerou e qual período, não os valores em si (já vão no CSV).
  log.info({ de, ate, linhas: linhas.length }, 'financeiro/csv: exportado');

  const BOM = '﻿';
  const header = 'data;pedido_id;gmv;modalidade;liquido\r\n';
  const rows = linhas
    .map((l) => `${l.data};${l.pedidoId};${fmtNum(l.gmv)};${l.modalidade};${fmtNum(l.liquido)}`)
    .join('\r\n');

  return new Response(BOM + header + rows, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
