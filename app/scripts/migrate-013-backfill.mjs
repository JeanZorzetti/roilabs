// Backfill explícito da 013 (FR-011 — UPDATE por linha, NUNCA @default).
//
// Mapa da migração (data-model.md §3):
//   porcelanato → unidade='m2', quantidade=m2, precoUnitario=preco_m2, detalhe={caixas, m2PorCaixa}
//   fitas       → copiar de itens_pedido_fita para itens_pedido com unidade='rolo',
//                 quantidade=rolos, precoUnitario=preco_rolo, detalhe={faixaMin, faixaMax}
//
// Flag --dry-run: imprime o que faria sem gravar.
//
// Run: node --import tsx scripts/migrate-013-backfill.mjs [--dry-run]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

if (dryRun) console.log('*** DRY RUN — nada será gravado ***\n');

async function main() {
  // ── 1. Preencher colunas novas nos itens de PORCELANATO ───────────────────
  const itensPorcelanato = await prisma.itemPedido.findMany({
    where: { unidade: null },
    include: { pedido: { select: { vertical: true } } },
  });

  const porcelanatos = itensPorcelanato.filter((it) => it.pedido.vertical === 'porcelanato');
  console.log(`Itens de porcelanato a preencher: ${porcelanatos.length}`);

  for (const it of porcelanatos) {
    const m2 = Number(it.m2);
    const precoM2 = Number(it.precoM2);
    const m2PorCaixa = it.caixas > 0 ? Math.round((m2 / it.caixas) * 100) / 100 : 0;

    const update = {
      unidade: 'm2',
      quantidade: m2,
      precoUnitario: precoM2,
      detalhe: { caixas: it.caixas, m2PorCaixa },
    };

    console.log(`  UPDATE itens_pedido SET unidade='m2', quantidade=${m2}, precoUnitario=${precoM2}, detalhe=${JSON.stringify(update.detalhe)} WHERE id='${it.id}'`);

    if (!dryRun) {
      await prisma.itemPedido.update({
        where: { id: it.id },
        data: update,
      });
    }
  }

  // ── 2. Copiar itens de FITA para itens_pedido ────────────────────────────
  // Encontrar pedidos de fita que ainda não têm itens copiados
  const pedidosFita = await prisma.pedido.findMany({
    where: { vertical: 'fitas' },
    include: { itensFita: true, itens: true },
  });

  let fitasCopied = 0;
  for (const p of pedidosFita) {
    // Só copiar se o pedido ainda não tem itens com unidade='rolo' em itens_pedido
    const jaCopied = p.itens.filter((it) => it.unidade === 'rolo');
    if (jaCopied.length >= p.itensFita.length) {
      console.log(`  Pedido ${p.id}: ${p.itensFita.length} item(ns) de fita já copiados — skip`);
      continue;
    }

    for (const itf of p.itensFita) {
      const precoRolo = Number(itf.precoRolo);
      const subtotal = Number(itf.subtotal);

      console.log(`  INSERT itens_pedido (pedido='${p.id}', slug='${itf.slug}', unidade='rolo', quantidade=${itf.rolos}, precoUnitario=${precoRolo}, detalhe={faixaMin:${itf.faixaMin}, faixaMax:${itf.faixaMax}}, subtotal=${subtotal})`);

      if (!dryRun) {
        await prisma.itemPedido.create({
          data: {
            pedidoId: p.id,
            slug: itf.slug,
            // Colunas legadas: caixas=0, m2=0, precoM2=0 (placeholder — não são usadas para fitas)
            caixas: 0,
            m2: 0,
            precoM2: 0,
            subtotal,
            // Colunas novas (013)
            unidade: 'rolo',
            quantidade: itf.rolos,
            precoUnitario: precoRolo,
            detalhe: { faixaMin: itf.faixaMin, faixaMax: itf.faixaMax },
          },
        });
      }

      fitasCopied++;
    }
  }

  console.log(`\nItens de fita copiados: ${fitasCopied}`);

  // ── 3. Verificação de sanidade ───────────────────────────────────────────
  if (!dryRun) {
    const nullCount = await prisma.itemPedido.count({ where: { unidade: null } });
    console.log(`\nVerificação pós-backfill:`);
    console.log(`  itens com unidade IS NULL: ${nullCount}`);
    if (nullCount > 0) {
      console.error(`  ⚠ ATENÇÃO: ${nullCount} item(ns) ainda sem unidade — investigar.`);
    }
  }

  console.log(dryRun ? '\n*** DRY RUN — nenhuma alteração feita ***' : '\nBackfill concluído.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
