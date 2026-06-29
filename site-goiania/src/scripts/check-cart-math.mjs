// Self-check for the cart math (ponytail: smallest runnable guard, no framework).
// Run: node src/scripts/check-cart-math.mjs
// Covers (a) m²→caixas (ceil, +10% waste, min 1) and (b) Σ subtotais == total (no freight).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mirror of m2ParaCaixas in src/lib/cart.ts — keep in sync.
const PERDA = 0.1;
const m2ParaCaixas = (m2, m2_caixa, perda = PERDA) =>
  m2 > 0 && m2_caixa > 0 ? Math.max(1, Math.ceil((m2 * (1 + perda)) / m2_caixa)) : 1;

// (a) box conversion
assert.equal(m2ParaCaixas(25, 1.7), 17, '25 m² @ 1.7 m²/cx +10% → 17 caixas');
assert.equal(m2ParaCaixas(4.4, 2.2, 0), 2, 'exact fit, no waste → 2');
assert.equal(m2ParaCaixas(2.2, 2.2), 2, 'exact area but +10% waste rounds up → 2');
assert.equal(m2ParaCaixas(0.05, 2.2), 1, 'tiny area → minimum 1 caixa');
assert.equal(m2ParaCaixas(0, 2.2), 1, 'zero/invalid → 1');
assert.equal(m2ParaCaixas(8, 0), 1, 'invalid m²/caixa → 1');

// (b) subtotal sum invariant against the real catalog
const produtos = JSON.parse(readFileSync(join(__dirname, '../../porcelanatos.json'), 'utf8'));
const bySlug = new Map(produtos.map((p) => [p.slug, p.atributos]));
const cart = [
  { slug: produtos[0].slug, caixas: 3 },
  { slug: produtos[1].slug, caixas: 5 },
];
const money = (n) => Math.round(n * 100) / 100;
let soma = 0;
for (const it of cart) {
  const a = bySlug.get(it.slug);
  assert.ok(a, `slug do carrinho existe no catálogo: ${it.slug}`);
  const subtotal = money(it.caixas * a.m2_caixa * a.preco);
  soma = money(soma + subtotal);
}
const total = money(cart.reduce((s, it) => {
  const a = bySlug.get(it.slug);
  return s + it.caixas * a.m2_caixa * a.preco;
}, 0));
assert.equal(soma, total, 'Σ subtotais == total (sem frete)');

console.log('[OK] cart math: m²→caixas e Σ subtotais == total');
