// Runnable check for lib/success-fee.ts: calcularFaturaMensal (regras de dinheiro, sem I/O).
// Run: node --import tsx test/success-fee.test.mjs
import assert from 'node:assert/strict';
import { calcularFaturaMensal } from '../src/lib/success-fee.ts';

function negocio(overrides = {}) {
  return {
    id: 'n1',
    valor: 1000,
    taxaAplicada: 0.1,
    estagio: 'ganho',
    faturavel: true,
    pedidoReembolsado: false,
    jaFaturado: false,
    ...overrides,
  };
}

// ── inclui ganho + faturável + não reembolsado + não faturado ─────────────────
{
  const r = calcularFaturaMensal([negocio({ id: 'a', valor: 1000, taxaAplicada: 0.1 })]);
  assert.equal(r.base, 1000);
  assert.equal(r.valor, 100, 'valor = valor × taxaAplicada');
  assert.deepEqual(r.negocioIds, ['a']);
}

// ── 2 negócios do mesmo cliente novo: 15% (aquisição) + 10% (recorrência) ──────
// 1000×0.15=150 + 1000×0.10=100 → fatura 250, base 2000 (contrato faturas.md).
{
  const r = calcularFaturaMensal([
    negocio({ id: 'a', valor: 1000, taxaAplicada: 0.15 }),
    negocio({ id: 'b', valor: 1000, taxaAplicada: 0.1 }),
  ]);
  assert.equal(r.base, 2000);
  assert.equal(r.valor, 250, 'soma por negócio, não taxa única sobre o total');
  assert.deepEqual(r.negocioIds, ['a', 'b']);
}

// ── exclui não-ganho (repassado/aceito/perdido) ───────────────────────────────
{
  const r = calcularFaturaMensal([
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
  const r = calcularFaturaMensal([negocio({ id: 'a', faturavel: false })]);
  assert.deepEqual(r.negocioIds, []);
}

// ── exclui pedido reembolsado ──────────────────────────────────────────────────
{
  const r = calcularFaturaMensal([negocio({ id: 'a', pedidoReembolsado: true })]);
  assert.deepEqual(r.negocioIds, []);
}

// ── exclui já faturado (não recobra — SC-006) ──────────────────────────────────
{
  const r = calcularFaturaMensal([negocio({ id: 'a', jaFaturado: true })]);
  assert.deepEqual(r.negocioIds, []);
}

// ── soma múltiplos negócios elegíveis com taxas distintas, ignora os demais ────
{
  const r = calcularFaturaMensal([
    negocio({ id: 'a', valor: 1000, taxaAplicada: 0.15 }),
    negocio({ id: 'b', valor: 500, taxaAplicada: 0.1 }),
    negocio({ id: 'c', valor: 300, faturavel: false }),
    negocio({ id: 'd', valor: 200, estagio: 'perdido' }),
  ]);
  assert.equal(r.base, 1500);
  assert.equal(r.valor, 200, '150 + 50');
  assert.deepEqual(r.negocioIds, ['a', 'b']);
}

// ── arredondamento por negócio, sem drift de centavos (SC-002) ────────────────
// 3 × (33.33 × 0.15 = 4.9995 → 5.00) → 15.00; sem arredondar por negócio daria 14.9985.
{
  const r = calcularFaturaMensal([
    negocio({ id: 'a', valor: 33.33, taxaAplicada: 0.15 }),
    negocio({ id: 'b', valor: 33.33, taxaAplicada: 0.15 }),
    negocio({ id: 'c', valor: 33.33, taxaAplicada: 0.15 }),
  ]);
  assert.equal(r.base, 99.99);
  assert.equal(r.valor, 15, 'money() por negócio antes de somar');
}

// ── FR-005: taxa congelada por negócio — o cálculo não recebe taxa do parceiro ─────
// Dois negócios de mesmo valor com taxas snapshot distintas (ex.: um criado antes, outro
// depois de o parceiro mudar a taxa) mantêm cada um a SUA taxa; nada aqui lê a taxa viva.
{
  const r = calcularFaturaMensal([
    negocio({ id: 'antigo', valor: 1000, taxaAplicada: 0.15 }),
    negocio({ id: 'novo', valor: 1000, taxaAplicada: 0.2 }),
  ]);
  assert.equal(r.valor, 350, 'cada negócio usa seu próprio taxaAplicada (snapshot)');
}

console.log('success-fee.test.mjs: all assertions passed');
