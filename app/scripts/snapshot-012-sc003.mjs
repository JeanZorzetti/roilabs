// Linha de base de SC-003 — "zero regressão nos caminhos de dinheiro existentes".
// Run: node --import tsx scripts/snapshot-012-sc003.mjs [antes|depois]
//
// Roda DUAS vezes, de uma máquina que alcança o host:
//   1. `antes`  — ANTES do `prisma db push` da 012 (T003a)
//   2. `depois` — DEPOIS de tudo entregue (T072a), e então `--diff`
//
// Por que existe: sem o snapshot tirado antes, "zero regressão" é afirmação, não
// medição. Grava arquivo VERSIONADO (entra no commit) para o diff ser auditável
// meses depois, não um arquivo temporário que some.
import { PrismaClient } from '@prisma/client';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Relativo a `app/` — os scripts rodam de lá (`node --import tsx scripts/…`).
const DIR = '../specs/012-carteira-cadeiras-ecommerce/snapshots';
const modo = process.argv[2] ?? 'antes';
if (!['antes', 'depois', 'diff'].includes(modo)) {
  console.error('uso: node --import tsx scripts/snapshot-012-sc003.mjs [antes|depois|diff]');
  process.exit(1);
}

const arquivo = (m) => `${DIR}/sc003-${m}.json`;

/** Decimal do Prisma → string, para o diff não depender de float. */
const dec = (v) => (v == null ? null : String(v));

async function coletar() {
  const prisma = new PrismaClient();
  const pedidos = await prisma.pedido.findMany({
    select: { id: true, total: true, frete: true, statusPagamento: true },
    orderBy: { id: 'asc' },
  });
  const negocios = await prisma.negocioOriginado.findMany({
    select: { id: true, pedidoId: true, valor: true, taxaAplicada: true },
    orderBy: { id: 'asc' },
  });
  await prisma.$disconnect();
  return {
    tiradoEm: new Date().toISOString(),
    contagem: { pedidos: pedidos.length, negocios: negocios.length },
    pedidos: pedidos.map((p) => ({
      id: p.id,
      total: dec(p.total),
      frete: dec(p.frete),
      status: p.statusPagamento,
    })),
    negocios: negocios.map((n) => ({
      id: n.id,
      pedidoId: n.pedidoId,
      valor: dec(n.valor),
      taxaAplicada: dec(n.taxaAplicada),
    })),
  };
}

function diff() {
  for (const m of ['antes', 'depois']) {
    if (!existsSync(arquivo(m))) {
      console.error(`FALTA ${arquivo(m)} — rode o snapshot '${m}' primeiro.`);
      process.exit(1);
    }
  }
  const a = JSON.parse(readFileSync(arquivo('antes'), 'utf8'));
  const b = JSON.parse(readFileSync(arquivo('depois'), 'utf8'));

  const problemas = [];
  const idx = (rows) => new Map(rows.map((r) => [r.id, r]));

  // Pedido: nenhum valor pode ter mudado, e nenhum pode ter sumido.
  const pDepois = idx(b.pedidos);
  for (const antes of a.pedidos) {
    const dep = pDepois.get(antes.id);
    if (!dep) { problemas.push(`pedido ${antes.id}: SUMIU`); continue; }
    for (const campo of ['total', 'frete', 'status']) {
      if (antes[campo] !== dep[campo]) {
        problemas.push(`pedido ${antes.id}: ${campo} ${antes[campo]} → ${dep[campo]}`);
      }
    }
  }

  // Negócio: valor e taxaAplicada congelados na criação (010) — não podem mudar.
  // pedidoId também não: linha antiga tem de continuar com o pedido dela (o backfill
  // da 012 só grava `origem`, nunca mexe em pedidoId).
  const nDepois = idx(b.negocios);
  for (const antes of a.negocios) {
    const dep = nDepois.get(antes.id);
    if (!dep) { problemas.push(`negocio ${antes.id}: SUMIU`); continue; }
    for (const campo of ['valor', 'taxaAplicada', 'pedidoId']) {
      if (antes[campo] !== dep[campo]) {
        problemas.push(`negocio ${antes.id}: ${campo} ${antes[campo]} → ${dep[campo]}`);
      }
    }
  }

  console.log(`antes:  ${a.contagem.pedidos} pedidos · ${a.contagem.negocios} negócios (${a.tiradoEm})`);
  console.log(`depois: ${b.contagem.pedidos} pedidos · ${b.contagem.negocios} negócios (${b.tiradoEm})`);
  // Linha nova de negócio é ESPERADA (é o que a 012 constrói); linha nova de pedido também
  // (o e-commerce segue vendendo). O critério de SC-003 é sobre as linhas que JÁ existiam.
  console.log(`novas desde o corte: ${b.contagem.pedidos - a.contagem.pedidos} pedido(s) · ${b.contagem.negocios - a.contagem.negocios} negócio(s)`);

  if (problemas.length) {
    console.error(`\nSC-003 REPROVADO — ${problemas.length} regressão(ões):`);
    for (const p of problemas) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
  console.log('\nSC-003 OK: nenhuma linha pré-existente mudou de valor.');
}

if (modo === 'diff') {
  diff();
} else {
  const snap = await coletar();
  mkdirSync(dirname(arquivo(modo)), { recursive: true });
  writeFileSync(arquivo(modo), JSON.stringify(snap, null, 2) + '\n');
  console.log(`snapshot '${modo}' gravado em ${arquivo(modo)}`);
  console.log(`  pedidos:  ${snap.contagem.pedidos}`);
  console.log(`  negócios: ${snap.contagem.negocios}`);
}
