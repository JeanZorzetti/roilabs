// Runnable check for lib/classificar-negocio.ts (010, D3).
// Run: node --import tsx test/classificar-negocio.test.mjs
import assert from 'node:assert/strict';
import { classificarNegocio } from '../src/lib/classificar-negocio.ts';
import { classificarVendaParceiro } from '../src/lib/carteira/classificar-venda.ts';

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

// ─────────────────────────────────────────────────────────────────────────────
// 012 (T017a) — o envelope da venda de gateway. A regra acima fica INTACTA; o que
// muda é que renovação de assinatura nunca chega até ela.
// ─────────────────────────────────────────────────────────────────────────────
const venda = (o) => classificarVendaParceiro({
  recorrente: false, clienteDoc: '', clienteRef: '', docsAnteriores: [], refsAnteriores: [], ...o,
});

// ⚠️ O CASO QUE MOTIVOU A REGRA 1 — renovação de assinatura SEM CPF.
// MP e Stripe entregam e-mail e quase nunca documento. Sem a regra 1, esta linha cairia
// na regra crua da 010 ("sem doc → aquisição") e cobraria 15% em TODA renovação mensal,
// contra os 10% que o contrato do parceiro promete.
assert.equal(venda({ recorrente: true, clienteRef: 'cliente@exemplo.com' }), 'recorrencia');
// Nem doc, nem ref, nem histórico: renovação continua sendo recorrência — a regra 1 não
// depende de identificar o cliente.
assert.equal(venda({ recorrente: true }), 'recorrencia');
// E o contrafactual que prova que a regra 1 é quem decide: MESMA venda, `recorrente` falso.
assert.equal(venda({ recorrente: false, clienteRef: 'cliente@exemplo.com' }), 'aquisicao');

// ── regra 2: sem doc, o ref do gateway é o fallback ───────────────────────────
assert.equal(venda({ clienteRef: 'cliente@exemplo.com', refsAnteriores: ['cliente@exemplo.com'] }), 'recorrencia');
assert.equal(venda({ clienteRef: 'outro@exemplo.com', refsAnteriores: ['cliente@exemplo.com'] }), 'aquisicao');

// ── regra 2: com doc, o doc GANHA do ref (chaves de espaços diferentes não se cruzam) ──
// O ref bate no histórico de refs, mas há doc — e o doc não bate. É aquisição: casar
// doc daqui com ref de lá seria comparar coisas diferentes.
assert.equal(
  venda({ clienteDoc: '99999999999', clienteRef: 'cliente@exemplo.com', docsAnteriores: ['12345678909'], refsAnteriores: ['cliente@exemplo.com'] }),
  'aquisicao',
);
assert.equal(venda({ clienteDoc: '12345678909', docsAnteriores: ['12345678909'] }), 'recorrencia');

// ── regra 3: compra única, sem doc e sem ref → a regra da 010, intacta ────────
assert.equal(venda({}), 'aquisicao');

console.log('classificar-negocio.test.mjs: all assertions passed');
