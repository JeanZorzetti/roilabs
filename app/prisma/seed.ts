// Idempotent seed of the chair map (owner convention: seeds re-run safely).
import { PrismaClient } from '@prisma/client';
import { DEFAULT_SEATS, PROJETOS_CADEIRA } from '../src/lib/seats';

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
  console.log(`seeded ${DEFAULT_SEATS.length} cadeiras de nicho`);

  // 012 (T051/T052/T066): as cadeiras de PROJETO. `slug` e `gateway` são metadados do SEED,
  // não colunas — o gateway de verdade é a CredencialGateway, cadastrada por cadeira (T033).
  // Casa por `niche` de propósito: `atma` já existe como cadeira de nicho, e criar de novo
  // duplicaria a mesma cadeira (card ≠ projeto ≠ repositório).
  let criadas = 0;
  for (const p of PROJETOS_CADEIRA) {
    const { slug: _slug, gateway: _gateway, ...dados } = p;
    const existing = await prisma.cadeira.findFirst({ where: { niche: dados.niche } });
    if (existing) {
      // Só o que a 012 governa. `status`, `open` e `ordem` de cadeira já existente ficam
      // como estão: mudá-los aqui reescreveria curadoria feita à mão no /admin.
      // `siteUrl`/`repoUrl` entram porque a cadeira de nicho nasceu sem eles (o SEED é de
      // 011) e sem eles o dedupe de FR-011 não tem o que comparar. Não são curadoria: são
      // identidade do projeto, e a fonte é o roihub.
      await prisma.cadeira.update({
        where: { id: existing.id },
        data: {
          estado: dados.estado,
          daCasa: dados.daCasa,
          exibirDaCasa: dados.exibirDaCasa,
          siteUrl: dados.siteUrl,
          repoUrl: dados.repoUrl,
        },
      });
    } else {
      await prisma.cadeira.create({ data: { ...dados, open: false, ordem: DEFAULT_SEATS.length + criadas } });
      criadas++;
    }
  }
  console.log(`seeded ${PROJETOS_CADEIRA.length} cadeiras de projeto (${criadas} novas)`);

  const daCasa = await prisma.cadeira.count({ where: { daCasa: true } });
  const exibe = await prisma.cadeira.count({ where: { exibirDaCasa: true } });
  console.log(`cadeiras da casa: ${daCasa} · exibidas como da casa: ${exibe} (FR-010a espera 3)`);

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
