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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
