// Runnable check da invariante de origem (012, T014 · data-model §1).
// Run: node --import tsx test/negocio-origem.test.mjs
import assert from 'node:assert/strict';
import { validarOrigemNegocio } from '../src/lib/carteira/origem-negocio.ts';

const ok = (n) => validarOrigemNegocio(n).ok;

// ── As 4 combinações de (pedidoId, vendaId): só 2 podem gravar ────────────────
// 1. só pedidoId  → carrinho da ROI Labs (porcelanato/fitas)
assert.equal(ok({ origem: 'pedido', pedidoId: 'ped_1', vendaId: null }), true);
// 2. só vendaId   → venda no gateway do parceiro
assert.equal(ok({ origem: 'webhook', pedidoId: null, vendaId: 'vnd_1' }), true);
// 3. os dois      → um negócio tem UMA origem
assert.equal(ok({ origem: 'pedido', pedidoId: 'ped_1', vendaId: 'vnd_1' }), false);
assert.equal(ok({ origem: 'webhook', pedidoId: 'ped_1', vendaId: 'vnd_1' }), false);
// 4. nenhum       → o estado que `pedidoId` anulável abriu, e o que este teste existe p/ fechar
assert.equal(ok({ origem: 'pedido', pedidoId: null, vendaId: null }), false);
assert.equal(ok({ origem: 'webhook', pedidoId: null, vendaId: null }), false);

// ── origem tem de casar com a coluna preenchida ───────────────────────────────
// Um negócio de webhook rotulado 'pedido' passaria despercebido em toda consulta que
// filtra por origem — é a landmine do freteMotivo com outra roupa.
assert.equal(ok({ origem: 'pedido', pedidoId: null, vendaId: 'vnd_1' }), false);
assert.equal(ok({ origem: 'webhook', pedidoId: 'ped_1', vendaId: null }), false);

// ── origem fora do domínio ────────────────────────────────────────────────────
assert.equal(ok({ origem: '', pedidoId: 'ped_1', vendaId: null }), false);
assert.equal(ok({ origem: 'legado', pedidoId: 'ped_1', vendaId: null }), false);

// ── o motivo é legível (vai para log/resposta de erro, não só para o `ok`) ─────
const r = validarOrigemNegocio({ origem: 'webhook', pedidoId: 'ped_1', vendaId: 'vnd_1' });
assert.equal(r.ok, false);
assert.match(r.motivo, /UMA origem/);

console.log('negocio-origem.test.mjs: all assertions passed');
