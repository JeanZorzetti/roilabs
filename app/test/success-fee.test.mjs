// Runnable check for lib/success-fee.ts: calcularFaturaMensal (regras de dinheiro, sem I/O).
// Run: node --import tsx test/success-fee.test.mjs
import assert from 'node:assert/strict';
import { calcularFaturaMensal } from '../src/lib/success-fee.ts';

function negocio(overrides = {}) {
  return {
    id: 'n1',
    valor: 1000,
    estagio: 'ganho',
    faturavel: true,
    pedidoReembolsado: false,
    jaFaturado: false,
    ...overrides,
  };
}

// ── inclui ganho + faturável + não reembolsado + não faturado ─────────────────
{
  const r = calcularFaturaMensal(0.1, [negocio({ id: 'a', valor: 1000 })]);
  assert.equal(r.base, 1000);
  assert.equal(r.valor, 100, 'valor = base × pct');
  assert.deepEqual(r.negocioIds, ['a']);
}

// ── exclui não-ganho (repassado/aceito/perdido) ───────────────────────────────
{
  const r = calcularFaturaMensal(0.1, [
    negocio({ id: 'a', estagio: 'repassado' }),
    negocio({ id: 'b', estagio: 'aceito' }),
    negocio({ id: 'c', estagio: 'perdido' }),
  ]);
  assert.equal(r.base, 0);
  assert.equal(r.valor, 0);
  assert.deepEqual(r.negocioIds, []);
}

// ── exclui isento (faturavel=false) ────────────────────────────────────────────
{
  const r = calcularFaturaMensal(0.1, [negocio({ id: 'a', faturavel: false })]);
  assert.deepEqual(r.negocioIds, []);
}

// ── exclui pedido reembolsado ──────────────────────────────────────────────────
{
  const r = calcularFaturaMensal(0.1, [negocio({ id: 'a', pedidoReembolsado: true })]);
  assert.deepEqual(r.negocioIds, []);
}

// ── exclui já faturado (não recobra — SC-006) ──────────────────────────────────
{
  const r = calcularFaturaMensal(0.1, [negocio({ id: 'a', jaFaturado: true })]);
  assert.deepEqual(r.negocioIds, []);
}

// ── soma múltiplos negócios elegíveis, ignora os demais ───────────────────────
{
  const r = calcularFaturaMensal(0.2, [
    negocio({ id: 'a', valor: 1000 }),
    negocio({ id: 'b', valor: 500 }),
    negocio({ id: 'c', valor: 300, faturavel: false }),
    negocio({ id: 'd', valor: 200, estagio: 'perdido' }),
  ]);
  assert.equal(r.base, 1500);
  assert.equal(r.valor, 300);
  assert.deepEqual(r.negocioIds, ['a', 'b']);
}

// ── arredondamento de dinheiro (2 casas) ───────────────────────────────────────
{
  const r = calcularFaturaMensal(0.1, [negocio({ id: 'a', valor: 33.333 })]);
  assert.equal(r.base, 33.33);
  assert.equal(r.valor, 3.33);
}

console.log('success-fee.test.mjs: all assertions passed');
