import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookToken, verificarPagamento } from '@/lib/asaas';

export const dynamic = 'force-dynamic';

const PAGO = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']);
const REEMBOLSO = new Set(['PAYMENT_REFUNDED']);

// Webhook Asaas (server-to-server): concilia pagamento de FaturaSuccessFee. Espelha
// api/pagamentos/webhook (MP) — valida autenticidade ANTES de tocar estado; idempotente
// por asaasPaymentId; Asaas é a fonte da verdade do status (nunca confia só no corpo).
export async function POST(req: NextRequest) {
  if (!verifyWebhookToken(req.headers.get('asaas-access-token'))) {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const event = (body as { event?: string }).event ?? '';
  const payment = (body as { payment?: { id?: string; externalReference?: string } }).payment;
  if (!payment?.id) return NextResponse.json({ ok: true });
  if (!PAGO.has(event) && !REEMBOLSO.has(event)) return NextResponse.json({ ok: true });

  const where = payment.externalReference
    ? { OR: [{ asaasPaymentId: payment.id }, { id: payment.externalReference }] }
    : { asaasPaymentId: payment.id };
  const fatura = await prisma.faturaSuccessFee.findFirst({ where });
  if (!fatura) return NextResponse.json({ ok: true });

  // Idempotente: já paga com esse mesmo pagamento ⇒ no-op.
  if (fatura.status === 'paga' && fatura.asaasPaymentId === payment.id) {
    return NextResponse.json({ ok: true });
  }

  if (PAGO.has(event)) {
    const real = await verificarPagamento(payment.id);
    if (real.status === 'CONFIRMED' || real.status === 'RECEIVED') {
      await prisma.faturaSuccessFee.update({
        where: { id: fatura.id },
        data: { status: 'paga', asaasPaymentId: payment.id },
      });
    }
  }
  // PAYMENT_REFUNDED: reconhecido para não ser tratado como confirmação; sem estado de
  // estorno modelado em FaturaSuccessFee (fora do escopo da 007 — ver data-model.md).

  return NextResponse.json({ ok: true });
}
