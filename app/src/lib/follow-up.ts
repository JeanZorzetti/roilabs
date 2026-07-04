import { prisma } from '@/lib/prisma';

// Follow-up queue, shared by /admin/follow-up and the weekly digest.
// Three buckets:
// - carrinhos: lead saved a cart link but no paid pedido matches their number
//   (a fresh one is HOT — answering fast is what converts)
// - frios: lead without cart sitting in 'novo' for 48h+
// - pendentes: pedido created but never paid, 24h–14d old — the hottest lead
//   there is (they reached checkout). Self-clearing: leaves the queue when the
//   pedido turns pago/reembolsado in /admin/pedidos, or ages past 14d.
// Lead buckets only cover status 'novo' (marking a lead 'contatado' via
// PATCH /api/leads-consumidor/:id clears it from the queue).
// ponytail: number match = last 11 digits (DDD + 9-digit mobile), so
// "62 9xxxx" and "55 62 9xxxx" agree; refine if non-BR numbers ever show up.
const norm = (raw: string) => raw.replace(/\D/g, '').slice(-11);
const temCarrinho = (l: { mensagem: string | null }) => /https?:\/\//.test(l.mensagem ?? '');

export async function filaFollowUp() {
  const h24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const d14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const [leads, pagos, pendentes] = await Promise.all([
    prisma.leadConsumidor.findMany({ where: { status: 'novo' }, orderBy: { createdAt: 'asc' } }),
    prisma.pedido.findMany({ where: { statusPagamento: 'pago' }, select: { whatsapp: true } }),
    prisma.pedido.findMany({
      where: { statusPagamento: 'pendente', createdAt: { lt: h24, gt: d14 } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  const pagou = new Set(pagos.map((p) => norm(p.whatsapp)));
  const h48 = Date.now() - 48 * 60 * 60 * 1000;

  const carrinhos = leads.filter((l) => temCarrinho(l) && !pagou.has(norm(l.whatsapp)));
  const frios = leads.filter((l) => !temCarrinho(l) && l.createdAt.getTime() < h48);
  // Customer may have abandoned one pedido and paid another — don't nag those.
  const pedidosPendentes = pendentes.filter((p) => !pagou.has(norm(p.whatsapp)));
  return { carrinhos, frios, pendentes: pedidosPendentes };
}
