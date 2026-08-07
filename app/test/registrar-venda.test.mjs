// Runnable check do núcleo de registro (012, T020 · contrato passos 4-6).
// Run: node --import tsx test/registrar-venda.test.mjs
//
// Sem banco: um stub de Prisma com a @@unique([gateway, eventoId]) SIMULADA (mesmo P2002
// que o Postgres levanta). O que se prova aqui é a lógica de decisão; que a constraint
// exista de verdade é o `db push` + o reenvio em produção (T037).
import assert from 'node:assert/strict';
import { registrarVenda, decidirAtribuicao } from '../src/lib/carteira/registrar-venda.ts';

// ── Passo 4 puro: quem fica com a venda ───────────────────────────────────────
const atrib = (o) => decidirAtribuicao({
  contaRefPagamento: 'conta-A', contaRefCredencial: 'conta-A', parceiroId: 'p1', payerTeste: false, ...o,
});
assert.deepEqual(atrib({}), { parceiroId: 'p1', motivoDescarte: null });
assert.deepEqual(atrib({ contaRefPagamento: 'conta-B' }), { parceiroId: null, motivoDescarte: 'conta-divergente' });
assert.deepEqual(atrib({ payerTeste: true }), { parceiroId: 'p1', motivoDescarte: 'payer-teste' });
// Conta divergente GANHA do payer de teste: a atribuição errada é o problema maior e é a
// única que exige apuração humana.
assert.deepEqual(atrib({ contaRefPagamento: 'conta-B', payerTeste: true }), { parceiroId: null, motivoDescarte: 'conta-divergente' });

// ── Stub de banco ─────────────────────────────────────────────────────────────
function fakeDb({ daCasa = false, taxas = true, negociosAnteriores = [] } = {}) {
  const vendas = [];
  const negocios = [];
  const chaves = new Set(); // simula @@unique([gateway, eventoId])
  return {
    vendas, negocios,
    vendaParceiro: {
      create: async ({ data }) => {
        const k = `${data.gateway}:${data.eventoId}`;
        if (chaves.has(k)) {
          const e = new Error('Unique constraint failed');
          e.code = 'P2002';
          throw e;
        }
        chaves.add(k);
        const row = { id: `vnd_${vendas.length + 1}`, ...data };
        vendas.push(row);
        return row;
      },
      updateMany: async ({ where, data }) => {
        let n = 0;
        for (const v of vendas) {
          if (v.gateway === where.gateway && v.pagamentoId === where.pagamentoId && v.id !== where.id.not) {
            Object.assign(v, data); n++;
          }
        }
        return { count: n };
      },
    },
    parceiro: {
      findUnique: async ({ where }) =>
        where.id === 'p1'
          ? {
              id: 'p1',
              comissaoAquisicao: taxas ? 0.15 : null,
              comissaoRecorrencia: taxas ? 0.1 : null,
              cadeira: { daCasa },
            }
          : null,
    },
    negocioOriginado: {
      findMany: async () => negociosAnteriores,
      create: async ({ data }) => {
        const row = { id: `neg_${negocios.length + 1}`, ...data };
        negocios.push(row);
        return row;
      },
    },
  };
}

const CRED = { parceiroId: 'p1', contaRef: 'conta-A' };
const entrada = (o = {}) => ({
  gateway: 'mercadopago', eventoId: 'ev1', pagamentoId: 'pay1', valor: 100, moeda: 'BRL',
  status: 'aprovada', recorrente: false, clienteDoc: null, clienteRef: 'cliente@exemplo.com',
  contaRefPagamento: 'conta-A', payerTeste: false, payload: { cru: true }, ...o,
});

// ── Caminho feliz: venda + negócio, taxa de aquisição congelada ───────────────
{
  const db = fakeDb();
  const r = await registrarVenda(entrada(), CRED, db);
  assert.equal(r.http, 200);
  assert.equal(db.vendas.length, 1);
  assert.equal(db.negocios.length, 1);
  assert.equal(db.negocios[0].origem, 'webhook');
  assert.equal(db.negocios[0].pedidoId, null);
  assert.equal(db.negocios[0].vendaId, 'vnd_1');
  assert.equal(db.negocios[0].classificacao, 'aquisicao');
  assert.equal(db.negocios[0].taxaAplicada, 0.15);
  // O payload cru tem de estar lá: sem ele um negócio disputado não se reconstrói.
  assert.deepEqual(db.vendas[0].payload, { cru: true });
}

// ── IDEMPOTÊNCIA (SC-007): mesmo evento 2× → UMA venda e UM negócio ───────────
{
  const db = fakeDb();
  const a = await registrarVenda(entrada(), CRED, db);
  const b = await registrarVenda(entrada(), CRED, db);
  assert.equal(a.http, 200);
  assert.equal(b.http, 200);
  assert.equal(b.retry, true);
  assert.equal(db.vendas.length, 1, 'retry duplicou a venda');
  assert.equal(db.negocios.length, 1, 'retry duplicou o negócio');
}

