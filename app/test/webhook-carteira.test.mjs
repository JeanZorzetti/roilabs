// Testes de CONTRATO do webhook da carteira (012, T028/T029/T032).
// Run: node --import tsx test/webhook-carteira.test.mjs
//
// Os 7 casos de contracts/webhook-carteira.md, rodados contra OS DOIS adaptadores: o núcleo
// é o mesmo, a assinatura não. O banco é um stub — o que se prova aqui é a ORDEM
// (nada gravado antes do passo 2) e a tabela de status. Que a @@unique exista de verdade
// é o `db push` + o reenvio em produção (T037).
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { processarWebhook } from '../src/lib/carteira/webhook.ts';
import { adaptadorMercadoPago, mapearStatus, ehPayerTeste } from '../src/lib/carteira/adaptadores/mercadopago.ts';
import { adaptadorStripe, verificarAssinaturaStripe, mapearEvento } from '../src/lib/carteira/adaptadores/stripe.ts';
import { registrarVenda } from '../src/lib/carteira/registrar-venda.ts';

const SEGREDO = 'segredo-da-conta-do-parceiro';
const TOKEN = 'token-da-conta-do-parceiro';
const CONTA = 'conta-do-parceiro';
const PARCEIRO = 'p1';

// ── Banco de mentira: conta TODA escrita, para "nada gravado" ser verificável ──
function fakeDb({ daCasa = false } = {}) {
  const vendas = [], negocios = [], chaves = new Set();
  return {
    vendas, negocios,
    get escritas() { return vendas.length + negocios.length; },
    vendaParceiro: {
      create: async ({ data }) => {
        const k = `${data.gateway}:${data.eventoId}`;
        if (chaves.has(k)) { const e = new Error('unique'); e.code = 'P2002'; throw e; }
        chaves.add(k);
        const row = { id: `vnd_${vendas.length + 1}`, ...data };
        vendas.push(row);
        return row;
      },
      updateMany: async () => ({ count: 0 }),
    },
    parceiro: {
      findUnique: async () => ({ id: PARCEIRO, comissaoAquisicao: 0.15, comissaoRecorrencia: 0.1, cadeira: { daCasa } }),
    },
    negocioOriginado: {
      findMany: async () => [],
      create: async ({ data }) => { const row = { id: `neg_${negocios.length + 1}`, ...data }; negocios.push(row); return row; },
    },
  };
}

/** deps com um adaptador real e um banco observável. */
function deps(adaptador, db, { credencial = { parceiroId: PARCEIRO, contaRef: CONTA, gateway: 'x', segredo: SEGREDO, token: TOKEN } } = {}) {
  return {
    adaptadorDe: () => adaptador,
    resolverCredencial: async () => credencial,
    registrarVenda: (entrada, cred) => registrarVenda(entrada, cred, db),
  };
}

const req = (url, headers, corpo) => ({
  url,
  headers: new Headers(headers),
  text: async () => corpo,
});

// ═══════════════════════════════════════════════════════════════════════════════
// MERCADO PAGO — cobre atma, polarisia, estetiacrm, vertice
// ═══════════════════════════════════════════════════════════════════════════════
const URL_MP = 'https://app.roilabs.com.br/api/carteira/webhook/mercadopago/p1?type=payment&data.id=999';

