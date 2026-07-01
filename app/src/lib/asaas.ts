import crypto from 'crypto';

// Asaas (cobrança) via REST — no SDK dependency (mesmo padrão de mercadopago.ts).
// Token/URL via env (Constitution I). Base default = sandbox; setar ASAAS_API_URL de
// produção só quando a cobrança já tiver sido validada em sandbox.

function apiUrl(): string {
  return process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
}

function token(): string {
  const t = process.env.ASAAS_API_KEY;
  if (!t) throw new Error('ASAAS_API_KEY not set');
  return t;
}

function authHeaders(): Record<string, string> {
  return { access_token: token(), 'Content-Type': 'application/json' };
}

export interface ParceiroAsaas {
  nome: string;
  cpfCnpj: string;
  email?: string | null;
  asaasCustomerId?: string | null;
}

/** Retorna o customerId existente ou cria um cliente novo no Asaas. */
export async function garantirCliente(p: ParceiroAsaas): Promise<string> {
  if (p.asaasCustomerId) return p.asaasCustomerId;

  const res = await fetch(`${apiUrl()}/customers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name: p.nome, cpfCnpj: p.cpfCnpj, email: p.email || undefined }),
  });
  if (!res.ok) throw new Error(`Asaas garantirCliente failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.id as string;
}

export interface CriarCobrancaInput {
  customerId: string;
  valor: number;
  descricao: string;
  externalReference: string; // = fatura.id
}

export interface Cobranca {
  id: string;
  status: string;
  invoiceUrl: string;
}

/** Cria uma cobrança (boleto/PIX/cartão — cliente escolhe no link). Vencimento em 3 dias. */
export async function criarCobranca(input: CriarCobrancaInput): Promise<Cobranca> {
  const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const res = await fetch(`${apiUrl()}/payments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      customer: input.customerId,
      billingType: 'UNDEFINED',
      value: Number(input.valor.toFixed(2)),
      dueDate,
      description: input.descricao,
      externalReference: input.externalReference,
    }),
  });
  if (!res.ok) throw new Error(`Asaas criarCobranca failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.id, status: data.status, invoiceUrl: data.invoiceUrl };
}

export interface AsaasPayment {
  id: string;
  status: string; // PENDING | RECEIVED | CONFIRMED | OVERDUE | REFUNDED | ...
  externalReference: string | null;
}

/** Fonte da verdade do status — nunca confiar só no corpo do webhook. */
export async function verificarPagamento(id: string): Promise<AsaasPayment> {
  const res = await fetch(`${apiUrl()}/payments/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Asaas verificarPagamento failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.id, status: data.status, externalReference: data.externalReference ?? null };
}

/** Valida o header `asaas-access-token` do webhook contra ASAAS_WEBHOOK_TOKEN antes de tocar estado. */
export function verifyWebhookToken(received: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
