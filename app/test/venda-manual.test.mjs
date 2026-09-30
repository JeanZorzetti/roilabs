// Runnable check da leitura de venda manual (30/09/2026).
// Run: node --import tsx test/venda-manual.test.mjs
import assert from 'node:assert/strict';
import { lerVendaManual, lerValor } from '../src/lib/carteira/venda-manual.ts';

const HOJE = '2026-09-30';
const base = { parceiroId: 'p1', orcamento: '#0390', data: '2026-09-07', cliente: ' Elevaa 3D Ltda ', valor: '387,80' };
const ler = (extra) => lerVendaManual({ ...base, ...extra }, HOJE);

// ── valor: formato brasileiro e ponto decimal ──
assert.equal(lerValor('387,80'), 387.8);
assert.equal(lerValor('1.234,56'), 1234.56);
assert.equal(lerValor('R$ 409,80'), 409.8);
assert.equal(lerValor('1234.5'), 1234.5);
assert.equal(lerValor(387.8), 387.8);
assert.ok(Number.isNaN(lerValor('12,345'))); // 3 casas depois da vírgula não é dinheiro
assert.ok(Number.isNaN(lerValor('abc')));

// ── caso feliz: '#' sai do nº, espaços saem do cliente, canal padrão WhatsApp ──
const r = ler({});
assert.equal(r.ok, true);
assert.deepEqual(r.venda, {
  parceiroId: 'p1', orcamento: '0390', data: '2026-09-07', cliente: 'Elevaa 3D Ltda',
  clienteDoc: null, valor: 387.8, canal: 'WhatsApp',
});

// ── documento: normaliza e exige 11 ou 14 dígitos ──
assert.equal(ler({ clienteDoc: '12.345.678/0001-90' }).venda.clienteDoc, '12345678000190');
assert.equal(ler({ clienteDoc: '123' }).ok, false);

// ── recusas, cada uma com motivo legível ──
assert.match(ler({ parceiroId: '' }).motivo, /parceiro/);
assert.match(ler({ orcamento: '  ' }).motivo, /orçamento/);
assert.match(ler({ data: '07/09/2026' }).motivo, /data/);
assert.match(ler({ data: '2026-10-01' }).motivo, /futura/);
assert.match(ler({ cliente: '' }).motivo, /cliente/);
assert.match(ler({ valor: '0' }).motivo, /valor/);
assert.match(ler({ valor: '-5' }).motivo, /valor/);

console.log('venda-manual.test.mjs: all assertions passed');
