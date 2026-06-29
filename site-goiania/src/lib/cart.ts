// Client-side cart (localStorage, no login) for the static site. Vanilla TS, no state lib.
// Stores only { slug, caixas }; price/m²-per-box come from the product catalog for display.
// The SERVER recomputes money at checkout (FR-005) — this is display only.
import { produtosBySlug, nomeProduto, formatPreco } from '../data/produtos';

const KEY = 'roi_cart_v1';
export const PERDA_DEFAULT = 0.1; // 10% waste allowance
export const PERDA_MIN = 0.05;
export const PERDA_MAX = 0.2;
export const CART_EVENT = 'roi-cart-change';

export interface Ambiente {
  largura: number;
  comprimento: number;
}

export interface CartItem {
  slug: string;
  caixas: number;
  perda?: number; // waste fraction 0.05–0.20; absent ⇒ PERDA_DEFAULT (display/conversion only)
  ambientes?: Ambiente[]; // to reopen the m² simulator; NEVER sent to the server
}

/** Sensible-range waste fraction → clamped 5–20% (FR-005 simulator). Bad input → default. */
export function clampPerda(perda: number): number {
  if (!Number.isFinite(perda)) return PERDA_DEFAULT;
  return Math.min(PERDA_MAX, Math.max(PERDA_MIN, perda));
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
      .map((i) => {
        const item: CartItem = { slug: i.slug, caixas: Math.max(1, Math.floor(i.caixas)) };
        if (Number.isFinite(i.perda)) item.perda = clampPerda(i.perda);
        if (Array.isArray(i.ambientes)) {
          const amb = i.ambientes
            .filter((a: unknown): a is Ambiente =>
              !!a && Number.isFinite((a as Ambiente).largura) && Number.isFinite((a as Ambiente).comprimento))
            .map((a: Ambiente) => ({ largura: Number(a.largura), comprimento: Number(a.comprimento) }));
          if (amb.length) item.ambientes = amb;
        }
        return item;
      });
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

/** Edit a line by m² of the job → converts to whole closed boxes (keeps the invariant). */
export function setM2(slug: string, m2: number) {
  const items = getCart();
  const item = items.find((i) => i.slug === slug);
  const p = produtosBySlug.get(slug);
  if (!item || !p) return;
  item.caixas = m2ParaCaixas(m2, p.atributos.m2_caixa, item.perda ?? PERDA_DEFAULT);
  save(items);
}

/** Adds/updates a line from the room simulator: Σ(l×c) + clamped waste → boxes;
 *  persists ambientes/perda client-side so the simulator can reopen pre-filled. */
export function addFromSimulador(slug: string, ambientes: Ambiente[], perda = PERDA_DEFAULT) {
  const p = produtosBySlug.get(slug);
  if (!p) return;
  const folga = clampPerda(perda);
  const area = ambientes.reduce((s, a) => s + Math.max(0, a.largura) * Math.max(0, a.comprimento), 0);
  const caixas = m2ParaCaixas(area, p.atributos.m2_caixa, folga);
  const items = getCart();
  const existing = items.find((i) => i.slug === slug);
  if (existing) {
    existing.caixas = caixas;
    existing.ambientes = ambientes;
    existing.perda = folga;
  } else {
    items.push({ slug, caixas, ambientes, perda: folga });
  }
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

// ── Share link: payload in the URL, no DB/cron (D4). Only {slug,caixas} — no money;
//    the server recomputes everything at checkout (FR-017). Soft 30-day expiry.
const LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// base64url over ASCII JSON (slugs + numbers). btoa/atob exist in the browser and Node 20+.
const b64urlEncode = (s: string) =>
  btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlDecode = (s: string) =>
  atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));

/** Encodes the current cart into a shareable token (`/carrinho?c=<token>`). */
export function encodeCart(): string {
  const items = getCart().map((i) => ({ slug: i.slug, caixas: i.caixas }));
  return b64urlEncode(JSON.stringify({ v: 1, ts: Date.now(), items }));
}

/** Decodes a share token → cart items, or `'expired'` (older than 30 days or malformed). */
export function decodeCart(token: string): CartItem[] | 'expired' {
  let payload: { v?: unknown; ts?: unknown; items?: unknown };
  try {
    payload = JSON.parse(b64urlDecode(token));
  } catch {
    return 'expired';
  }
  if (payload?.v !== 1 || !Array.isArray(payload.items) || !Number.isFinite(payload.ts)) return 'expired';
  if (Date.now() - (payload.ts as number) > LINK_TTL_MS) return 'expired';
  return (payload.items as Array<{ slug?: unknown; caixas?: unknown }>)
    .filter((i) => i && typeof i.slug === 'string' && Number.isFinite(i.caixas))
    .map((i) => ({ slug: i.slug as string, caixas: Math.max(1, Math.floor(i.caixas as number)) }));
}

/** Overwrites the cart (used to restore from a shared link). */
export function restoreCart(items: CartItem[]) {
  save(items);
}
