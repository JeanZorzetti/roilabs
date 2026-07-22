import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPayment, verifyWebhookSignature } from '@/lib/mercadopago';
import { resolverParametros, resolverPiso, resolverModalidade, type CamadasConfig } from '@/lib/centros-custo';
import { sendEmail, sendAlert, escapeHtml } from '@/lib/email';
import { log } from '@/lib/log';

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
    // Either MP_WEBHOOK_SECRET drifted from the MP panel (payments silently stop being
    // recorded) or someone is forging notifications. Both are worth seeing.
    log.warn({ dataId, type: bodyType }, 'webhook: assinatura inválida');
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
        prisma.itemPedido.findMany({ where: { pedidoId: pedido.id }, select: { id: true, slug: true, subtotal: true, caixas: true } }),
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

      // The single most valuable line in the log: an order actually got paid and the
      // snapshot committed. If MP shows a payment with no matching line here, the
      // webhook broke between getPayment and this transaction.
      log.info({ pedidoId: pedido.id, paymentId, total: pedido.total }, 'webhook: pedido pago');

      // Pós-pagamento (fire-and-forget, nunca quebra o webhook): confirmação ao
      // cliente (recibo nosso, além do MP) + alerta interno de pedido novo.
      const brl = (v: unknown) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      // 011: pedido de fita não tem linha em ItemPedido — sem isto o comprador recebe
      // uma confirmação com a lista de itens VAZIA.
      const fitaRows =
        pedido.vertical === 'fitas'
          ? await prisma.itemPedidoFita.findMany({ where: { pedidoId: pedido.id }, select: { slug: true, rolos: true, subtotal: true } })
          : [];
      const itensHtml = [
        ...skuRows.map((i) => `<li>${escapeHtml(i.slug)} — ${i.caixas} caixa(s) · ${brl(i.subtotal)}</li>`),
        ...fitaRows.map((i) =>
          i.slug === 'cliche-arte'
            ? `<li>Clichê da arte personalizada · ${brl(i.subtotal)}</li>`
            : `<li>${escapeHtml(i.slug)} — ${i.rolos} rolo(s) · ${brl(i.subtotal)}</li>`,
        ),
      ].join('');
      const ehFitas = pedido.vertical === 'fitas';
      // 011.1: pedido com arte precisa que o cliente ENVIE a logo — a arte é coletada
      // pelo WhatsApp após o pagamento (não há campo de upload no checkout). Deriva do
      // que foi persistido: a personalizada no pedido e se o clichê foi cobrado (arte nova)
      // ou isento (recorrente).
      const temPersonalizada = fitaRows.some((i) => i.slug === 'fita-transparente-personalizada');
      const clicheCobrado = fitaRows.some((i) => i.slug === 'cliche-arte');
      const WA = 'https://wa.me/5562993265713';
      if (pedido.email) {
        sendEmail(
          pedido.email,
          ehFitas ? 'Pedido confirmado — fitas adesivas | ROI Labs' : 'Pedido confirmado — porcelanato Goiânia | ROI Labs',
          `<p>Olá, ${escapeHtml(pedido.nome)}!</p>
           <p>Recebemos a confirmação do seu pagamento. Seu pedido está reservado e o
           ${ehFitas ? 'fabricante já foi acionado' : 'fornecedor do polo de Goiânia já foi acionado'}.</p>
           <ul>${itensHtml}</ul>
           <p><strong>Total: ${brl(pedido.total)}</strong>${pedido.frete != null ? ` (frete incluso: ${brl(pedido.frete)})` : ' (frete a combinar)'}</p>
           ${
             temPersonalizada
               ? `<p><strong>Sua fita é personalizada.</strong> Para produzir, precisamos da sua arte/logo
                  em alta resolução (PDF, PNG ou AI). Responda este e-mail ou nos chame no
                  <a href="${WA}">WhatsApp (62) 99326-5713</a> com o arquivo.
                  ${clicheCobrado ? 'O clichê da sua arte já está incluso neste pedido.' : 'Como você já produziu esta arte conosco, não há novo clichê.'}</p>`
               : ''
           }
           <p>${ehFitas ? 'O prazo de entrega é o da transportadora cotada no seu CEP.' : 'Prazo de entrega/retirada: <strong>2 a 6 dias úteis</strong>.'} Entramos em
           contato pelo WhatsApp informado para combinar os detalhes.</p>
           <p>Acompanhe o status do seu pedido a qualquer momento:
           <a href="https://goiania.roilabs.com.br/pedido/?t=${pedido.id}">acompanhar pedido</a></p>
           <p>Dúvidas? Chame a gente: <a href="https://wa.me/5562993265713">WhatsApp (62) 99326-5713</a></p>
           <p>— ROI Labs · goiania.roilabs.com.br</p>`
        );
      }
      sendAlert(
        `💰 Pedido pago — ${pedido.nome} · ${brl(pedido.total)}`,
        `<p><strong>${escapeHtml(pedido.nome)}</strong> · ${escapeHtml(pedido.whatsapp)}${pedido.email ? ` · ${escapeHtml(pedido.email)}` : ''}</p>
         <ul>${itensHtml}</ul>
         <p>Total: <strong>${brl(pedido.total)}</strong> · entrega: ${escapeHtml(pedido.entrega)}</p>
         ${
           temPersonalizada
             ? `<p style="background:#fef3c7;border:1px solid #f59e0b;padding:8px 12px;border-radius:6px;">
                ⚠️ <strong>Fita PERSONALIZADA</strong> — solicitar a arte/logo do cliente pelo
                WhatsApp <strong>${escapeHtml(pedido.whatsapp)}</strong> antes de produzir.
                Clichê: ${clicheCobrado ? '<strong>COBRADO</strong> (arte nova).' : '<strong>ISENTO</strong> (cliente recorrente — reutilizar a arte já cadastrada).'}</p>`
             : ''
         }
         <p><a href="https://app.roilabs.com.br/admin/pedidos">Abrir no admin</a></p>`
      );
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
