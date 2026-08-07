// Runnable check de REGRESSÃO da assinatura do MP (012, T025a).
// Run: node --import tsx test/mercadopago-assinatura-regressao.test.mjs
//
// Por que existe: a T025 generalizou `verifyWebhookSignature` para aceitar o segredo por
// conta de parceiro. Essa função é a que /api/pagamentos/webhook usa — o ÚNICO caminho que
// fatura hoje (FR-005a). Alterar caminho de dinheiro sem prova de que o comportamento
// antigo não mudou é o que a Constituição II proíbe.
//
// O que se prova: a CHAMADA DE UM ARGUMENTO continua produzindo exatamente o mesmo
// resultado de antes — lendo MERCADOPAGO_WEBHOOK_SECRET do ambiente, e nada mais.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const SEGREDO_CASA = 'segredo-da-roi-labs';
const SEGREDO_PARCEIRO = 'segredo-do-parceiro';

process.env.MERCADOPAGO_WEBHOOK_SECRET = SEGREDO_CASA;
const { verifyWebhookSignature } = await import('../src/lib/mercadopago.ts');

/** Reimplementa o manifesto do MP aqui de propósito: se o teste chamasse a própria função
 *  para montar a assinatura, ele passaria mesmo com o manifesto errado. */
function assinar(dataId, xRequestId, ts, segredo) {
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${xRequestId ?? ''};ts:${ts};`;
  return crypto.createHmac('sha256', segredo).update(manifest).digest('hex');
}
const cab = (dataId, reqId, ts, segredo) => ({
  xSignature: `ts=${ts},v1=${assinar(dataId, reqId, ts, segredo)}`,
  xRequestId: reqId,
  dataId,
});

// ── A chamada de UM argumento: o comportamento de hoje, intacto ───────────────
assert.equal(verifyWebhookSignature(cab('123456', 'req-1', '1700000000', SEGREDO_CASA)), true);
// Assinado com OUTRO segredo → continua reprovando (não passou a aceitar qualquer coisa).
assert.equal(verifyWebhookSignature(cab('123456', 'req-1', '1700000000', SEGREDO_PARCEIRO)), false);
// dataId em maiúscula: o MP normaliza para minúscula no manifesto — regra preservada.
assert.equal(verifyWebhookSignature(cab('ABCDEF', 'req-1', '1700000000', SEGREDO_CASA)), true);
// Sem x-request-id o manifesto usa string vazia — regra preservada.
assert.equal(verifyWebhookSignature(cab('123456', null, '1700000000', SEGREDO_CASA)), true);

// ── As recusas de entrada malformada, idênticas ───────────────────────────────
assert.equal(verifyWebhookSignature({ xSignature: null, xRequestId: 'r', dataId: '1' }), false);
assert.equal(verifyWebhookSignature({ xSignature: 'ts=1,v1=abc', xRequestId: 'r', dataId: null }), false);
assert.equal(verifyWebhookSignature({ xSignature: 'lixo', xRequestId: 'r', dataId: '1' }), false);
assert.equal(verifyWebhookSignature({ xSignature: 'ts=1', xRequestId: 'r', dataId: '1' }), false);
// v1 de tamanho diferente: timingSafeEqual explodiria sem a guarda de length — ela ficou.
assert.equal(verifyWebhookSignature({ xSignature: 'ts=1,v1=aa', xRequestId: 'r', dataId: '1' }), false);

// ── O argumento NOVO: segredo por conta, sem tocar o de um argumento ──────────
const doParceiro = cab('123456', 'req-1', '1700000000', SEGREDO_PARCEIRO);
assert.equal(verifyWebhookSignature(doParceiro, SEGREDO_PARCEIRO), true);
// ⚠️ O ponto todo da mudança: o segredo do parceiro NÃO vale para a conta da casa,
// e o da casa não vale para a do parceiro. Um segredo global aceitaria os dois.
assert.equal(verifyWebhookSignature(doParceiro), false);
assert.equal(verifyWebhookSignature(cab('123456', 'req-1', '1700000000', SEGREDO_CASA), SEGREDO_PARCEIRO), false);

// ── Segredo ausente no ambiente → false, nunca "passa direto" ─────────────────
delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
assert.equal(verifyWebhookSignature(cab('123456', 'req-1', '1700000000', SEGREDO_CASA)), false);
// Mas a chamada com segredo explícito segue funcionando sem a env — é o caso do parceiro.
assert.equal(verifyWebhookSignature(doParceiro, SEGREDO_PARCEIRO), true);
process.env.MERCADOPAGO_WEBHOOK_SECRET = SEGREDO_CASA;

console.log('mercadopago-assinatura-regressao.test.mjs: all assertions passed');
