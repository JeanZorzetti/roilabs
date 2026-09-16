// Runnable check da trava de repetição do webhook de pagamento (roihub 027, FR-011).
// Run: node --import tsx test/webhook-reembolso.test.mjs
//
// Por que existe: a devolução e a contestação chegam com o MESMO id do pagamento aprovado. A trava
// antiga ("mesmo id e fora de pendente") descartava as duas, e um pedido pago nunca virava
// reembolsado quando o dinheiro voltava pelo Mercado Pago.
import assert from 'node:assert/strict';
import { notificacaoJaAplicada } from '../src/lib/mercadopago.ts';

const pago = { mpPaymentId: '123', statusPagamento: 'pago' };
const reembolsado = { mpPaymentId: '123', statusPagamento: 'reembolsado' };
const pendente = { mpPaymentId: null, statusPagamento: 'pendente' };

// ── o comportamento antigo continua: aprovado repetido é ignorado ──
assert.equal(notificacaoJaAplicada(pago, '123', 'approved'), true);
assert.equal(notificacaoJaAplicada(reembolsado, '123', 'approved'), true, 'aprovado atrasado não desfaz o reembolso');
assert.equal(notificacaoJaAplicada(pendente, '123', 'approved'), false);
assert.equal(notificacaoJaAplicada({ mpPaymentId: '123', statusPagamento: 'pendente' }, '123', 'approved'), false);

// ── outro pagamento do mesmo pedido (renovação) nunca é travado aqui ──
assert.equal(notificacaoJaAplicada(pago, '999', 'rejected'), false);
assert.equal(notificacaoJaAplicada(pago, '999', 'refunded'), false);

// ── o conserto: devolução e contestação de um pedido pago passam ──
assert.equal(notificacaoJaAplicada(pago, '123', 'refunded'), false);
assert.equal(notificacaoJaAplicada(pago, '123', 'charged_back'), false);

// ── e só uma vez: depois de reembolsado, a repetição é ignorada (sem 2º alerta) ──
assert.equal(notificacaoJaAplicada(reembolsado, '123', 'refunded'), true);
assert.equal(notificacaoJaAplicada(reembolsado, '123', 'charged_back'), true);

console.log('webhook-reembolso: ok');
