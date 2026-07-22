// Runnable check for lib/doc.ts (010). Run: node --import tsx test/doc.test.mjs
import assert from 'node:assert/strict';
import { normalizarDoc, validarDoc } from '../src/lib/doc.ts';

// ── normalizarDoc: pontuação some ──────────────────────────────────────────────
assert.equal(normalizarDoc('123.456.789-09'), '12345678909');
assert.equal(normalizarDoc('12.345.678/0001-95'), '12345678000195');
assert.equal(normalizarDoc(null), '');
assert.equal(normalizarDoc(undefined), '');
assert.equal(normalizarDoc('  '), '');

// ── validarDoc: só 11 (CPF) ou 14 (CNPJ) dígitos ──────────────────────────────
assert.equal(validarDoc('12345678909'), true, 'CPF 11 díg');
assert.equal(validarDoc('12345678000195'), true, 'CNPJ 14 díg');
assert.equal(validarDoc('123'), false, 'curto demais');
assert.equal(validarDoc('123456789012'), false, '12 díg inválido');
assert.equal(validarDoc(''), false, 'vazio');

console.log('doc.test.mjs: all assertions passed');
