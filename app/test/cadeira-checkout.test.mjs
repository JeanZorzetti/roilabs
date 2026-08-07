// Runnable check da decisão de checkout por cadeira (012, T042 · US2).
// Run: node --import tsx test/cadeira-checkout.test.mjs
import assert from 'node:assert/strict';
import {
  validarProdutoCadeira,
  decidirCheckout,
  ehIndexavel,
  rotuloPublico,
} from '../src/lib/carteira/produto.ts';

const prod = (o = {}) => ({
  nome: 'Plano Pro', preco: 199, moeda: 'BRL', recorrencia: 'mensal',
  modoCobranca: 'parceiro', checkoutUrl: 'https://parceiro.com.br/assinar', publicado: true, ...o,
});
const cad = (o = {}) => ({
  estado: 'ocupada-vendavel', produto: prod(), parceiroNome: 'Sirius CRM', gatewayLigado: true, ...o,
});

// ── T038: a invariante que o Prisma não declara ──────────────────────────────
assert.equal(validarProdutoCadeira(prod()).ok, true);
assert.equal(validarProdutoCadeira(prod({ checkoutUrl: null })).ok, false, "modo 'parceiro' sem URL é o botão que leva a lugar nenhum");
assert.equal(validarProdutoCadeira(prod({ checkoutUrl: '   ' })).ok, false, 'espaço em branco não é URL');
assert.equal(validarProdutoCadeira(prod({ checkoutUrl: 'parceiro.com.br/assinar' })).ok, false, 'sem esquema vira link relativo morto');
assert.equal(validarProdutoCadeira(prod({ checkoutUrl: 'http://parceiro.com.br' })).ok, false, 'http em página de pagamento, não');
// Modo carrinho não precisa de URL — quem cobra é a ROI Labs.
assert.equal(validarProdutoCadeira(prod({ modoCobranca: 'carrinho', checkoutUrl: null })).ok, true);
assert.equal(validarProdutoCadeira(prod({ modoCobranca: 'kiwify' })).ok, false);
// Preço é a fonte do Offer de FR-013 — zero e negativo não servem.
assert.equal(validarProdutoCadeira(prod({ preco: 0 })).ok, false);
assert.equal(validarProdutoCadeira(prod({ preco: -1 })).ok, false);

// ── T039: os dois modos roteiam DIFERENTE ────────────────────────────────────
assert.deepEqual(decidirCheckout(cad({ produto: prod({ modoCobranca: 'carrinho' }) })), { tipo: 'carrinho' });
const saida = decidirCheckout(cad());
assert.equal(saida.tipo, 'parceiro');
assert.equal(saida.url, 'https://parceiro.com.br/assinar');
// T041: de quem é a página de pagamento tem de estar explícito na saída.
assert.equal(saida.pagoA, 'Sirius CRM');
// Sem nome cadastrado, ainda assim não sai vazio — string vazia na tela some.
assert.equal(decidirCheckout(cad({ parceiroNome: null })).pagoA, 'parceiro da ROI Labs');

// ── T040 / FR-008: cadeira SEM gateway ligado não oferece checkout ───────────
{
  const r = decidirCheckout(cad({ gatewayLigado: false }));
  assert.equal(r.tipo, 'indisponivel');
  assert.equal(r.motivo, 'sem-gateway');
  assert.equal(r.url, undefined, 'nem a URL pode vazar: a página não deve oferecer o botão');
}
// ⚠️ Modo carrinho NÃO depende de gateway do parceiro — quem cobra é a ROI Labs.
// Sem esta distinção, ligar a 012 quebraria porcelanato e fitas (FR-001).
assert.deepEqual(
  decidirCheckout(cad({ produto: prod({ modoCobranca: 'carrinho' }), gatewayLigado: false })),
  { tipo: 'carrinho' },
);

// ── Estado manda: só `ocupada-vendavel` vende ────────────────────────────────
for (const estado of ['vaga', 'em-preparacao', 'ocupada-sem-produto']) {
  const r = decidirCheckout(cad({ estado }));
  assert.equal(r.tipo, 'indisponivel', `estado ${estado} não pode vender`);
  assert.equal(r.motivo, 'estado');
}
assert.equal(decidirCheckout(cad({ produto: null })).motivo, 'sem-produto');
assert.equal(decidirCheckout(cad({ produto: prod({ publicado: false }) })).motivo, 'nao-publicado');
// Produto mal configurado não vira checkout quebrado: vira indisponível.
assert.equal(decidirCheckout(cad({ produto: prod({ checkoutUrl: null }) })).motivo, 'produto-invalido');

// ── FR-009: indexável e vendável são a MESMA condição ───────────────────────
// Página indexada que não vende é exatamente a página fina que a US3 existe para evitar.
assert.equal(ehIndexavel(cad()), true);
assert.equal(ehIndexavel(cad({ estado: 'em-preparacao' })), false);
assert.equal(ehIndexavel(cad({ produto: prod({ publicado: false }) })), false);
assert.equal(ehIndexavel(cad({ gatewayLigado: false })), false);

// ── FR-010a: exibição pública é DADO, não derivação de `daCasa` ─────────────
// Cadeira da casa exibida como parceiro — é a decisão do Jean, com o risco declarado.
assert.equal(rotuloPublico({ daCasa: true, exibirDaCasa: false }), 'parceiro');
// As exceções (sirius/meridian/orion) aparecem como da casa.
assert.equal(rotuloPublico({ daCasa: true, exibirDaCasa: true }), 'casa');
assert.equal(rotuloPublico({ daCasa: false, exibirDaCasa: false }), 'parceiro');
// ⚠️ O contrafactual que prova que um NÃO deriva do outro: se `exibirDaCasa` fosse
// derivado de `daCasa`, este caso seria impossível de expressar.
assert.equal(rotuloPublico({ daCasa: false, exibirDaCasa: true }), 'casa');

console.log('cadeira-checkout.test.mjs: all assertions passed');
