// Adaptador Stripe (012) — cobre `sirius`, `context`, `orion`.
// ponytail: sem o SDK `stripe`. A assinatura é HMAC-SHA256 de `${t}.${corpo}` e a consulta
// é um GET — o mesmo padrão que lib/mercadopago.ts já adotou ("no SDK dependency"). Teto:
// se um dia precisar de Billing Portal, Connect onboarding ou webhooks tipados, o SDK entra.

import crypto from 'crypto';
import type { AdaptadorGateway, CtxWebhook } from './index';
import type { VendaEntrada, StatusVenda } from '@/lib/carteira/registrar-venda';
import { normalizarDoc } from '@/lib/doc';

const API = 'https://api.stripe.com/v1';

/** Tolerância do timestamp: réplica velha é replay, mesmo com assinatura boa. */
const TOLERANCIA_S = 5 * 60;

/**
 * `Stripe-Signature: t=<unix>,v1=<hex>[,v1=<hex>]`. O manifesto assinado é `${t}.${corpo}`,
 * sobre os BYTES crus — reserializar o JSON muda a assinatura.
 */
export function verificarAssinaturaStripe(
  cabecalho: string | null,
  corpoCru: string,
  segredo: string,
  agoraS: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!cabecalho || !segredo) return false;

  let t: string | null = null;
  const v1: string[] = [];
  for (const parte of cabecalho.split(',')) {
    const [k, v] = parte.split('=').map((s) => s.trim());
    if (k === 't') t = v;
    // Stripe manda MAIS DE UM v1 durante rotação de segredo — aceitar qualquer um.
    else if (k === 'v1' && v) v1.push(v);
  }
  if (!t || v1.length === 0) return false;

  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(agoraS - ts) > TOLERANCIA_S) return false;

  const esperado = crypto.createHmac('sha256', segredo).update(`${t}.${corpoCru}`).digest('hex');
  const a = Buffer.from(esperado);
  return v1.some((assinatura) => {
    const b = Buffer.from(assinatura);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

/** Tipos de evento que movem dinheiro. Os demais → irrelevante (200). */
export function mapearEvento(tipo: string): StatusVenda | null {
  switch (tipo) {
    case 'checkout.session.completed':
    case 'payment_intent.succeeded':
    case 'invoice.paid':
    case 'invoice.payment_succeeded':
      return 'aprovada';
    case 'charge.refunded':
    case 'refund.created':
      return 'reembolsada';
    case 'charge.dispute.created':
      return 'estornada';
    default:
      return null;
  }
}

interface StripeEvent {
  id: string;
  type: string;
  account?: string;
  livemode?: boolean;
  data: { object: Record<string, unknown> };
}

const num = (v: unknown): number => (typeof v === 'number' ? v : 0);
const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

export const adaptadorStripe: AdaptadorGateway = {
  verificarAssinatura(ctx, segredo) {
    return verificarAssinaturaStripe(ctx.headers.get('stripe-signature'), ctx.corpoCru, segredo);
  },

  async consultar(ctx, token) {
    // O id do evento vem do corpo, mas o corpo NÃO é fonte de verdade: ele só diz QUAL
    // evento buscar. Status e valor saem da resposta da API (FR-003b).
    let idEvento: string | null = null;
    try {
      idEvento = str((JSON.parse(ctx.corpoCru) as { id?: unknown }).id);
    } catch {
      return null;
    }
    if (!idEvento) return null;

    const auth = { Authorization: `Bearer ${token}` };
    const res = await fetch(`${API}/events/${idEvento}`, { headers: auth });
    // 404 = o evento não existe NAQUELA conta. Reenviar não conserta → 200, não 5xx.
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Stripe getEvent falhou: ${res.status} ${await res.text()}`);

    const ev = (await res.json()) as StripeEvent;
    const status = mapearEvento(ev.type);
    if (!status) return null;

    const obj = ev.data.object;

    // A conta dona: `account` só existe em evento de Connect. Fora disso, a conta é a
    // dona da chave — e buscá-la torna a conferência do passo 4 real em vez de implícita.
    let contaRefPagamento = ev.account ?? '';
    if (!contaRefPagamento) {
      const resConta = await fetch(`${API}/account`, { headers: auth });
      if (!resConta.ok) throw new Error(`Stripe getAccount falhou: ${resConta.status}`);
      contaRefPagamento = str((await resConta.json()).id) ?? '';
    }

    // Centavos → unidade. Os três objetos possíveis usam campos de nome diferente.
    const centavos =
      num(obj.amount_total) || num(obj.amount_paid) || num(obj.amount_received) || num(obj.amount);
    const email =
      str(obj.customer_email) ??
      str((obj.customer_details as { email?: string } | undefined)?.email) ??
      str(obj.receipt_email);
    const doc = str((obj.customer_details as { tax_ids?: Array<{ value?: string }> } | undefined)?.tax_ids?.[0]?.value);

    return {
      gateway: 'stripe',
      // O `evt_…` do Stripe É estável entre retries e único por evento — aqui não precisa
      // do derivado que o MP exige.
      eventoId: ev.id,
      pagamentoId:
        str(obj.payment_intent) ?? str(obj.charge) ?? str(obj.id) ?? ev.id,
      valor: centavos / 100,
      moeda: (str(obj.currency) ?? 'brl').toUpperCase(),
      status,
      // `subscription` preenchido (checkout/invoice) = renovação → regra 1 da classificação.
      recorrente: !!obj.subscription || obj.mode === 'subscription' || ev.type.startsWith('invoice.'),
      clienteDoc: normalizarDoc(doc) || null,
      clienteRef: email ?? str(obj.customer),
      contaRefPagamento,
      // Stripe separa teste de produção por CHAVE (sk_test_ nunca emite evento em
      // produção), então não há o análogo do payer de teste do MP. `livemode: false`
      // chegando aqui é chave de teste publicada como produção — descartado como teste,
      // que é a mesma classe de defeito dos 20 pagamentos da Atma.
      payerTeste: ev.livemode === false,
      payload: ev,
    } satisfies VendaEntrada;
  },
};
