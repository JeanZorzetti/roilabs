import crypto from 'crypto';

// Mercado Pago Checkout Pro via REST (no SDK dependency — a few fetch calls cover it).
// Token/secret via env (Constitution I). ponytail: switch to the SDK only if Bricks
// or advanced features are needed.

const API = 'https://api.mercadopago.com';

function token(): string {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!t) throw new Error('MERCADOPAGO_ACCESS_TOKEN not set');
  return t;
}

function authHeaders(extra?: Record<string, string>) {
  return { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json', ...extra };
}

export interface PreferenceItem {
  title: string;
  unitPrice: number; // already the exact subtotal (quantity = 1)
}

export interface PreferenceInput {
  externalReference: string; // = pedido.id
  items: PreferenceItem[];
  frete?: number | null; // added as its own line when > 0
  backUrl: string; // {site}/obrigado?pedido={id}
  notificationUrl: string; // {app}/api/pagamentos/webhook
}

/** Creates a Checkout Pro preference. Returns the id + init_point to redirect to. */
export async function createPreference(input: PreferenceInput): Promise<{ id: string; initPoint: string }> {
  const items = input.items.map((i) => ({
    title: i.title,
    quantity: 1,
    unit_price: Number(i.unitPrice.toFixed(2)),
    currency_id: 'BRL',
  }));
  if (input.frete && input.frete > 0) {
    items.push({ title: 'Frete', quantity: 1, unit_price: Number(input.frete.toFixed(2)), currency_id: 'BRL' });
  }

  const res = await fetch(`${API}/checkout/preferences`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      items,
      external_reference: input.externalReference,
      back_urls: { success: input.backUrl, pending: input.backUrl, failure: input.backUrl },
      auto_return: 'approved',
      notification_url: input.notificationUrl,
    }),
  });
  if (!res.ok) throw new Error(`MP preference failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.id, initPoint: data.init_point };
}

export interface PreapprovalInput {
  externalReference: string; // = pedido.id
  reason: string; // rótulo da assinatura na página MP (slug do produto)
  payerEmail: string; // Preapproval EXIGE payer_email (Checkout Pro não)
  transactionAmount: number;
  frequency: number; // 1 (mensal) | 12 (anual) — ver frequencyType
  frequencyType: 'months';
  backUrl: string;
  notificationUrl: string;
}

/** Cria uma autorização recorrente (Preapproval). Cobra o 1º ciclo e todos os seguintes
 *  sem o comprador reentrar o cartão (FR-001, research.md D1). */
export async function createPreapproval(input: PreapprovalInput): Promise<{ id: string; initPoint: string }> {
  const res = await fetch(`${API}/preapproval`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      external_reference: input.externalReference,
      reason: input.reason,
      payer_email: input.payerEmail,
      back_url: input.backUrl,
      notification_url: input.notificationUrl,
      auto_recurring: {
        frequency: input.frequency,
        frequency_type: input.frequencyType,
        transaction_amount: Number(input.transactionAmount.toFixed(2)),
        currency_id: 'BRL',
      },
    }),
  });
  if (!res.ok) throw new Error(`MP preapproval failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.id, initPoint: data.init_point };
}

/** Cancela uma autorização recorrente no MP. Chamar SEMPRE antes de marcar `cancelada` no
 *  banco (data-model.md — ordem importa: se isto falhar, o estado local não muda). */
export async function cancelPreapproval(preapprovalId: string): Promise<void> {
  const res = await fetch(`${API}/preapproval/${preapprovalId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status: 'cancelled' }),
  });
  if (!res.ok) throw new Error(`MP cancelPreapproval failed: ${res.status} ${await res.text()}`);
}

export interface MpPayment {
  id: number;
  status: string; // approved | pending | in_process | rejected | refunded | charged_back | cancelled
  externalReference: string | null;
}

/** Fetches a payment by id — the source of truth for status (never trust webhook body). */
export async function getPayment(id: string): Promise<MpPayment> {
  const res = await fetch(`${API}/v1/payments/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`MP getPayment failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.id, status: data.status, externalReference: data.external_reference ?? null };
}

/** Full refund of a payment. */
export async function refund(paymentId: string): Promise<void> {
  const res = await fetch(`${API}/v1/payments/${paymentId}/refunds`, {
    method: 'POST',
    headers: authHeaders({ 'X-Idempotency-Key': `refund-${paymentId}` }),
    body: '{}',
  });
  if (!res.ok) throw new Error(`MP refund failed: ${res.status} ${await res.text()}`);
}

/**
 * Validates the webhook x-signature (FR-008). MP signs the manifest
 * `id:{dataId};request-id:{xRequestId};ts:{ts};` with HMAC-SHA256 + the webhook secret.
 * x-signature header looks like `ts=1700000000,v1=<hex>`.
 *
 * 012: `secret` is an OPTIONAL second argument. Omitted → MERCADOPAGO_WEBHOOK_SECRET, the
 * ROI Labs' own account — the one-argument call in /api/pagamentos/webhook keeps behaving
 * exactly as before (FR-005a: it is the path that bills today). Passed → the partner
 * account's secret, since MP signs per account (contract, step 2).
 * Regression proof: test/mercadopago-assinatura-regressao.test.mjs.
 */
export function verifyWebhookSignature(
  opts: {
    xSignature?: string | null;
    xRequestId?: string | null;
    dataId?: string | null;
  },
  secretOverride?: string,
): boolean {
  const secret = secretOverride ?? process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !opts.xSignature || !opts.dataId) return false;

  const parts = Object.fromEntries(
    opts.xSignature.split(',').map((kv) => kv.split('=').map((s) => s.trim()) as [string, string]),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  // dataId is lowercased per MP spec.
  const manifest = `id:${opts.dataId.toLowerCase()};request-id:${opts.xRequestId ?? ''};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
