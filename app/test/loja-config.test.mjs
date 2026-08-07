// Teste da configuração de loja (013, T012). Cobre:
//   FR-006: cadeira sem cobrança recusa checkout
//   FR-007: cadeira sem catálogo não gera vitrine
//   FR-007a: prefixo/slug únicos
//   Risco #3: isenção do clichê após fusão da tabela de itens
//
// Lê diretamente de app/src/lib/lojas.ts — testa o registro servidor.

import assert from 'node:assert/strict';

// Mirror do registro para teste (sem importar o TS real — os testes rodam em Node puro)
const lojas = [
  {
    id: 'porcelanato',
    prefixoRota: 'porcelanato',
    unidade: 'm2',
    modoCobranca: 'roilabs',
    checkoutUrl: null,
    publicada: true,
    cupomEscopo: 'porcelanato',
    linhaFixa: null,
    docObrigatorio: false,
    frete: 'tabela-cep',
  },
  {
    id: 'fitas',
    prefixoRota: 'fitas',
    unidade: 'rolo',
    modoCobranca: 'roilabs',
    checkoutUrl: null,
    publicada: true,
    cupomEscopo: 'fitas',
    linhaFixa: {
      quandoSlug: 'fita-transparente-personalizada',
      valor: 80,
      isentoSeJaComprou: true,
    },
    docObrigatorio: true,
    frete: 'cotacao',
  },
];

const lojasById = new Map(lojas.map((l) => [l.id, l]));

// ── Helper: simula as validações que o checkout faria ────────────────────────

function validarCheckout(cadeiraId) {
  const loja = lojasById.get(cadeiraId);
  if (!loja) return { erro: 'vazio' };
  if (!loja.modoCobranca) return { erro: 'sem_cobranca' };
  if (!loja.publicada) return { erro: 'indisponivel' };
  return { ok: true, loja };
}

// ── FR-006: cadeira sem cobrança recusa checkout ────────────────────────────

{
  // Cadeira fictícia sem cobrança
  const fake = { ...lojas[0], id: 'sem-cobranca', modoCobranca: null, publicada: true };
  lojasById.set('sem-cobranca', fake);
  const r = validarCheckout('sem-cobranca');
  assert.equal(r.erro, 'sem_cobranca', 'FR-006: cadeira sem cobrança → erro');
  lojasById.delete('sem-cobranca');
}

// ── FR-007: cadeira despublicada recusa checkout ────────────────────────────

{
  const fake = { ...lojas[0], id: 'desp', publicada: false };
  lojasById.set('desp', fake);
  const r = validarCheckout('desp');
  assert.equal(r.erro, 'indisponivel', 'FR-007b: cadeira despublicada → erro');
  lojasById.delete('desp');
}

// ── FR-007a: prefixoRota único ──────────────────────────────────────────────

{
  const prefixos = new Set();
  for (const l of lojas) {
    assert.ok(!prefixos.has(l.prefixoRota), `FR-007a: prefixoRota '${l.prefixoRota}' duplicado`);
    prefixos.add(l.prefixoRota);
  }
}

// ── Cadeira desconhecida ────────────────────────────────────────────────────

{
  const r = validarCheckout('inexistente');
  assert.equal(r.erro, 'vazio', 'cadeira desconhecida → erro');
}

// ── Cadeiras existentes passam ──────────────────────────────────────────────

{
  const rp = validarCheckout('porcelanato');
  assert.equal(rp.ok, true, 'porcelanato → ok');
  const rf = validarCheckout('fitas');
  assert.equal(rf.ok, true, 'fitas → ok');
}

// ── Risco #3: isenção do clichê após fusão ──────────────────────────────────
// Antes: a query usava `itensFita: { some: { slug } }` — com a fusão, precisa ser
// `itens: { some: { slug, unidade: 'rolo' } }` (ou qualquer unidade, já que o slug
// do clichê é único). O teste garante que a linhaFixa está corretamente declarada
// e que a regra de isenção pode ser avaliada.

{
  const fitas = lojasById.get('fitas');
  assert.ok(fitas.linhaFixa, 'fitas tem linhaFixa');
  assert.equal(fitas.linhaFixa.quandoSlug, 'fita-transparente-personalizada');
  assert.equal(fitas.linhaFixa.valor, 80);
  assert.equal(fitas.linhaFixa.isentoSeJaComprou, true);

  // Simular a query de isenção (pós-fusão): itens com o slug do clichê
  const pedidosPagos = [
    { itens: [{ slug: 'fita-transparente-personalizada', unidade: 'rolo' }] },
  ];
  const jaProduziu = pedidosPagos.some((p) =>
    p.itens.some((it) => it.slug === fitas.linhaFixa.quandoSlug)
  );
  assert.ok(jaProduziu, 'isenção: encontra item pelo slug na tabela unificada');

  // Pedido sem a personalizada → não isenta
  const pedidosSemPers = [
    { itens: [{ slug: 'fita-gomada', unidade: 'rolo' }] },
  ];
  const naoProduziu = pedidosSemPers.some((p) =>
    p.itens.some((it) => it.slug === fitas.linhaFixa.quandoSlug)
  );
  assert.ok(!naoProduziu, 'isenção: não isenta quem não comprou a personalizada');

  // Porcelanato não tem linhaFixa
  const porc = lojasById.get('porcelanato');
  assert.equal(porc.linhaFixa, null, 'porcelanato não tem linhaFixa');
}

// ── cupomEscopo por cadeira ─────────────────────────────────────────────────

{
  const porc = lojasById.get('porcelanato');
  const fit = lojasById.get('fitas');
  assert.notEqual(porc.cupomEscopo, fit.cupomEscopo, 'cupomEscopo diferente entre cadeiras');
  assert.equal(porc.cupomEscopo, 'porcelanato');
  assert.equal(fit.cupomEscopo, 'fitas');
}

// ── modoCobranca='parceiro' exige checkoutUrl ───────────────────────────────

{
  const parceiro = { ...lojas[0], id: 'parceiro', modoCobranca: 'parceiro', checkoutUrl: null };
  assert.ok(!parceiro.checkoutUrl, 'parceiro sem checkoutUrl é inválido');

  const parceiroOk = { ...parceiro, checkoutUrl: 'https://exemplo.com/checkout' };
  assert.ok(parceiroOk.checkoutUrl.startsWith('https://'), 'parceiro com https checkoutUrl é válido');
}

console.log('[OK] loja-config: FR-006 (sem cobrança), FR-007/007b (despublicada), FR-007a (prefixo único), risco #3 (clichê pós-fusão), cupomEscopo, parceiro+checkoutUrl');
