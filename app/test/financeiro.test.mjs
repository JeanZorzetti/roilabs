// Runnable check for lib/financeiro.ts: aggregation, snapshot stability, fallback, modalidade.
// Run: node --import tsx test/financeiro.test.mjs
import assert from 'node:assert/strict';
import { agregarPorMes } from '../src/lib/financeiro.ts';

function item(pedidoId, createdAt, subtotal, opts = {}) {
  return {
    pedidoId,
    createdAt: new Date(createdAt),
    subtotal,
    pisoSnapshot: opts.piso ?? null,
    modalidadeSnapshot: opts.modalidade ?? null,
    comissaoSnapshot: opts.comissao ?? null,
    aliqIntermediacaoSnapshot: opts.aliqInter ?? null,
    aliqWLSnapshot: opts.aliqWL ?? null,
    slug: opts.slug ?? 'produto-a',
    skuModalidadeAlvo: opts.skuModalidade ?? null,
  };
}

const global_ = { markup: 0.3, comissao: 0.1, aliqIntermediacao: 0.102, aliqWL: 0.062 };
const snapshot = { piso: 7000, modalidade: 'intermediacao', comissao: 0.1, aliqInter: 0.102, aliqWL: 0.062 };

// ── Test 1: aggregation by month ──────────────────────────────────────────────
const itens1 = [
  item('p1', '2026-05-10', 9100, snapshot),
  item('p1', '2026-05-10', 9100, snapshot), // 2nd item of same pedido
  item('p2', '2026-06-15', 9100, snapshot),
];
const meses1 = agregarPorMes(itens1, global_);
assert.equal(meses1.length, 2, '2 meses distintos');
assert.equal(meses1[0].mes, '2026-06', 'mais recente primeiro');
assert.equal(meses1[1].mes, '2026-05', 'mais antigo segundo');
assert.equal(meses1[1].pedidos, 1, 'maio: 1 pedido com 2 itens');
assert.equal(meses1[0].pedidos, 1, 'junho: 1 pedido');
assert.ok(Math.abs(meses1[1].gmvPago - 18200) < 0.01, 'maio GMV = 2 × 9100');
assert.equal(meses1[1].semSnapshot, 0, 'nenhum sem snapshot');

// ── Test 2: snapshot stability ────────────────────────────────────────────────
const itemSnap = item('p3', '2026-04-01', 9100, snapshot);
const [mesBefore] = agregarPorMes([itemSnap], global_);
const globalChanged = { markup: 0.2, comissao: 0.15, aliqIntermediacao: 0.15, aliqWL: 0.09 };
const [mesAfter] = agregarPorMes([itemSnap], globalChanged);
assert.equal(
  mesBefore.liquidoInter,
  mesAfter.liquidoInter,
  'snapshot estável: mudar parâmetros vigentes não altera mês passado',
);

// ── Test 3: fallback sem snapshot ─────────────────────────────────────────────
const itemNoSnap = item('p4', '2026-04-01', 9100);
const [mesFallback] = agregarPorMes([itemNoSnap], global_);
assert.equal(mesFallback.semSnapshot, 1, 'item sem snapshot incrementa semSnapshot');
assert.ok(mesFallback.liquidoInter > 0, 'fallback calcula líquido com parâmetros vigentes');

// ── Test 4: soma por modalidade ───────────────────────────────────────────────
const itensModal = [
  item('p5', '2026-03-01', 9100, { ...snapshot, modalidade: 'intermediacao' }),
  item('p5', '2026-03-01', 9100, { ...snapshot, modalidade: 'wl' }),
];
const [mesModal] = agregarPorMes(itensModal, global_);
assert.ok(mesModal.liquidoInter > 0, 'líquido intermediação > 0');
assert.ok(mesModal.liquidoWL > 0, 'líquido WL > 0');
assert.equal(mesModal.pedidos, 1, '2 itens do mesmo pedido = 1 pedido');

// ── Test 5: mês sem dados → sem entrada no resultado ─────────────────────────
const mesesVazio = agregarPorMes([], global_);
assert.equal(mesesVazio.length, 0, 'sem itens: array vazio sem erro');

console.log('financeiro.test.mjs: all assertions passed');
