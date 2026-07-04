import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const CORS = { 'Access-Control-Allow-Origin': '*' };

// Public read (mirrors GET /api/cadeiras): the static site's /pedido/?t= page fetches
// this from the browser at runtime. The cuid id IS the capability token (unguessable,
// already handed to the customer via the MP back_url and the confirmation e-mail).
// Response carries no PII — only what the tracking page renders.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    select: {
      statusPagamento: true,
      statusFulfillment: true,
      entrega: true,
      createdAt: true,
      itens: { select: { slug: true, caixas: true } },
    },
  });
  if (!pedido) return NextResponse.json({ error: 'não encontrado' }, { status: 404, headers: CORS });
  return NextResponse.json(pedido, { headers: CORS });
}
