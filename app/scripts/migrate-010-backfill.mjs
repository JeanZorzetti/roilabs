// Backfill da 010 (success fee com duas taxas). Idempotente — rode quantas vezes quiser.
// Roda MANUAL num host que alcança o roilabs_db, DEPOIS do `prisma db push` (D6/T020):
//   DATABASE_URL=... node scripts/migrate-010-backfill.mjs
//
// 1. Parceiros sem as taxas novas → aquisicao = recorrencia = comissaoPct (a taxa antiga).
// 2. Negócios abertos (faturaId=null, taxaAplicada=null) → taxaAplicada = comissaoPct do
//    parceiro, classificacao='legado', clienteDoc = doc do pedido (se houver).
// 3. Negócios já faturados / faturas emitidas: NÃO toca (valores congelados).
// Nenhuma fatura existente muda de valor (FR-006/SC-004).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const soDigitos = (v) => (v ?? '').replace(/\D/g, '');

async function main() {
  // ── 1. Parceiros: copia a taxa antiga para as duas novas (só quem ainda não tem) ──
  const parceiros = await prisma.parceiro.findMany({
    where: { comissaoPct: { not: null }, comissaoAquisicao: null },
  });
  for (const p of parceiros) {
    await prisma.parceiro.update({
      where: { id: p.id },
      data: { comissaoAquisicao: p.comissaoPct, comissaoRecorrencia: p.comissaoPct },
    });
  }
  console.log(`parceiros com taxas backfilled: ${parceiros.length}`);

  // ── 2. Negócios abertos sem taxa → congela a taxa antiga do parceiro + 'legado' ──
  const abertos = await prisma.negocioOriginado.findMany({
    where: { faturaId: null, taxaAplicada: null },
    include: { parceiro: { select: { comissaoPct: true } }, pedido: { select: { compradorDoc: true } } },
  });
  let backfilled = 0;
  const semTaxa = [];
  for (const n of abertos) {
    if (n.parceiro.comissaoPct === null) {
      semTaxa.push(n.id); // parceiro sem taxa antiga — não dá pra inferir; reportar
      continue;
    }
    const doc = soDigitos(n.pedido.compradorDoc);
    await prisma.negocioOriginado.update({
      where: { id: n.id },
      data: { taxaAplicada: n.parceiro.comissaoPct, classificacao: 'legado', clienteDoc: doc || null },
    });
    backfilled++;
  }
  console.log(`negócios abertos backfilled: ${backfilled}`);
  if (semTaxa.length) {
    console.warn(`⚠ ${semTaxa.length} negócio(s) sem taxa (parceiro sem comissaoPct) — resolva ANTES do T021 (NOT NULL): ${semTaxa.join(', ')}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
