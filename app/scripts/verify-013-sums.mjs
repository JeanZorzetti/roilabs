// Verificador da migração 013 (SC-003). Consulta os pedidos no Postgres, soma totais,
// e reporta discrepâncias. Rodar ANTES e DEPOIS do backfill — diff vazio é a prova.
//
// Esperado: 6 pedidos, total R$ 22.091,89.
//
// Run: node --import tsx scripts/verify-013-sums.mjs
// Output: texto comparável por `diff`.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pedidos = await prisma.pedido.findMany({
    orderBy: { createdAt: 'asc' },
    include: { itens: true, itensFita: true },
  });

  console.log(`=== verify-013-sums — ${new Date().toISOString().slice(0, 19)} ===`);
  console.log(`Pedidos: ${pedidos.length}`);
  console.log();

  let totalGeral = 0;
  let itensUnidadeNull = 0;
  let itensInvarianteQuebrada = 0;
  let itensFitaNaoCopiados = 0;

  for (const p of pedidos) {
    const total = Number(p.total);
    totalGeral += total;

    console.log(`--- Pedido ${p.id} (${p.vertical}) ---`);
    console.log(`  total: R$ ${total.toFixed(2)}`);
    console.log(`  itens (porcelanato): ${p.itens.length}`);
    console.log(`  itens (fita): ${p.itensFita.length}`);

    for (const it of p.itens) {
      const precoM2 = Number(it.precoM2);
      const m2 = Number(it.m2);
      const subtotal = Number(it.subtotal);
      const caixas = it.caixas;

      console.log(`    [item] ${it.slug}: ${caixas}cx, ${m2.toFixed(2)}m², R$${precoM2.toFixed(2)}/m², subtotal R$${subtotal.toFixed(2)}`);

      // Verificações do item unificado (013)
      if (it.unidade === null || it.unidade === undefined) {
        itensUnidadeNull++;
      }
      if (it.unidade && it.quantidade != null && it.precoUnitario != null) {
        const qtu = Number(it.quantidade);
        const pru = Number(it.precoUnitario);
        const esperado = Math.round(qtu * pru * 100) / 100;
        if (Math.abs(esperado - subtotal) > 0.01) {
          console.log(`    ⚠ INVARIANTE: ${qtu} × ${pru} = ${esperado} ≠ ${subtotal}`);
          itensInvarianteQuebrada++;
        }
      }
    }

    for (const it of p.itensFita) {
      const precoRolo = Number(it.precoRolo);
      const subtotal = Number(it.subtotal);
      console.log(`    [fita] ${it.slug}: ${it.rolos} rolos, R$${precoRolo.toFixed(2)}/rolo, faixa ${it.faixaMin}${it.faixaMax === null ? '+' : `–${it.faixaMax}`}, subtotal R$${subtotal.toFixed(2)}`);
    }

    // Conferir se itens de fita foram copiados para itens_pedido (após backfill)
    if (p.vertical === 'fitas' && p.itensFita.length > 0) {
      const itensCopied = p.itens.filter((it) => it.unidade === 'rolo');
      if (itensCopied.length < p.itensFita.length) {
        const faltam = p.itensFita.length - itensCopied.length;
        console.log(`    ⚠ ${faltam} item(ns) de fita NÃO copiados para itens_pedido`);
        itensFitaNaoCopiados += faltam;
      }
    }
  }

  const totalFmt = (Math.round(totalGeral * 100) / 100).toFixed(2);
  console.log();
  console.log(`=== SUMÁRIO ===`);
  console.log(`Total geral: R$ ${totalFmt}`);
  console.log(`itens com unidade IS NULL ............ ${itensUnidadeNull}`);
  console.log(`itens onde quantidade × unitário ≠ subtotal ... ${itensInvarianteQuebrada}`);
  console.log(`itens de fita não copiados ........... ${itensFitaNaoCopiados}`);

  if (totalFmt !== '22091.89') {
    console.log(`\n⚠ TOTAL DIVERGE DO ESPERADO (R$ 22.091,89) — parar e investigar.`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
