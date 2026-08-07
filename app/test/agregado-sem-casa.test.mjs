// Runnable check de FR-010 (012, T056): NENHUM agregado de faturamento, fee ou "receita da
// carteira" soma cadeira da casa.
// Run: node --import tsx test/agregado-sem-casa.test.mjs
import assert from 'node:assert/strict';
import { receitaDaCarteira } from '../src/lib/carteira/agregados.ts';
import { calcularFaturaMensal } from '../src/lib/success-fee.ts';
import { PROJETOS_CADEIRA } from '../src/lib/seats.ts';

const v = (o = {}) => ({ valor: 100, motivoDescarte: null, daCasa: false, parceiroId: 'p1', status: 'aprovada', ...o });

// ── O caso central: a venda da casa NÃO soma ─────────────────────────────────
{
  const r = receitaDaCarteira([v(), v({ daCasa: true, valor: 9999 })]);
  assert.equal(r.receita, 100, 'cadeira da casa entrou na receita da carteira');
  assert.equal(r.vendas, 1);
  assert.equal(r.excluidas.daCasa, 1);
}

// ── Carteira SÓ de cadeiras da casa → receita R$ 0,00, não "a maior parte" ───
// A spec avisa que a maior parte da fase 1 seria da casa. Se o agregado somasse, o número
// publicado seria quase todo dinheiro da própria ROI Labs.
{
  const r = receitaDaCarteira([v({ daCasa: true }), v({ daCasa: true }), v({ daCasa: true })]);
  assert.equal(r.receita, 0);
  assert.equal(r.vendas, 0);
  assert.equal(r.excluidas.daCasa, 3);
}

// ── As outras exclusões seguem valendo, e são CONTADAS ──────────────────────
{
  const r = receitaDaCarteira([
    v(),                                            // entra
    v({ daCasa: true }),                            // FR-010
    v({ motivoDescarte: 'payer-teste' }),           // FR-006
    v({ motivoDescarte: 'conta-divergente', parceiroId: null }), // FR-005
    v({ parceiroId: null }),                        // não atribuída
    v({ status: 'reembolsada' }),
    v({ status: 'estornada' }),
  ]);
  assert.equal(r.receita, 100);
  assert.equal(r.vendas, 1);
  assert.deepEqual(r.excluidas, { daCasa: 1, descartadas: 1, naoAtribuidas: 2, naoAprovadas: 2 });
}

// ── Venda da casa E de teste: não soma por nenhum dos dois caminhos ─────────
assert.equal(receitaDaCarteira([v({ daCasa: true, motivoDescarte: 'payer-teste' })]).receita, 0);

// ── A fatura de success fee: cadeira da casa não chega até ela ──────────────
// O registrar-venda NÃO cria NegocioOriginado para cadeira da casa, então a fatura nunca vê
// a linha. Prova do outro lado: mesmo se uma linha da casa vazasse para cá com faturavel
// false, o fee continua zero — as duas barreiras, não uma.
{
  const negocio = (o = {}) => ({ id: 'n1', valor: 1000, taxaAplicada: 0.15, estagio: 'ganho', faturavel: true, pedidoReembolsado: false, jaFaturado: false, ...o });
  assert.equal(calcularFaturaMensal([negocio()]).valor, 150);
  assert.equal(calcularFaturaMensal([negocio({ faturavel: false })]).valor, 0);
  assert.equal(calcularFaturaMensal([negocio({ faturavel: false })]).base, 0, 'a BASE também não pode somar');
}

// ── FR-010a no SEED: a lista de exceções é DADO, e são exatamente três ──────
{
  const exibidas = PROJETOS_CADEIRA.filter((p) => p.exibirDaCasa).map((p) => p.slug).sort();
  assert.deepEqual(exibidas, ['meridian', 'orion', 'sirius']);
  // ⚠️ Toda cadeira exibida como da casa TEM de ser da casa no dado. O contrário é livre
  // (da casa exibida como parceiro é a decisão do Jean) — mas exibir como da casa uma que
  // não é seria prova social invertida.
  for (const p of PROJETOS_CADEIRA) {
    if (p.exibirDaCasa) assert.equal(p.daCasa, true, `${p.slug}: exibirDaCasa sem daCasa`);
  }
  // meridian existe no SEED — sem ele, T052 escreveria numa linha inexistente.
  assert.ok(PROJETOS_CADEIRA.some((p) => p.slug === 'meridian'), 'meridian tem de existir como cadeira');
}

console.log('agregado-sem-casa.test.mjs: all assertions passed');
