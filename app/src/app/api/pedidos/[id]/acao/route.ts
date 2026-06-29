import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { refund } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

// Admin-only: POST /api/pedidos/:id/acao  body: { acao: "confirmar" | "reembolsar" }
// Mirrors how /admin/cadeiras mutates state via fetch + PATCH.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const acao = typeof body.acao === 'string' ? body.acao : '';

  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) return NextResponse.json({ error: 'não encontrado' }, { status: 404 });

  // Gate: only paid/reserved orders can be acted on (SC-004).
  if (pedido.statusPagamento !== 'pago' || pedido.statusFulfillment !== 'aguardando') {
    return NextResponse.json({ error: `ação inválida no estado ${pedido.statusPagamento}/${pedido.statusFulfillment}` }, { status: 409 });
  }

  if (acao === 'confirmar') {
    const updated = await prisma.pedido.update({
      where: { id },
      data: { statusFulfillment: 'confirmado' },
    });
    return NextResponse.json(updated);
  }

  if (acao === 'reembolsar') {
    if (!pedido.mpPaymentId) {
      return NextResponse.json({ error: 'sem mp_payment_id para estornar' }, { status: 409 });
    }
    await refund(pedido.mpPaymentId);
    const updated = await prisma.pedido.update({
      where: { id },
      data: { statusPagamento: 'reembolsado', statusFulfillment: 'reembolsado' },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: 'acao deve ser confirmar ou reembolsar' }, { status: 400 });
}
