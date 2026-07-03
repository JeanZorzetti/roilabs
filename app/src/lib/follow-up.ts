import { prisma } from '@/lib/prisma';

// Follow-up queue, shared by /admin/follow-up and the weekly digest.
// Two buckets, both only for leads still in status 'novo' (marking a lead
// 'contatado' via PATCH /api/leads-consumidor/:id clears it from the queue):
// - carrinhos: lead saved a cart link but no paid pedido matches their number
//   (a fresh one is HOT — answering fast is what converts)
// - frios: lead without cart sitting in 'novo' for 48h+
// ponytail: number match = last 11 digits (DDD + 9-digit mobile), so
// "62 9xxxx" and "55 62 9xxxx" agree; refine if non-BR numbers ever show up.
const norm = (raw: string) => raw.replace(/\D/g, '').slice(-11);
const temCarrinho = (l: { mensagem: string | null }) => /https?:\/\//.test(l.mensagem ?? '');

export async function filaFollowUp() {
  const [leads, pagos] = await Promise.all([
    prisma.leadConsumidor.findMany({ where: { status: 'novo' }, orderBy: { createdAt: 'asc' } }),
    prisma.pedido.findMany({ where: { statusPagamento: 'pago' }, select: { whatsapp: true } }),
  ]);
  const pagou = new Set(pagos.map((p) => norm(p.whatsapp)));
  const h48 = Date.now() - 48 * 60 * 60 * 1000;

  const carrinhos = leads.filter((l) => temCarrinho(l) && !pagou.has(norm(l.whatsapp)));
  const frios = leads.filter((l) => !temCarrinho(l) && l.createdAt.getTime() < h48);
  return { carrinhos, frios };
}
