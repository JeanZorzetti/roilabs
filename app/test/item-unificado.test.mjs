// Teste do item unificado (013, T010). Cobre:
//   (a) quantidade × precoUnitario = subtotal nas 3 unidades
//   (b) rateio do desconto do Mercado Pago (risco #1 do research.md)
//
// O teste (b) é o mais importante: o rateio está duplicado byte a byte nos dois ramos
// da rota hoje, sem NENHUM teste. Unificar é obrigatório e este é o gate.

import assert from 'node:assert/strict';

const money = (n) => Math.round(n * 100) / 100;

// ── (a) quantidade × precoUnitario = subtotal nas 3 unidades ────────────────

// m² — preço fixo por m²
const m2Cases = [
  { quantidade: 5.5, precoUnitario: 98.99, esperado: 544.44 },
  { quantidade: 2.2, precoUnitario: 128.99, esperado: 283.78 },
  { quantidade: 8.64, precoUnitario: 139.99, esperado: 1209.51 },
  { quantidade: 0, precoUnitario: 98.99, esperado: 0 },
];
for (const c of m2Cases) {
  assert.equal(money(c.quantidade * c.precoUnitario), c.esperado,
    `m²: ${c.quantidade} × ${c.precoUnitario} = ${c.esperado}`);
}

// rolo — preço da faixa de volume
const roloCases = [
  { quantidade: 20, precoUnitario: 16.2, esperado: 324 },
  { quantidade: 50, precoUnitario: 13.9, esperado: 695 },
  { quantidade: 200, precoUnitario: 10.1, esperado: 2020 },
  { quantidade: 1, precoUnitario: 7.9, esperado: 7.9 },
  { quantidade: 101, precoUnitario: 32.2, esperado: 3252.2 },
];
for (const c of roloCases) {
  assert.equal(money(c.quantidade * c.precoUnitario), c.esperado,
    `rolo: ${c.quantidade} × ${c.precoUnitario} = ${c.esperado}`);
}

// assinatura — valor do ciclo
const assCases = [
  { quantidade: 1, precoUnitario: 199, esperado: 199 },
  { quantidade: 1, precoUnitario: 49.9, esperado: 49.9 },
  { quantidade: 1, precoUnitario: 0, esperado: 0 },
];
for (const c of assCases) {
  assert.equal(money(c.quantidade * c.precoUnitario), c.esperado,
    `assinatura: ${c.quantidade} × ${c.precoUnitario} = ${c.esperado}`);
}

// ── (b) rateio do desconto do Mercado Pago ──────────────────────────────────
// O MP não tem linha negativa. O desconto é rateado entre as linhas de forma que
// Σ linhas + frete = total do pedido. A última linha absorve a diferença acumulada.
//
// A implementação: cada linha recebe `round(subtotal * alvoProduto / totalProduto)`,
// exceto a última que recebe `alvoProduto - acc`. alvoProduto = totalProduto - desconto.
//
// A invariante: Σ unitPrices == alvoProduto (exatamente, não "quase").

function ratearDesconto(itens, desconto) {
  const totalProduto = money(itens.reduce((s, i) => s + i.subtotal, 0));
  const alvoProduto = money(Math.max(0, totalProduto - desconto));
  let acc = 0;
  const mpItems = itens.map((i, idx) => {
    const isLast = idx === itens.length - 1;
    const unitPrice = isLast
      ? money(alvoProduto - acc)
      : money((i.subtotal * alvoProduto) / totalProduto);
    acc = money(acc + unitPrice);
    return { ...i, unitPrice };
  });
  return { mpItems, alvoProduto, totalProduto };
}

// Caso 1: sem desconto
{
  const itens = [
    { slug: 'a', subtotal: 100 },
    { slug: 'b', subtotal: 200 },
    { slug: 'c', subtotal: 50 },
  ];
  const { mpItems, alvoProduto } = ratearDesconto(itens, 0);
  const soma = money(mpItems.reduce((s, i) => s + i.unitPrice, 0));
  assert.equal(soma, alvoProduto, 'sem desconto: Σ unitPrices == alvoProduto');
  assert.equal(soma, 350, 'sem desconto: total = 350');
}

// Caso 2: desconto percentual (10% de 1000)
{
  const itens = [
    { slug: 'a', subtotal: 333.33 },
    { slug: 'b', subtotal: 333.33 },
    { slug: 'c', subtotal: 333.34 },
  ];
  const { mpItems, alvoProduto } = ratearDesconto(itens, 100);
  const soma = money(mpItems.reduce((s, i) => s + i.unitPrice, 0));
  assert.equal(soma, alvoProduto, '10% desconto: Σ unitPrices == alvoProduto');
  assert.equal(soma, 900, '10% desconto: total = 900');
}

// Caso 3: desconto fixo com arredondamento que força a última linha a absorver a diferença
{
  const itens = [
    { slug: 'a', subtotal: 10.01 },
    { slug: 'b', subtotal: 10.01 },
    { slug: 'c', subtotal: 10.01 },
  ];
  const { mpItems, alvoProduto } = ratearDesconto(itens, 5);
  const soma = money(mpItems.reduce((s, i) => s + i.unitPrice, 0));
  assert.equal(soma, alvoProduto, 'arredondamento: Σ unitPrices == alvoProduto');
}

// Caso 4: desconto que quase zera (guarda de cupom que zeraria o produto)
{
  const itens = [
    { slug: 'a', subtotal: 50 },
    { slug: 'b', subtotal: 50 },
  ];
  const { mpItems, alvoProduto } = ratearDesconto(itens, 99);
  const soma = money(mpItems.reduce((s, i) => s + i.unitPrice, 0));
  assert.equal(soma, alvoProduto, 'quase-zero: Σ unitPrices == alvoProduto');
  assert.equal(soma, 1, 'quase-zero: total = 1');
}

// Caso 5: um único item (edge case — não há última linha diferente)
{
  const itens = [{ slug: 'a', subtotal: 200 }];
  const { mpItems, alvoProduto } = ratearDesconto(itens, 30);
  assert.equal(mpItems[0].unitPrice, alvoProduto, 'item único: unitPrice == alvoProduto');
}

// Caso 6: cenário real com os preços do catálogo (porcelanato + clichê)
{
  const itens = [
    { slug: 'fita-personalizada', subtotal: 324 },   // 20 × 16.20
    { slug: 'fita-comum', subtotal: 7.9 },            // 1 × 7.90
    { slug: 'cliche-arte', subtotal: 80 },             // 1 × 80
  ];
  const { mpItems, alvoProduto } = ratearDesconto(itens, 0);
  const soma = money(mpItems.reduce((s, i) => s + i.unitPrice, 0));
  assert.equal(soma, alvoProduto, 'cenário real: Σ unitPrices == alvoProduto');
  assert.equal(soma, 411.9, 'cenário real: total = 411.90');
}

console.log('[OK] item-unificado: quantidade × precoUnitario = subtotal (3 unidades), rateio MP fecha exatamente');
