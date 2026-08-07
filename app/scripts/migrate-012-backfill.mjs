// Backfill da 012 — roda UMA vez, logo após o `prisma db push` e ANTES do push do código.
// Run: node --import tsx scripts/migrate-012-backfill.mjs
//
// Por que existe: `@default("pedido")` cobre linha NOVA — não reescreve linha já gravada.
// Sem este script toda linha antiga de negocios_originados ficaria com `origem` indefinida
// no código que lê a coluna, e a invariante de origem (data-model §1) nasceria violada.
// Idempotente: rodar de novo só reescreve o mesmo valor.
//
// `clienteRef` NÃO tem backfill de propósito: nulo em linha antiga é o valor CORRETO —
// negócio de origem 'pedido' classifica por clienteDoc, como sempre classificou.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Contagem ANTES — sem ela "zero linha com origem nula" é afirmação, não medição (T011).
const antes = await prisma.negocioOriginado.groupBy({ by: ['origem'], _count: true });
const total = await prisma.negocioOriginado.count();
console.log(`negócios no total: ${total}`);
console.log('origem ANTES:', antes.map((r) => `${r.origem ?? 'NULA'}=${r._count}`).join(' · ') || '(vazio)');

// Toda linha existente veio do carrinho: a 012 é a primeira a gravar 'webhook', e ela só
// grava depois deste backfill. `not: 'pedido'` cobre nula e qualquer valor inesperado.
const atualizados = await prisma.negocioOriginado.updateMany({
  where: { origem: { not: 'pedido' } },
  data: { origem: 'pedido' },
});

const depois = await prisma.negocioOriginado.groupBy({ by: ['origem'], _count: true });
console.log(`backfill 012: ${atualizados.count} negócio(s) atualizados`);
console.log('origem DEPOIS:', depois.map((r) => `${r.origem ?? 'NULA'}=${r._count}`).join(' · ') || '(vazio)');

// Portão do T011: a soma por origem tem de fechar com o total, e nenhuma pode ser 'webhook'
// neste momento — se for, o backfill rodou tarde demais (código já em produção gravando).
const somaPorOrigem = depois.reduce((s, r) => s + r._count, 0);
const comPedido = depois.find((r) => r.origem === 'pedido')?._count ?? 0;
if (somaPorOrigem !== total || comPedido !== total) {
  console.error(`FALHOU: ${comPedido}/${total} com origem='pedido' (soma ${somaPorOrigem}).`);
  console.error("Se há linha 'webhook', o código da 012 já estava no ar — apurar antes de seguir.");
  await prisma.$disconnect();
  process.exit(1);
}
console.log(`OK: ${comPedido}/${total} com origem='pedido', zero nula.`);

await prisma.$disconnect();
