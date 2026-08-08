import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPayment, verifyWebhookSignature } from '@/lib/mercadopago';
import { dataProximoCiclo, novoCancelToken, decidirRenovacao } from '@/lib/assinaturas';
import { resolverParametros, resolverPiso, resolverModalidade, type CamadasConfig } from '@/lib/centros-custo';
import { sendEmail, sendAlert, escapeHtml } from '@/lib/email';
import { log } from '@/lib/log';
import { getLoja } from '@/lib/lojas';

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

  // We only care about payment notifications. 014 (research.md — risco do nome do evento):
  // uma cobrança de renovação de assinatura pode chegar como 'subscription_authorized_payment'
  // em vez de 'payment' — o recurso buscado abaixo (getPayment) é sempre um Payment normal.
  if (bodyType && !['payment', 'subscription_authorized_payment'].includes(bodyType)) {
    return NextResponse.json({ ok: true });
  }
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

  if (payment.status === 'approved' && pedido.statusPagamento === 'pendente') {
    // Advance only (never pago → pendente). Reserva: fulfillment stays "aguardando" (FR-012).
    {
      // Freeze per-item snapshot of cost-center params at payment time (US4 / FR-010).
      // Load all DB layers once for the whole order, then resolve per slug.
      const [paramRows, skuRows] = await Promise.all([
        prisma.parametroCentroCusto.findMany(),
        // 013: a tabela é UMA só. `caixas` saiu do schema — a contagem de caixas agora é
        // justificativa de preço e mora em `detalhe`, não em coluna própria.
        prisma.itemPedido.findMany({
          where: { pedidoId: pedido.id },
          select: { id: true, slug: true, subtotal: true, unidade: true, quantidade: true, detalhe: true, recorrencia: true, assinaturaRef: true },
        }),
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

      // 014 (contracts/webhook-assinatura.md, "Caminho do 1º ciclo"): a Assinatura nasce
      // dentro da MESMA transação que marca o pedido pago — nunca fora dela. IDs gerados
      // aqui (não pelo @default do Prisma) porque o create de Assinatura e o de
      // CicloCobranca precisam do MESMO id sem depender do resultado um do outro dentro
      // do array de operações do $transaction.
      const assinaturaTokens = new Map<string, string>(); // itemId → cancelToken (usado no e-mail abaixo)
      const assinaturaExtras = skuRows.flatMap((item) => {
        if (item.unidade !== 'assinatura' || !item.assinaturaRef) return [];
        const assinaturaId = crypto.randomUUID();
        const cancelToken = novoCancelToken();
        assinaturaTokens.set(item.id, cancelToken);
        return [
          prisma.assinatura.create({
            data: {
              id: assinaturaId,
              itemPedidoId: item.id,
              pedidoId: pedido.id,
              slug: item.slug,
              lojaId: pedido.vertical,
              mpPreapprovalId: item.assinaturaRef,
              recorrencia: item.recorrencia ?? 'mensal',
              estado: 'ativa',
              proximaCobranca: dataProximoCiclo(item.recorrencia ?? 'mensal'),
              cancelToken,
            },
          }),
          prisma.cicloCobranca.create({
            data: { assinaturaId, resultado: 'sucesso', mpPaymentId: paymentId },
          }),
          prisma.itemPedido.update({ where: { id: item.id }, data: { assinaturaEstado: 'ativa' } }),
        ];
      });

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
        ...assinaturaExtras,
      ]);

      // The single most valuable line in the log: an order actually got paid and the
      // snapshot committed. If MP shows a payment with no matching line here, the
      // webhook broke between getPayment and this transaction.
      log.info({ pedidoId: pedido.id, paymentId, total: pedido.total }, 'webhook: pedido pago');

      // Pós-pagamento (fire-and-forget, nunca quebra o webhook): confirmação ao
      // cliente (recibo nosso, além do MP) + alerta interno de pedido novo.
      const brl = (v: unknown) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      // 013: `itens_pedido_fita` não existe mais — TODOS os itens vêm de `skuRows`. O que
      // decide a exibição passou a ser a `unidade` do item, não o vertical do pedido, e é
      // por isso que a lista deixou de ser duas somadas. O bug que a 011 remendava aqui
      // (confirmação com lista VAZIA para fita) some por construção: há uma tabela só.
      const lojaPedido = getLoja(pedido.vertical ?? 'porcelanato');
      const lf = lojaPedido?.linhaFixa ?? null;
      const medida = (i: (typeof skuRows)[number]): string | null => {
        // m² conta em CAIXAS para o comprador, e a contagem virou justificativa de preço.
        const caixas = (i.detalhe as { caixas?: unknown } | null)?.caixas;
        if (i.unidade === 'm2' && caixas != null) return `${Number(caixas)} caixa(s)`;
        if (i.quantidade != null) return `${Number(i.quantidade)} ${i.unidade ?? 'un'}(s)`;
        // Pedido criado ANTES da migração da 013 não tem `unidade`: omitir a medida em vez
        // de escrever "undefined caixa(s)" no e-mail de quem pagou.
        return null;
      };
      const itensHtml = skuRows
        .map((i) => {
          if (lf && i.slug === lf.slug) return `<li>${escapeHtml(lf.rotulo)} · ${brl(i.subtotal)}</li>`;
          const m = medida(i);
          return `<li>${escapeHtml(i.slug)}${m ? ` — ${m}` : ''} · ${brl(i.subtotal)}</li>`;
        })
        .join('');
      const ehFitas = pedido.vertical === 'fitas';
      // 011.1: pedido com arte precisa que o cliente ENVIE a logo — a arte é coletada
      // pelo WhatsApp após o pagamento (não há campo de upload no checkout). Deriva do
      // que foi persistido: a personalizada no pedido e se o clichê foi cobrado (arte nova)
      // ou isento (recorrente).
      const temPersonalizada = !!lf && skuRows.some((i) => i.slug === lf.quandoSlug);
      const clicheCobrado = !!lf && skuRows.some((i) => i.slug === lf.slug);
      const WA = 'https://wa.me/5562993265713';
      // 014: unidade='assinatura' não é entrega física — e-mail próprio, com o link de
      // cancelamento (contracts/webhook-assinatura.md: "ganha, só para assinatura, o link").
      const cancelToken = [...assinaturaTokens.values()][0] ?? null;
      if (pedido.email) {
        sendEmail(
          pedido.email,
          cancelToken
            ? 'Assinatura confirmada | ROI Labs'
            : ehFitas ? 'Pedido confirmado — fitas adesivas | ROI Labs' : 'Pedido confirmado — porcelanato Goiânia | ROI Labs',
          cancelToken
            ? `<p>Olá, ${escapeHtml(pedido.nome)}!</p>
               <p>Sua assinatura foi confirmada. As próximas cobranças acontecem automaticamente —
               você não precisa fazer nada nem informar o cartão de novo.</p>
               <ul>${itensHtml}</ul>
               <p><strong>Valor do ciclo: ${brl(pedido.total)}</strong></p>
               <p>Quer cancelar? <a href="https://app.roilabs.com.br/assinatura/cancelar?token=${cancelToken}">Cancelar assinatura</a></p>
               <p>— ROI Labs</p>`
            : `<p>Olá, ${escapeHtml(pedido.nome)}!</p>
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
  } else if (pedido.statusPagamento === 'pago') {
    // 014 (contracts/webhook-assinatura.md, "Caminho de RENOVAÇÃO"): notificação de um
    // ciclo seguinte de uma assinatura — aprovado ou não. Pedido sem Assinatura (notificação
    // duplicada num pedido normal já pago) → no-op, comportamento atual.
    const assinatura = await prisma.assinatura.findFirst({ where: { pedidoId: pedido.id } });
    if (assinatura) {
      const jaProcessado = !!(await prisma.cicloCobranca.findUnique({ where: { mpPaymentId: paymentId } }));
      const decisao = decidirRenovacao(
        { estado: assinatura.estado, recorrencia: assinatura.recorrencia },
        payment.status,
        jaProcessado,
      );

      if (decisao.acao === 'sucesso') {
        await prisma.$transaction([
          prisma.cicloCobranca.create({ data: { assinaturaId: assinatura.id, resultado: 'sucesso', mpPaymentId: paymentId } }),
          prisma.assinatura.update({
            where: { id: assinatura.id },
            data: {
              estado: decisao.novoEstado,
              proximaCobranca: decisao.proximaCobranca,
              ...(decisao.limparJanela ? { janelaFalhaDesde: null } : {}),
            },
          }),
          prisma.itemPedido.update({ where: { id: assinatura.itemPedidoId }, data: { assinaturaEstado: decisao.novoEstado } }),
        ]);
        log.info({ assinaturaId: assinatura.id, paymentId }, 'webhook: ciclo de renovação pago');
      } else if (decisao.acao === 'falha') {
        await prisma.$transaction([
          prisma.cicloCobranca.create({
            data: { assinaturaId: assinatura.id, resultado: 'falha', motivo: payment.status, mpPaymentId: paymentId },
          }),
          prisma.assinatura.update({
            where: { id: assinatura.id },
            data: {
              estado: decisao.novoEstado,
              ...(decisao.setarJanela ? { janelaFalhaDesde: new Date() } : {}),
            },
          }),
          prisma.itemPedido.update({ where: { id: assinatura.itemPedidoId }, data: { assinaturaEstado: decisao.novoEstado } }),
        ]);
        log.warn({ assinaturaId: assinatura.id, paymentId, status: payment.status }, 'webhook: ciclo de renovação falhou');

        // FR-004: só avisa na 1ª falha da sequência (setarJanela) — falhas seguintes dentro
        // da mesma janela já foram avisadas.
        if (decisao.setarJanela && pedido.email) {
          sendEmail(
            pedido.email,
            'Não conseguimos cobrar sua assinatura | ROI Labs',
            `<p>Olá, ${escapeHtml(pedido.nome)}!</p>
             <p>A cobrança deste ciclo da sua assinatura <strong>${escapeHtml(assinatura.slug)}</strong> não foi
             aprovada. Vamos tentar novamente automaticamente nos próximos dias — verifique se o cartão
             cadastrado está válido na sua página de assinatura do Mercado Pago.</p>
             <p>Prefere cancelar? O acesso ao período já pago continua valendo até o fim do ciclo, sem reembolso:</p>
             <p><a href="https://app.roilabs.com.br/assinatura/cancelar?token=${assinatura.cancelToken}">Cancelar assinatura</a></p>
             <p>— ROI Labs</p>`,
          );
        }
      }
      // decisao.acao === 'ignorar' (FR-006, dedupe) → no-op.
    }
  }
  // pending/in_process/rejected/cancelled sem pedido pago → keep pendente (cart preserved).

  return NextResponse.json({ ok: true });
}
