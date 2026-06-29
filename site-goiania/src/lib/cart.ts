// Client-side cart (localStorage, no login) for the static site. Vanilla TS, no state lib.
// Stores only { slug, caixas }; price/m²-per-box come from the product catalog for display.
// The SERVER recomputes money at checkout (FR-005) — this is display only.
import { produtosBySlug, nomeProduto, formatPreco } from '../data/produtos';

const KEY = 'roi_cart_v1';
export const PERDA_DEFAULT = 0.1; // 10% waste allowance
export const CART_EVENT = 'roi-cart-change';

export interface CartItem {
  slug: string;
  caixas: number;
}

/** m² of the job → whole closed boxes: round up, add waste, minimum 1 (FR-002). */
export function m2ParaCaixas(m2: number, m2_caixa: number, perda = PERDA_DEFAULT): number {
  if (!(m2 > 0) || !(m2_caixa > 0)) return 1;
  return Math.max(1, Math.ceil((m2 * (1 + perda)) / m2_caixa));
}

export function getCart(): CartItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((i) => i && typeof i.slug === 'string' && Number.isFinite(i.caixas))
      .map((i) => ({ slug: i.slug, caixas: Math.max(1, Math.floor(i.caixas)) }));
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

/** Adds boxes for a slug (merges with an existing line). */
export function addItem(slug: string, caixas: number) {
  const items = getCart();
  const existing = items.find((i) => i.slug === slug);
  if (existing) existing.caixas += Math.max(1, Math.floor(caixas));
  else items.push({ slug, caixas: Math.max(1, Math.floor(caixas)) });
  save(items);
}

export function setCaixas(slug: string, caixas: number) {
  const items = getCart();
  const item = items.find((i) => i.slug === slug);
  if (!item) return;
  item.caixas = Math.max(1, Math.floor(caixas));
  save(items);
}

export function removeItem(slug: string) {
  save(getCart().filter((i) => i.slug !== slug));
}

/** Distinct line count — for the header badge. */
export function count(): number {
  return getCart().length;
}

export interface CartLine extends CartItem {
  nome: string;
  m2_caixa: number;
  preco: number;
  m2: number;
  subtotal: number;
  precoFmt: string;
  subtotalFmt: string;
}

/** Resolves cart items against the catalog, dropping unknown slugs (edge case from spec). */
export function lines(): CartLine[] {
  const out: CartLine[] = [];
  for (const it of getCart()) {
    const p = produtosBySlug.get(it.slug);
    if (!p) continue;
    const { m2_caixa, preco } = p.atributos;
    const m2 = it.caixas * m2_caixa;
    const subtotal = m2 * preco;
    out.push({
      ...it,
      nome: `${p.atributos.marca} ${nomeProduto(p)}`,
      m2_caixa,
      preco,
      m2,
      subtotal,
      precoFmt: formatPreco(preco),
      subtotalFmt: formatPreco(subtotal),
    });
  }
  return out;
}

export function totalProduto(): number {
  return lines().reduce((sum, l) => sum + l.subtotal, 0);
}
