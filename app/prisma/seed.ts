// Idempotent seed of the chair map (owner convention: seeds re-run safely).
import { PrismaClient } from '@prisma/client';
import { DEFAULT_SEATS } from '../src/lib/seats';

const prisma = new PrismaClient();

async function main() {
  for (let i = 0; i < DEFAULT_SEATS.length; i++) {
    const s = DEFAULT_SEATS[i];
    const existing = await prisma.cadeira.findFirst({ where: { niche: s.niche } });
    if (existing) {
      await prisma.cadeira.update({ where: { id: existing.id }, data: { ordem: i } });
    } else {
      await prisma.cadeira.create({ data: { ...s, ordem: i } });
    }
  }
  console.log(`seeded ${DEFAULT_SEATS.length} cadeiras`);

  // Idempotent seed of the global cost-center params (doc defaults: markup 30%, comissao 10%,
  // aliqIntermediacao 10.2%, aliqWL 6.2%). Stored as fractions [0,1].
  // ponytail: findFirst+create (not upsert) because Prisma compound unique with null chave
  // doesn't support the generated *CompoundUniqueInput where clause safely across versions.
  const existingGlobal = await prisma.parametroCentroCusto.findFirst({
    where: { escopo: 'global', chave: null },
  });
  if (!existingGlobal) {
    await prisma.parametroCentroCusto.create({
      data: {
        escopo: 'global',
        chave: null,
        markup: 0.3,
        comissao: 0.1,
        aliqIntermediacao: 0.102,
        aliqWL: 0.062,
        cenario: 'base',
      },
    });
    console.log('seeded global cost-center params');
  } else {
    console.log('global cost-center params already seeded — skipped');
  }

  // Seed idempotente do OBRA10 (continuidade — FR-010): mesmos parâmetros do knob hard-coded
  // que este cupom substitui (percentual 10, mínimo 500, ativo).
  const existingCupom = await prisma.cupom.findFirst({ where: { codigo: 'OBRA10' } });
  if (!existingCupom) {
    await prisma.cupom.create({
      data: { codigo: 'OBRA10', tipo: 'percentual', valor: 10, minimo: 500, ativo: true },
    });
    console.log('seeded OBRA10 coupon');
  } else {
    console.log('OBRA10 coupon already seeded — skipped');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
