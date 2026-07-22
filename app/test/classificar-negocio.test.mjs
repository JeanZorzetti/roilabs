// Runnable check for lib/classificar-negocio.ts (010, D3).
// Run: node --import tsx test/classificar-negocio.test.mjs
import assert from 'node:assert/strict';
import { classificarNegocio } from '../src/lib/classificar-negocio.ts';

// ── doc vazio → aquisição (mesmo com histórico) ───────────────────────────────
assert.equal(classificarNegocio('', ['12345678909']), 'aquisicao');

// ── doc com anterior não-perdido → recorrência ────────────────────────────────
assert.equal(classificarNegocio('12345678909', ['12345678909']), 'recorrencia');

// ── único anterior é perdido (não entra na lista) → aquisição ─────────────────
// A rota filtra os perdidos/reembolsados fora de docsAnteriores; então uma lista
// sem o doc = o inaugural voltou a ser aquisição (FR-008).
assert.equal(classificarNegocio('12345678909', []), 'aquisicao');

// ── doc diferente do histórico → aquisição ────────────────────────────────────
assert.equal(classificarNegocio('99999999999', ['12345678909']), 'aquisicao');

console.log('classificar-negocio.test.mjs: all assertions passed');
