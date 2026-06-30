import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPayment, verifyWebhookSignature } from '@/lib/mercadopago';
import { resolverParametros, resolverPiso, resolverModalidade, type CamadasConfig } from '@/lib/centros-custo';

export const dynamic = 'force-dynamic';

// Mercado Pago payment webhook (server-to-server, no CORS). Idempotent by mpPaymentId (D4).
export async function POST(req: NextRequest) {
  // data.id arrives as ?data.id= (query) or in the JSON body { data: { id } }.
  const url = req.nextUrl;
  let dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
  const type = url.searchParams.get('type') || url.searchParams.get('topic');

  let bodyType = type;
  if (!dataId) {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    dataId = (body as { data?: { id?: string } }).data?.id ?? null;
    bodyType = bodyType || (body as { type?: string }).type || null;
  }

  // Validate authenticity BEFORE touching any state (FR-008).
  if (
    !verifyWebhookSignature({
      xSignature: req.headers.get('x-signature'),
      xRequestId: req.headers.get('x-request-id'),
      dataId,
    })
  ) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  // We only care about payment notifications.
  if (bodyType && bodyType !== 'payment') return NextResponse.json({ ok: true });
  if (!dataId) return NextResponse.json({ ok: true });

  // MP is the source of truth for status — never trust the notification body.
  const payment = await getPayment(dataId);
  if (!payment.externalReference) return NextResponse.json({ ok: true });

  const pedido = await prisma.pedido.findUnique({ where: { id: payment.externalReference } });
  if (!pedido) return NextResponse.json({ ok: true });

  const paymentId = String(payment.id);

  // Idempotent: this payment already recorded and not pending → no-op.
  if (pedido.mpPaymentId === paymentId && pedido.statusPagamento !== 'pendente') {
    return NextResponse.json({ ok: true });
  }

  if (payment.status === 'approved') {
    // Advance only (never pago → pendente). Reserva: fulfillment stays "aguardando" (FR-012).
    if (pedido.statusPagamento === 'pendente') {
      // Freeze per-item snapshot of cost-center params at payment time (US4 / FR-010).
      // Load all DB layers once for the whole order, then resolve per slug.
      const [paramRows, skuRows] = await Promise.all([
        prisma.parametroCentroCusto.findMany(),
        prisma.itemPedido.findMany({ where: { pedidoId: pedido.id }, select: { id: true, slug: true, subtotal: true } }),
      ]);
      const globalRow = paramRows.find((r) => r.escopo === 'global') ?? null;
      const linhaRows = paramRows.filter((r) => r.escopo === 'linha');
      const skuConfigs = await prisma.skuConfig.findMany({ where: { slug: { in: skuRows.map((i) => i.slug) } } });

      const toNum = (v: unknown): number | null => (v != null ? Number(v) : null);
      const globalParams = globalRow
        ? { markup: toNum(globalRow.markup), comissao: toNum(globalRow.comissao), aliqIntermediacao: toNum(globalRow.aliqIntermediacao), aliqWL: toNum(globalRow.aliqWL) }
        : null;
      const linhasMap = new Map(linhaRows.map((r) => [r.chave, { markup: toNum(r.markup), comissao: toNum(r.comissao), aliqIntermediacao: toNum(r.aliqIntermediacao), aliqWL: toNum(r.aliqWL) }]));
      const skuMap = new Map(skuConfigs.map((r) => [r.slug, { piso: toNum(r.piso), modalidadeAlvo: r.modalidadeAlvo ?? null, linha: r.linha ?? null, markup: toNum(r.markup), comissao: toNum(r.comissao), aliqIntermediacao: toNum(r.aliqIntermediacao), aliqWL: toNum(r.aliqWL) }]));

      await prisma.$transaction([
        prisma.pedido.update({
          where: { id: pedido.id },
          data: { statusPagamento: 'pago', mpPaymentId: paymentId },
        }),
        ...skuRows.map((item) => {
          const skuCfg = skuMap.get(item.slug) ?? null;
          const linhaNome = skuCfg?.linha ?? null;
          const linhaCfg = linhaNome ? (linhasMap.get(linhaNome) ?? null) : null;
          const camadas: CamadasConfig = { sku: skuCfg, linha: linhaCfg, global: globalParams };
          const p = resolverParametros(camadas);
          const { piso } = resolverPiso(Number(item.subtotal), camadas);
          const modalidade = resolverModalidade(camadas);
          return prisma.itemPedido.update({
            where: { id: item.id },
            data: {
              pisoSnapshot: piso,
              modalidadeSnapshot: modalidade,
              comissaoSnapshot: p.comissao,
              aliqIntermediacaoSnapshot: p.aliqIntermediacao,
              aliqWLSnapshot: p.aliqWL,
            },
          });
        }),
      ]);
    }
  } else if (payment.status === 'refunded' || payment.status === 'charged_back') {
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { statusPagamento: 'reembolsado', statusFulfillment: 'reembolsado', mpPaymentId: paymentId },
    });
  }
  // pending/in_process/rejected/cancelled → keep pendente (cart preserved).

  return NextResponse.json({ ok: true });
}