function assinarMp(dataId, reqId, ts, segredo) {
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${reqId};ts:${ts};`;
  return `ts=${ts},v1=${crypto.createHmac('sha256', segredo).update(manifest).digest('hex')}`;
}
const cabMp = (segredo = SEGREDO) => ({
  'x-signature': assinarMp('999', 'req-1', '1700000000', segredo),
  'x-request-id': 'req-1',
});

/** Substitui o fetch global por uma resposta canned do MP. */
function comFetchMp(payment, { status = 200 } = {}) {
  const original = globalThis.fetch;
  let chamadas = 0;
  globalThis.fetch = async () => {
    chamadas++;
    if (status !== 200) return { ok: false, status, text: async () => 'erro' };
    return { ok: true, status: 200, json: async () => payment };
  };
  return { restaurar: () => { globalThis.fetch = original; }, get chamadas() { return chamadas; } };
}

const PAGAMENTO_MP = {
  id: 999, status: 'approved', transaction_amount: 250.5, currency_id: 'BRL',
  collector_id: CONTA, operation_type: 'regular_payment',
  payer: { email: 'cliente@exemplo.com', identification: { number: '123.456.789-09' } },
};

// ── CASO 1: assinatura inválida → 401 E NENHUMA LINHA GRAVADA ────────────────
{
  const db = fakeDb();
  const f = comFetchMp(PAGAMENTO_MP);
  const r = await processarWebhook('mercadopago', PARCEIRO, req(URL_MP, cabMp('segredo-ERRADO'), '{}'), deps(adaptadorMercadoPago, db));
  f.restaurar();
  assert.equal(r.http, 401);
  assert.equal(db.escritas, 0, 'assinatura inválida NÃO pode tocar estado (FR-003a)');
  assert.equal(f.chamadas, 0, 'nem o gateway pode ser consultado antes da assinatura');
}

// ── CASO 2: mesmo evento 2× → UMA venda e UM negócio (SC-007) ────────────────
{
  const db = fakeDb();
  const f = comFetchMp(PAGAMENTO_MP);
  const a = await processarWebhook('mercadopago', PARCEIRO, req(URL_MP, cabMp(), '{}'), deps(adaptadorMercadoPago, db));
  const b = await processarWebhook('mercadopago', PARCEIRO, req(URL_MP, cabMp(), '{}'), deps(adaptadorMercadoPago, db));
  f.restaurar();
  assert.equal(a.http, 200);
  assert.equal(b.http, 200);
  assert.equal(b.corpo.retry, true);
  assert.equal(db.vendas.length, 1);
  assert.equal(db.negocios.length, 1);
  // A taxa foi congelada na criação (FR-006a) e o valor veio DO GATEWAY, não do corpo.
  assert.equal(Number(db.negocios[0].valor), 250.5);
  assert.equal(db.negocios[0].taxaAplicada, 0.15);
}

// ── CASO 3: dois retries SIMULTÂNEOS → idem (é a @@unique, não o `if`) ───────
{
  const db = fakeDb();
  const f = comFetchMp(PAGAMENTO_MP);
  const [a, b] = await Promise.all([
    processarWebhook('mercadopago', PARCEIRO, req(URL_MP, cabMp(), '{}'), deps(adaptadorMercadoPago, db)),
    processarWebhook('mercadopago', PARCEIRO, req(URL_MP, cabMp(), '{}'), deps(adaptadorMercadoPago, db)),
  ]);
  f.restaurar();
  assert.equal(db.vendas.length, 1, 'corrida duplicou a venda');
  assert.equal(db.negocios.length, 1, 'corrida duplicou o negócio');
  assert.equal([a, b].filter((r) => r.corpo.retry).length, 1);
}

// ── CASO 4: conta divergente → 409, parceiroId NULO, sem negócio ─────────────
{
  const db = fakeDb();
  const f = comFetchMp({ ...PAGAMENTO_MP, collector_id: 'conta-DE-OUTRO' });
  const r = await processarWebhook('mercadopago', PARCEIRO, req(URL_MP, cabMp(), '{}'), deps(adaptadorMercadoPago, db));
  f.restaurar();
  assert.equal(r.http, 409);
  assert.equal(db.vendas.length, 1);
  assert.equal(db.vendas[0].parceiroId, null, 'NENHUMA linha pode nascer atribuída ao parceiro errado');
  assert.equal(db.vendas[0].motivoDescarte, 'conta-divergente');
  assert.equal(db.negocios.length, 0);
}

// ── CASO 5: payer de teste → venda gravada, NÃO conta receita (FR-006) ──────
{
  const db = fakeDb();
  // approved + conta certa: só o PAYER separa teste de receita.
  const f = comFetchMp({ ...PAGAMENTO_MP, payer: { email: 'test_user_12345@testuser.com' } });
  const r = await processarWebhook('mercadopago', PARCEIRO, req(URL_MP, cabMp(), '{}'), deps(adaptadorMercadoPago, db));
  f.restaurar();
  assert.equal(r.http, 200);
  assert.equal(db.vendas[0].motivoDescarte, 'payer-teste');
  assert.equal(db.negocios.length, 0, 'os 20 pagamentos da Atma somam R$ 0,00 de receita');
}

// ── CASO 6: cadeira da casa → venda gravada, fee ZERO (FR-010) ──────────────
{
  const db = fakeDb({ daCasa: true });
  const f = comFetchMp(PAGAMENTO_MP);
  const r = await processarWebhook('mercadopago', PARCEIRO, req(URL_MP, cabMp(), '{}'), deps(adaptadorMercadoPago, db));
  f.restaurar();
  assert.equal(r.http, 200);
  assert.equal(db.vendas.length, 1);
  assert.equal(db.negocios.length, 0, 'cadeira da casa não gera success fee de si mesma');
}

// ── CASO 7: falha ao consultar o gateway → 5xx, NADA gravado ────────────────
{
  const db = fakeDb();
  const f = comFetchMp(null, { status: 500 });
  const r = await processarWebhook('mercadopago', PARCEIRO, req(URL_MP, cabMp(), '{}'), deps(adaptadorMercadoPago, db));
  f.restaurar();
  assert.equal(r.http, 502, '5xx é o único status que pede reenvio');
  assert.equal(db.escritas, 0);
}

// ── Credencial inexistente → 404, sem ler o corpo ───────────────────────────
{
  const db = fakeDb();
  let leuCorpo = false;
  const r = await processarWebhook('mercadopago', PARCEIRO, {
    url: URL_MP, headers: new Headers(cabMp()),
    text: async () => { leuCorpo = true; return '{}'; },
  }, { ...deps(adaptadorMercadoPago, db), resolverCredencial: async () => null });
  assert.equal(r.http, 404);
  assert.equal(leuCorpo, false, 'passo 1 devolve 404 SEM ler o corpo');
  assert.equal(db.escritas, 0);
}

// ── Gateway desconhecido → 404 (Kiwify não se constrói) ─────────────────────
{
  const db = fakeDb();
  const r = await processarWebhook('kiwify', PARCEIRO, req(URL_MP, {}, '{}'), { ...deps(adaptadorMercadoPago, db), adaptadorDe: () => null });
  assert.equal(r.http, 404);
}

// ── Evento irrelevante → 200 DELIBERADO (erro faria reenviar para sempre) ───
{
  const db = fakeDb();
  const f = comFetchMp({ ...PAGAMENTO_MP, status: 'pending' });
  const r = await processarWebhook('mercadopago', PARCEIRO, req(URL_MP, cabMp(), '{}'), deps(adaptadorMercadoPago, db));
  f.restaurar();
  assert.equal(r.http, 200);
  assert.equal(r.corpo.ignorado, true);
  assert.equal(db.escritas, 0);
}

// ── Mapa de status do MP ────────────────────────────────────────────────────
assert.equal(mapearStatus('approved'), 'aprovada');
assert.equal(mapearStatus('refunded'), 'reembolsada');
assert.equal(mapearStatus('charged_back'), 'estornada');
for (const s of ['pending', 'in_process', 'rejected', 'cancelled']) assert.equal(mapearStatus(s), null);

// ── Payer de teste: a regra, isolada ────────────────────────────────────────
assert.equal(ehPayerTeste('test_user_1901759622@testuser.com'), true);
assert.equal(ehPayerTeste('TEST_USER_1@TESTUSER.COM'), true);
assert.equal(ehPayerTeste('cliente@exemplo.com'), false);
assert.equal(ehPayerTeste(null), false);
// ⚠️ NÃO casar por substring solta: um cliente real de verdade pode ter "test" no e-mail.
assert.equal(ehPayerTeste('testador@empresa.com.br'), false);
assert.equal(ehPayerTeste('joao@testuser.com.br'), false);

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE — cobre sirius, context, orion. Mesmos 7 casos; a assinatura é outra.
// ═══════════════════════════════════════════════════════════════════════════════
const URL_ST = 'https://app.roilabs.com.br/api/carteira/webhook/stripe/p1';
const CORPO_ST = JSON.stringify({ id: 'evt_123' });

const assinarSt = (corpo, segredo, ts = Math.floor(Date.now() / 1000)) =>
  `t=${ts},v1=${crypto.createHmac('sha256', segredo).update(`${ts}.${corpo}`).digest('hex')}`;
const cabSt = (segredo = SEGREDO, corpo = CORPO_ST) => ({ 'stripe-signature': assinarSt(corpo, segredo) });

const EVENTO_ST = {
  id: 'evt_123', type: 'checkout.session.completed', livemode: true, account: CONTA,
  data: { object: { id: 'cs_1', payment_intent: 'pi_1', amount_total: 25050, currency: 'brl', customer_email: 'cliente@exemplo.com' } },
};

function comFetchSt(evento, { status = 200 } = {}) {
  const original = globalThis.fetch;
  let chamadas = 0;
  globalThis.fetch = async () => {
    chamadas++;
    if (status !== 200) return { ok: false, status, text: async () => 'erro' };
    return { ok: true, status: 200, json: async () => evento };
  };
  return { restaurar: () => { globalThis.fetch = original; }, get chamadas() { return chamadas; } };
}

// ── CASO 1 (Stripe): assinatura inválida → 401, nada gravado ────────────────
{
  const db = fakeDb();
  const f = comFetchSt(EVENTO_ST);
  const r = await processarWebhook('stripe', PARCEIRO, req(URL_ST, cabSt('segredo-ERRADO'), CORPO_ST), deps(adaptadorStripe, db));
  f.restaurar();
  assert.equal(r.http, 401);
  assert.equal(db.escritas, 0);
  assert.equal(f.chamadas, 0);
}

// ── CASO 2 e 3 (Stripe): retry e retries simultâneos ───────────────────────
{
  const db = fakeDb();
  const f = comFetchSt(EVENTO_ST);
  const a = await processarWebhook('stripe', PARCEIRO, req(URL_ST, cabSt(), CORPO_ST), deps(adaptadorStripe, db));
  const b = await processarWebhook('stripe', PARCEIRO, req(URL_ST, cabSt(), CORPO_ST), deps(adaptadorStripe, db));
  const [c, d] = await Promise.all([
    processarWebhook('stripe', PARCEIRO, req(URL_ST, cabSt(), CORPO_ST), deps(adaptadorStripe, db)),
    processarWebhook('stripe', PARCEIRO, req(URL_ST, cabSt(), CORPO_ST), deps(adaptadorStripe, db)),
  ]);
  f.restaurar();
  assert.equal(a.http, 200);
  assert.equal(b.corpo.retry, true);
  assert.equal(db.vendas.length, 1, '4 entregas do mesmo evento → 1 venda');
  assert.equal(db.negocios.length, 1);
  assert.equal([c, d].every((r) => r.http === 200), true);
  assert.equal(Number(db.negocios[0].valor), 250.5, 'centavos do Stripe viram unidade');
  assert.equal(db.vendas[0].moeda, 'BRL');
}

// ── CASO 4 (Stripe): conta divergente → 409, sem negócio ───────────────────
{
  const db = fakeDb();
  const f = comFetchSt({ ...EVENTO_ST, account: 'acct_DE_OUTRO' });
  const r = await processarWebhook('stripe', PARCEIRO, req(URL_ST, cabSt(), CORPO_ST), deps(adaptadorStripe, db));
  f.restaurar();
  assert.equal(r.http, 409);
  assert.equal(db.vendas[0].parceiroId, null);
  assert.equal(db.negocios.length, 0);
}

// ── CASO 5 (Stripe): livemode:false → não conta receita ────────────────────
{
  const db = fakeDb();
  const f = comFetchSt({ ...EVENTO_ST, livemode: false });
  const r = await processarWebhook('stripe', PARCEIRO, req(URL_ST, cabSt(), CORPO_ST), deps(adaptadorStripe, db));
  f.restaurar();
  assert.equal(r.http, 200);
  assert.equal(db.vendas[0].motivoDescarte, 'payer-teste');
  assert.equal(db.negocios.length, 0);
}

// ── CASO 6 (Stripe): cadeira da casa → fee zero ────────────────────────────
{
  const db = fakeDb({ daCasa: true });
  const f = comFetchSt(EVENTO_ST);
  const r = await processarWebhook('stripe', PARCEIRO, req(URL_ST, cabSt(), CORPO_ST), deps(adaptadorStripe, db));
  f.restaurar();
  assert.equal(r.http, 200);
  assert.equal(db.vendas.length, 1);
  assert.equal(db.negocios.length, 0);
}

// ── CASO 7 (Stripe): falha ao consultar → 5xx, nada gravado ────────────────
{
  const db = fakeDb();
  const f = comFetchSt(null, { status: 500 });
  const r = await processarWebhook('stripe', PARCEIRO, req(URL_ST, cabSt(), CORPO_ST), deps(adaptadorStripe, db));
  f.restaurar();
  assert.equal(r.http, 502);
  assert.equal(db.escritas, 0);
}

// ── Assinatura recorrente do Stripe → taxa MENOR ───────────────────────────
{
  const db = fakeDb();
  const f = comFetchSt({ ...EVENTO_ST, type: 'invoice.paid', data: { object: { ...EVENTO_ST.data.object, subscription: 'sub_1' } } });
  await processarWebhook('stripe', PARCEIRO, req(URL_ST, cabSt(), CORPO_ST), deps(adaptadorStripe, db));
  f.restaurar();
  assert.equal(db.negocios[0].classificacao, 'recorrencia');
  assert.equal(db.negocios[0].taxaAplicada, 0.1);
}

// ── A assinatura do Stripe, isolada ────────────────────────────────────────
const agora = 1700000000;
assert.equal(verificarAssinaturaStripe(assinarSt(CORPO_ST, SEGREDO, agora), CORPO_ST, SEGREDO, agora), true);
assert.equal(verificarAssinaturaStripe(assinarSt(CORPO_ST, 'outro', agora), CORPO_ST, SEGREDO, agora), false);
// ⚠️ Assinatura sobre os BYTES: mesmo JSON reserializado com espaço a mais já não bate.
assert.equal(verificarAssinaturaStripe(assinarSt(CORPO_ST, SEGREDO, agora), '{ "id": "evt_123" }', SEGREDO, agora), false);
// Replay: assinatura boa, timestamp velho → recusa.
assert.equal(verificarAssinaturaStripe(assinarSt(CORPO_ST, SEGREDO, agora - 3600), CORPO_ST, SEGREDO, agora), false);
// Rotação de segredo: o Stripe manda dois v1 e QUALQUER um vale.
{
  const bom = crypto.createHmac('sha256', SEGREDO).update(`${agora}.${CORPO_ST}`).digest('hex');
  const velho = crypto.createHmac('sha256', 'segredo-velho').update(`${agora}.${CORPO_ST}`).digest('hex');
  assert.equal(verificarAssinaturaStripe(`t=${agora},v1=${velho},v1=${bom}`, CORPO_ST, SEGREDO, agora), true);
}
assert.equal(verificarAssinaturaStripe(null, CORPO_ST, SEGREDO, agora), false);
assert.equal(verificarAssinaturaStripe(`t=${agora},v1=aa`, CORPO_ST, SEGREDO, agora), false);
assert.equal(verificarAssinaturaStripe('lixo', CORPO_ST, SEGREDO, agora), false);

// ── Mapa de eventos do Stripe ──────────────────────────────────────────────
assert.equal(mapearEvento('checkout.session.completed'), 'aprovada');
assert.equal(mapearEvento('invoice.paid'), 'aprovada');
assert.equal(mapearEvento('charge.refunded'), 'reembolsada');
assert.equal(mapearEvento('charge.dispute.created'), 'estornada');
assert.equal(mapearEvento('customer.created'), null);

console.log('webhook-carteira.test.mjs: all assertions passed');
