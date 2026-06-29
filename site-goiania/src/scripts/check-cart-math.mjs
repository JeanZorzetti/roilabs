// Self-check for the cart math (ponytail: smallest runnable guard, no framework).
// Run: node src/scripts/check-cart-math.mjs
// Covers (a) m²→caixas (ceil, +waste, min 1); (b) Σ subtotais == total; (c) waste clamp 5–20%;
// (d) coupon math (percentual/fixo, never negative, product-only); (e) share-link round-trip.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mirror of m2ParaCaixas + clampPerda in src/lib/cart.ts — keep in sync.
const PERDA = 0.1, PERDA_MIN = 0.05, PERDA_MAX = 0.2;
const m2ParaCaixas = (m2, m2_caixa, perda = PERDA) =>
  m2 > 0 && m2_caixa > 0 ? Math.max(1, Math.ceil((m2 * (1 + perda)) / m2_caixa)) : 1;
const clampPerda = (p) => (!Number.isFinite(p) ? PERDA : Math.min(PERDA_MAX, Math.max(PERDA_MIN, p)));

// (a) box conversion
assert.equal(m2ParaCaixas(25, 1.7), 17, '25 m² @ 1.7 m²/cx +10% → 17 caixas');
assert.equal(m2ParaCaixas(4.4, 2.2, 0), 2, 'exact fit, no waste → 2');
assert.equal(m2ParaCaixas(2.2, 2.2), 2, 'exact area but +10% waste rounds up → 2');
assert.equal(m2ParaCaixas(0.05, 2.2), 1, 'tiny area → minimum 1 caixa');
assert.equal(m2ParaCaixas(0, 2.2), 1, 'zero/invalid → 1');
assert.equal(m2ParaCaixas(8, 0), 1, 'invalid m²/caixa → 1');

// (c) waste clamp 5–20% + area→caixas (simulador, T012)
assert.equal(clampPerda(0), 0.05, '0% folga clamps to 5%');
assert.equal(clampPerda(0.9), 0.2, '90% folga clamps to 20%');
assert.equal(clampPerda(0.1), 0.1, '10% stays');
assert.equal(clampPerda(NaN), 0.1, 'invalid folga → default 10%');
assert.equal(m2ParaCaixas(22, 2.2, clampPerda(0.1)), 11, 'Σ ambientes 22 m² @2.2 +10% → 11 cx');
assert.equal(m2ParaCaixas(22, 2.2, clampPerda(0)), 11, 'folga 0%→5%: 22 m² → 11 cx');
assert.equal(m2ParaCaixas(22, 2.2, clampPerda(0.9)), 12, 'folga 90%→20%: 22 m² → 12 cx');

// (d) coupon math (mirror of validarCupom in app/src/lib/cupons.ts) — T022
const moneyc = (n) => Math.round(n * 100) / 100;
const descontoCupom = (tipo, valor, subtotal) =>
  moneyc(Math.min(Math.max(0, tipo === 'percentual' ? (subtotal * valor) / 100 : valor), subtotal));
assert.equal(descontoCupom('percentual', 10, 1000), 100, '10% de 1000 → 100');
assert.equal(descontoCupom('fixo', 50, 1000), 50, 'fixo R$50 → 50');
assert.equal(descontoCupom('fixo', 5000, 1000), 1000, 'fixo > subtotal → clamp ao subtotal (nunca negativo)');
assert.equal(descontoCupom('percentual', 200, 1000), 1000, '% absurdo → nunca passa do subtotal');
// product-only: discount never touches frete → total = subtotal − desconto + frete
assert.equal(moneyc(1000 - descontoCupom('percentual', 10, 1000) + 150), 1050, 'total = produto − desconto + frete');

// (e) share-link round-trip + 30-day expiry (mirror of encode/decodeCart) — T025
const b64urlEncode = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlDecode = (s) => atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
const TTL = 30 * 24 * 60 * 60 * 1000;
const encode = (items, ts = Date.now()) => b64urlEncode(JSON.stringify({ v: 1, ts, items }));
const decode = (token) => {
  let p;
  try { p = JSON.parse(b64urlDecode(token)); } catch { return 'expired'; }
  if (p?.v !== 1 || !Array.isArray(p.items) || !Number.isFinite(p.ts)) return 'expired';
  if (Date.now() - p.ts > TTL) return 'expired';
  return p.items;
};
const linkItems = [{ slug: 'porcelanato-nero-polido-delta', caixas: 3 }, { slug: 'porcelanato-avorio-polido-delta', caixas: 1 }];
assert.deepEqual(decode(encode(linkItems)), linkItems, 'encode→decode round-trips os itens');
assert.equal(decode(encode(linkItems, Date.now() - TTL - 1000)), 'expired', 'link > 30 dias → expired');
assert.equal(decode('!!!nao-base64!!!'), 'expired', 'token malformado → expired');

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

console.log('[OK] cart math: m²→caixas, Σ subtotais==total, folga 5–20%, cupom (≥0, produto-only), link round-trip+expiração');
