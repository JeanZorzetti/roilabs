// Adaptador Mercado Pago (012) — cobre `atma`, `polarisia`, `estetiacrm`, `vertice`.
//
// ⚠️ Faz o PRÓPRIO fetch em vez de reusar `getPayment` de lib/mercadopago.ts: aquela função
// lê o token global da ROI Labs, e aqui o pagamento vive na conta DO PARCEIRO. Generalizar
// `getPayment` seria um segundo toque no arquivo que /api/pagamentos/webhook usa — o único
// caminho que fatura (FR-005a). Raio de alcance menor vale a duplicação de um fetch.
// ponytail: sem SDK, como o resto do repo — uma chamada REST cobre.

import type { AdaptadorGateway, CtxWebhook } from './index';
import type { VendaEntrada, StatusVenda } from '@/lib/carteira/registrar-venda';
import { verifyWebhookSignature } from '@/lib/mercadopago';
import { normalizarDoc } from '@/lib/doc';

const API = 'https://api.mercadopago.com';

/** `data.id` chega como query (?data.id=) ou no corpo — as duas formas existem no MP. */
export function extrairDataId(ctx: CtxWebhook): string | null {
  const q = ctx.url.searchParams.get('data.id') ?? ctx.url.searchParams.get('id');
  if (q) return q;
  try {
    const body = JSON.parse(ctx.corpoCru) as { data?: { id?: string | number } };
    return body.data?.id != null ? String(body.data.id) : null;
  } catch {
    return null;
  }
}

/** Tipo da notificação — só `payment` interessa. */
export function extrairTipo(ctx: CtxWebhook): string | null {
  const q = ctx.url.searchParams.get('type') ?? ctx.url.searchParams.get('topic');
  if (q) return q;
  try {
    return (JSON.parse(ctx.corpoCru) as { type?: string }).type ?? null;
  } catch {
    return null;
  }
}

/** Mapa de status do MP → status da carteira. `null` = irrelevante (200, sem gravar). */
export function mapearStatus(s: string): StatusVenda | null {
  if (s === 'approved') return 'aprovada';
  if (s === 'refunded') return 'reembolsada';
  if (s === 'charged_back') return 'estornada';
  // pending | in_process | rejected | cancelled → nada a registrar.
  return null;
}

/**
 * FR-006 — payer de conta de teste. ⚠️ `approved` + `live_mode: true` NÃO é venda: os 20
 * pagamentos de R$ 940 da Atma são todos assim. Só o PAYER separa teste de receita.
 */
export function ehPayerTeste(email: string | null): boolean {
  if (!email) return false;
  return /@testuser\.com$/i.test(email.trim());
}

interface MpPaymentRaw {
  id: number | string;
  status: string;
  transaction_amount: number;
  currency_id?: string;
  collector_id?: number | string;
  operation_type?: string;
  payer?: { email?: string; identification?: { number?: string }; id?: string | number };
}

export const adaptadorMercadoPago: AdaptadorGateway = {
  verificarAssinatura(ctx, segredo) {
    return verifyWebhookSignature(
      {
        xSignature: ctx.headers.get('x-signature'),
        xRequestId: ctx.headers.get('x-request-id'),
        dataId: extrairDataId(ctx),
      },
      segredo,
    );
  },

  async consultar(ctx, token) {
    if (extrairTipo(ctx) !== 'payment') return null;
    const dataId = extrairDataId(ctx);
    if (!dataId) return null;

    const res = await fetch(`${API}/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // 404 = pagamento não existe naquela conta: evento irrelevante para este parceiro,
    // não falha transitória. Reenviar não conserta, então 200 e não 5xx.
    if (res.status === 404) return null;
    // Qualquer outra falha é transitória do ponto de vista do gateway → o throw vira 5xx
    // na rota, que é o único status que pede reenvio.
    if (!res.ok) throw new Error(`MP getPayment falhou: ${res.status} ${await res.text()}`);

    const p = (await res.json()) as MpPaymentRaw;
    const status = mapearStatus(p.status);
    if (!status) return null;

    const email = p.payer?.email ?? null;
    return {
      gateway: 'mercadopago',
      // ⚠️ eventoId derivado de (pagamento, status), não do id da notificação: o MP manda
      // notificação sem corpo em algumas integrações, e um id instável quebraria a
      // idempotência. Assim, RETRY do mesmo estado colide (200) e MUDANÇA de estado
      // (aprovada → reembolsada) grava linha nova, que é o que o estorno precisa.
      // Teto: dois eventos distintos com o mesmo (pagamento, status) colapsariam em um.
      eventoId: `${p.id}:${status}`,
      pagamentoId: String(p.id),
      valor: Number(p.transaction_amount),
      moeda: p.currency_id ?? 'BRL',
      status,
      // Assinatura recorrente no MP chega como operation_type='recurring_payment'.
      recorrente: p.operation_type === 'recurring_payment',
      clienteDoc: normalizarDoc(p.payer?.identification?.number) || null,
      clienteRef: email ?? (p.payer?.id != null ? String(p.payer.id) : null),
      // A conta dona do pagamento, lida DO gateway — é ela que o passo 4 confere.
      contaRefPagamento: p.collector_id != null ? String(p.collector_id) : '',
      payerTeste: ehPayerTeste(email),
      payload: p,
    } satisfies VendaEntrada;
  },
};
