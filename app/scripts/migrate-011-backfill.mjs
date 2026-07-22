// Backfill da 011 — roda UMA vez, logo após o `prisma db push` e ANTES do push do código.
// Run: node --import tsx scripts/migrate-011-backfill.mjs   (ou `node` se o client já existir)
//
// Por que existe: `@default(...)` no schema cobre linha NOVA — não reescreve linha já
// gravada. Sem este script, todo cupom vigente ficaria com escopo indefinido no código
// que lê a coluna, e (FR-037) ausência de escopo NÃO pode virar 'ambos'.
// Idempotente: rodar de novo só reescreve o mesmo valor.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cupons = await prisma.cupom.updateMany({
  where: { escopo: { not: 'porcelanato' } },
  data: { escopo: 'porcelanato' },
});
const pedidos = await prisma.pedido.updateMany({
  where: { vertical: { not: 'porcelanato' } },
  data: { vertical: 'porcelanato' },
});

// Conferência na saída — o operador confirma aqui em vez de abrir o psql (T010).
const porEscopo = await prisma.cupom.groupBy({ by: ['escopo'], _count: true });
const porVertical = await prisma.pedido.groupBy({ by: ['vertical'], _count: true });

console.log(`backfill 011: ${cupons.count} cupom(ns) e ${pedidos.count} pedido(s) atualizados`);
console.log('cupons por escopo:', porEscopo.map((r) => `${r.escopo}=${r._count}`).join(' · ') || '(vazio)');
console.log('pedidos por vertical:', porVertical.map((r) => `${r.vertical}=${r._count}`).join(' · ') || '(vazio)');

await prisma.$disconnect();
