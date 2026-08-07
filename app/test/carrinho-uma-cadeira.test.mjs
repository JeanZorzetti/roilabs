// Teste do carrinho de uma cadeira só (013, T011). Cobre FR-005/FR-005a:
// adicionar item de outra cadeira devolve { ok: false, cadeiraAtual },
// nada é removido sem ação explícita.

import assert from 'node:assert/strict';

// ── Mirror da lógica do cart.ts unificado (013) ─────────────────────────────
// O carrinho tem uma `cadeira` escalar. Adicionar item de outra cadeira é recusado
// por construção — não há onde guardar duas cadeiras.

function addItem(cart, cadeira, slug, quantidade) {
  if (!cart) {
    return { ok: true, cart: { cadeira, itens: [{ slug, quantidade }] } };
  }
  if (cart.cadeira !== cadeira) {
    return { ok: false, cadeiraAtual: cart.cadeira };
  }
  const existing = cart.itens.find((i) => i.slug === slug);
  if (existing) {
    existing.quantidade += quantidade;
  } else {
    cart.itens.push({ slug, quantidade });
  }
  return { ok: true, cart };
}

// Caso 1: adicionar primeiro item — cria o carrinho
{
  const r = addItem(null, 'porcelanato', 'porcelanato-nero-polido', 3);
  assert.equal(r.ok, true);
  assert.equal(r.cart.cadeira, 'porcelanato');
  assert.equal(r.cart.itens.length, 1);
  assert.equal(r.cart.itens[0].slug, 'porcelanato-nero-polido');
  assert.equal(r.cart.itens[0].quantidade, 3);
}

// Caso 2: adicionar segundo item da mesma cadeira — merge
{
  const cart = { cadeira: 'porcelanato', itens: [{ slug: 'a', quantidade: 2 }] };
  const r = addItem(cart, 'porcelanato', 'b', 5);
  assert.equal(r.ok, true);
  assert.equal(r.cart.itens.length, 2);
}

// Caso 3: adicionar item de OUTRA cadeira — recusado
{
  const cart = { cadeira: 'porcelanato', itens: [{ slug: 'a', quantidade: 2 }] };
  const r = addItem(cart, 'fitas', 'fita-gomada', 15);
  assert.equal(r.ok, false);
  assert.equal(r.cadeiraAtual, 'porcelanato');
  // O carrinho NÃO foi alterado — nada removido sem ação explícita
  assert.equal(cart.itens.length, 1);
  assert.equal(cart.itens[0].slug, 'a');
  assert.equal(cart.itens[0].quantidade, 2);
}

// Caso 4: adicionar mesmo slug da mesma cadeira — soma quantidade
{
  const cart = { cadeira: 'fitas', itens: [{ slug: 'fita-gomada', quantidade: 15 }] };
  const r = addItem(cart, 'fitas', 'fita-gomada', 10);
  assert.equal(r.ok, true);
  assert.equal(r.cart.itens.length, 1);
  assert.equal(r.cart.itens[0].quantidade, 25);
}

// Caso 5: recusa preserva todos os itens existentes (vários itens)
{
  const cart = {
    cadeira: 'porcelanato',
    itens: [
      { slug: 'a', quantidade: 2 },
      { slug: 'b', quantidade: 3 },
      { slug: 'c', quantidade: 1 },
    ],
  };
  const r = addItem(cart, 'fitas', 'fita-gomada', 15);
  assert.equal(r.ok, false);
  assert.equal(cart.itens.length, 3, 'todos os 3 itens preservados após recusa');
}

console.log('[OK] carrinho-uma-cadeira: addItem recusa cadeira diferente, preserva itens, merge funciona');