// ── Dois retries SIMULTÂNEOS → idem (é a @@unique, não um `if`, que segura) ───
{
  const db = fakeDb();
  const [a, b] = await Promise.all([
    registrarVenda(entrada(), CRED, db),
    registrarVenda(entrada(), CRED, db),
  ]);
  assert.equal(db.vendas.length, 1, 'corrida duplicou a venda');
  assert.equal(db.negocios.length, 1, 'corrida duplicou o negócio');
  assert.equal([a, b].filter((r) => r.retry).length, 1, 'exatamente um dos dois é retry');
}

// ── Conta divergente → 409, venda com parceiroId NULO, ZERO negócio ──────────
{
  const db = fakeDb();
  const r = await registrarVenda(entrada({ contaRefPagamento: 'conta-INTRUSA' }), CRED, db);
  assert.equal(r.http, 409);
  assert.equal(db.vendas.length, 1);
  assert.equal(db.vendas[0].parceiroId, null, 'nenhuma linha pode nascer atribuída ao parceiro errado');
  assert.equal(db.vendas[0].motivoDescarte, 'conta-divergente');
  assert.equal(db.negocios.length, 0);
  // Payload preservado mesmo na falha fechada (FR-005).
  assert.deepEqual(db.vendas[0].payload, { cru: true });
}

// ── Retry de evento divergente devolve 200, não 409 (a colisão encerra antes) ─
{
  const db = fakeDb();
  await registrarVenda(entrada({ contaRefPagamento: 'conta-INTRUSA' }), CRED, db);
  const r = await registrarVenda(entrada({ contaRefPagamento: 'conta-INTRUSA' }), CRED, db);
  assert.equal(r.http, 200);
  assert.equal(r.retry, true);
}

// ── Payer de teste → venda gravada, NÃO conta receita (FR-006) ───────────────
{
  const db = fakeDb();
  const r = await registrarVenda(entrada({ payerTeste: true }), CRED, db);
  assert.equal(r.http, 200);
  assert.equal(db.vendas.length, 1);
  assert.equal(db.vendas[0].motivoDescarte, 'payer-teste');
  assert.equal(db.negocios.length, 0, 'payer de teste não pode virar receita');
}

// ── Cadeira da casa → venda gravada, fee ZERO (FR-010) ───────────────────────
{
  const db = fakeDb({ daCasa: true });
  const r = await registrarVenda(entrada(), CRED, db);
  assert.equal(r.http, 200);
  assert.equal(r.semNegocio, 'da-casa');
  assert.equal(db.vendas.length, 1, 'a venda da casa É registrada — é receita direta');
  assert.equal(db.negocios.length, 0, 'cadeira da casa não pode gerar success fee de si mesma');
}

// ── Parceiro sem as duas taxas → não há o que congelar; venda sem negócio ─────
{
  const db = fakeDb({ taxas: false });
  const r = await registrarVenda(entrada(), CRED, db);
  assert.equal(r.http, 200);
  assert.equal(r.semNegocio, 'parceiro-sem-taxas');
  assert.equal(db.negocios.length, 0);
}

// ── Recorrência: renovação sem CPF cobra a taxa MENOR ────────────────────────
{
  const db = fakeDb();
  await registrarVenda(entrada({ recorrente: true }), CRED, db);
  assert.equal(db.negocios[0].classificacao, 'recorrencia');
  assert.equal(db.negocios[0].taxaAplicada, 0.1, 'renovação cobrada a 15% é o defeito que a regra 1 impede');
}

// ── Recorrência pelo ref do gateway (regra 2), sem doc ───────────────────────
{
  const db = fakeDb({ negociosAnteriores: [{ clienteDoc: null, clienteRef: 'cliente@exemplo.com', pedido: null, venda: { status: 'aprovada' } }] });
  await registrarVenda(entrada(), CRED, db);
  assert.equal(db.negocios[0].classificacao, 'recorrencia');
}

// ── Anterior ESTORNADO não consome a aquisição (FR-008) ──────────────────────
{
  const db = fakeDb({ negociosAnteriores: [{ clienteDoc: null, clienteRef: 'cliente@exemplo.com', pedido: null, venda: { status: 'estornada' } }] });
  await registrarVenda(entrada(), CRED, db);
  assert.equal(db.negocios[0].classificacao, 'aquisicao');
  assert.equal(db.negocios[0].taxaAplicada, 0.15);
}

// ── Reembolso propaga para a venda original (o que tira o negócio da fatura) ──
{
  const db = fakeDb();
  await registrarVenda(entrada(), CRED, db);
  const r = await registrarVenda(entrada({ eventoId: 'ev2', status: 'reembolsada' }), CRED, db);
  assert.equal(r.http, 200);
  assert.equal(r.semNegocio, 'nao-aprovada');
  assert.equal(db.vendas[0].status, 'reembolsada', 'a venda original tem de refletir o estorno');
  assert.equal(db.negocios.length, 1, 'estorno não cria negócio novo');
}

console.log('registrar-venda.test.mjs: all assertions passed');
