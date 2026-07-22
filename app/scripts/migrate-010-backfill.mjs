// Backfill da 010 (success fee com duas taxas). Idempotente — rode quantas vezes quiser.
//   DATABASE_URL=... node scripts/migrate-010-backfill.mjs
//
// Copia a taxa antiga (comissaoPct, deprecada) para as duas novas em parceiros que ainda
// não as têm. Nenhuma fatura é tocada — valores emitidos ficam intactos (FR-006/SC-004).
//
// HISTÓRICO — a 2ª etapa (backfill de NegocioOriginado.taxaAplicada/classificacao/clienteDoc
// nos negócios abertos) rodou no roilabs_db em 2026-07-22 com 0 negócios abertos, e logo
// depois `taxaAplicada` virou NOT NULL (T021). Por isso ela não vive mais aqui: com a coluna
// NOT NULL o filtro `taxaAplicada: null` é inválido no Prisma. Se um dia migrar OUTRO banco
// que ainda tenha negócios sem taxa, faça na ordem: coluna nullable → backfill dos negócios
// (taxaAplicada = comissaoPct do parceiro, classificacao='legado') → ALTER para NOT NULL.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
