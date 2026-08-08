// Client-side cart (localStorage, no login) para o motor de loja multicadeira (013).
// Vanilla TS, sem biblioteca de estado.
// Armazena a cadeira ativa e os itens (slug + quantidade).
// O SERVIDOR re-calcula o dinheiro no checkout (FR-005) — aqui é só para display.

import { lojasById, getUnidade } from '../data/lojas';
import type { Unidade } from '../data/unidades';

const KEY = 'roi_cart_v2';
const KEY_V1_PORC = 'roi_cart_v1';
const KEY_V1_FITAS = 'roi_cart_fitas_v1';

export const CART_EVENT = 'roi-cart-change';

// ── Tipos do Banco (LocalStorage) ───────────────────────────────────────────

export interface Ambiente {
  largura: number;
  comprimento: number;
}

export interface CartItem {
  slug: string;
  quantidade: number;
  extras?: {
    perda?: number; // Para simulador de porcelanato
    ambientes?: Ambiente[];
  };
}

export interface CartState {
  cadeira: string;
  itens: CartItem[];
}

// ── Tipos de Display ────────────────────────────────────────────────────────

export interface CartLine extends CartItem {
  nome: string;
  precoUnitario: number;
  subtotal: number;
  subtotalFmt: string;
  detalhe: Record<string, unknown>;
  unidade: Unidade;
}

export interface CartResolved {
  cadeira: string;
  lines: CartLine[];
  totalProduto: number;
  totalProdutoFmt: string;
}

// ── Helpers numéricos ───────────────────────────────────────────────────────

const money = (n: number) => Math.round(n * 100) / 100;
export const formatPreco = (n: number) =>
  Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const PERDA_DEFAULT = 0.1;
export const PERDA_MIN = 0.05;
export const PERDA_MAX = 0.2;

export function clampPerda(perda: number): number {
  if (!Number.isFinite(perda)) return PERDA_DEFAULT;
  return Math.min(PERDA_MAX, Math.max(PERDA_MIN, perda));
}

export function m2ParaCaixas(m2: number, m2_caixa: number, perda = PERDA_DEFAULT): number {
  if (!(m2 > 0) || !(m2_caixa > 0)) return 1;
  return Math.max(1, Math.ceil((m2 * (1 + perda)) / m2_caixa));
}

// ── Leitura e Migração (013) ────────────────────────────────────────────────

export function getCart(): CartState {
  if (typeof localStorage === 'undefined') return { cadeira: 'porcelanato', itens: [] };

  // Tenta v2
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw.cadeira === 'string' && Array.isArray(raw.itens)) {
      return {
        cadeira: raw.cadeira,
        itens: raw.itens
          .filter((i: unknown) => i && typeof (i as CartItem).slug === 'string' && Number.isFinite((i as CartItem).quantidade))
          .map((i: any) => ({
            slug: i.slug,
            quantidade: Math.max(1, i.quantidade), // Decimal para m², mas min 1 (ajustado depois)
            extras: i.extras,
          })),
      };
    }
  } catch {}

  // Não tem v2, tenta migrar v1 de porcelanato ou fitas
  try {
    const rawFitas = localStorage.getItem(KEY_V1_FITAS);
    if (rawFitas) {
      const arr = JSON.parse(rawFitas);
      if (Array.isArray(arr) && arr.length > 0) {
        const state: CartState = {
          cadeira: 'fitas',
          itens: arr.filter(i => i && i.slug).map((i: any) => ({ slug: i.slug, quantidade: Math.max(1, Math.floor(i.rolos || 1)) })),
        };
        localStorage.removeItem(KEY_V1_FITAS);
        localStorage.setItem(KEY, JSON.stringify(state));
        return state;
      }
    }

    const rawPorc = localStorage.getItem(KEY_V1_PORC);
    if (rawPorc) {
      const arr = JSON.parse(rawPorc);
      if (Array.isArray(arr) && arr.length > 0) {
        // v1 de porcelanato guardava 'caixas', agora é 'quantidade' (caixas ainda para a UI antiga, mas o banco unificado pede quantidade abstrata.
        // Espera, porcelanato no carrinho v1 guardava `caixas`. A quantidade unificada vai ser caixas também?
        // Sim, no carrinho o item ainda é pedido por caixas (o front converte para m² no display). O backend converte caixas em m² via catalogo.
        // Então quantidade no cart.ts de porcelanato ainda é 'caixas'.
        const state: CartState = {
          cadeira: 'porcelanato',
          itens: arr.filter(i => i && i.slug).map((i: any) => ({
            slug: i.slug,
            quantidade: Math.max(1, Math.floor(i.caixas || 1)),
            extras: { perda: i.perda, ambientes: i.ambientes },
          })),
        };
        localStorage.removeItem(KEY_V1_PORC);
        localStorage.setItem(KEY, JSON.stringify(state));
        return state;
      }
    }
  } catch {}

  return { cadeira: 'porcelanato', itens: [] };
}

function save(state: CartState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function clearCart() {
  save({ cadeira: 'porcelanato', itens: [] });
}

// ── Modificações (FR-005a) ──────────────────────────────────────────────────

export type AddResult = { ok: true } | { ok: false; cadeiraAtual: string };

export function addItem(cadeira: string, slug: string, quantidade: number, extras?: CartItem['extras']): AddResult {
  const state = getCart();

  // Se o carrinho tem itens e é de outra cadeira, recusa e não mexe em nada
  if (state.itens.length > 0 && state.cadeira !== cadeira) {
    return { ok: false, cadeiraAtual: state.cadeira };
  }

  // Se o carrinho estava vazio ou é da mesma cadeira, apenas seta a cadeira
  state.cadeira = cadeira;

  const existing = state.itens.find((i) => i.slug === slug);
  if (existing) {
    existing.quantidade += Math.max(0, quantidade); // pode somar decimal se a unidade permitir
    if (extras) existing.extras = { ...existing.extras, ...extras };
  } else {
    state.itens.push({ slug, quantidade: Math.max(0, quantidade), extras });
  }

  save(state);
  return { ok: true };
}

export function setQuantidade(slug: string, quantidade: number) {
  const state = getCart();
  const item = state.itens.find((i) => i.slug === slug);
  if (!item) return;
  item.quantidade = Math.max(0, quantidade); // min 0 para aceitar floats validos (ex: 0.5kg), a regra de negócio decide depois
  save(state);
}

export function removeItem(slug: string) {
  const state = getCart();
  state.itens = state.itens.filter((i) => i.slug !== slug);
  save(state);
}

export function count(): number {
  return getCart().itens.length;
}

// ── Simulador de Porcelanato (mantido para a interface) ─────────────────────

export function setM2(slug: string, m2: number) {
  const state = getCart();
  if (state.cadeira !== 'porcelanato') return;
  const item = state.itens.find((i) => i.slug === slug);
  const loja = lojasById.get('porcelanato');
  const p = loja?.catalogo.find((x: any) => x.slug === slug) as any;
  if (!item || !p) return;
  item.quantidade = m2ParaCaixas(m2, p.atributos.m2_caixa, item.extras?.perda ?? PERDA_DEFAULT);
  save(state);
}

export function addFromSimulador(slug: string, ambientes: Ambiente[], perda = PERDA_DEFAULT): AddResult {
  const folga = clampPerda(perda);
  const area = ambientes.reduce((s, a) => s + Math.max(0, a.largura) * Math.max(0, a.comprimento), 0);
  const loja = lojasById.get('porcelanato');
  const p = loja?.catalogo.find((x: any) => x.slug === slug) as any;
  if (!p) return { ok: true }; // falha silenciosa, igual original
  const caixas = m2ParaCaixas(area, p.atributos.m2_caixa, folga);
  return addItem('porcelanato', slug, caixas, { ambientes, perda: folga });
}

// ── Resolução e Precificação (Display) ──────────────────────────────────────

export function resolveCart(): CartResolved {
  const state = getCart();
  const loja = lojasById.get(state.cadeira);
  if (!loja || state.itens.length === 0) {
    return { cadeira: state.cadeira, lines: [], totalProduto: 0, totalProdutoFmt: 'R$ 0,00' };
  }

  const unidadeDef = getUnidade(loja);
  const out: CartLine[] = [];
  let total = 0;

  for (const it of state.itens) {
    const p = loja.catalogo.find((x: any) => x.slug === it.slug) as any;
    if (!p) continue;

    // Resolve nome: padrão de porcelanato ("marca nome") ou só nome
    const nome = p.atributos?.marca && p.nome ? `${p.atributos.marca} ${p.nome}` : p.nome ?? it.slug;

    // IMPORTANTE: O front no caso do porcelanato ainda pensa em "caixas" no carrinho, 
    // mas o `precificar` do `unidades.ts` recebe "quantidade na unidade da loja" (m²).
    // Então, se a unidade é m², a quantidade armazenada aqui é caixas, precisamos passar
    // os m² reais para o precificador.
    let quantNaUnidade = it.quantidade;
    if (loja.unidade === 'm2') {
      const m2_caixa = p.atributos?.m2_caixa ?? 0;
      quantNaUnidade = it.quantidade * m2_caixa;
    }

    const { precoUnitario, detalhe } = unidadeDef.precificar(p, quantNaUnidade);
    const subtotal = money(quantNaUnidade * precoUnitario);
    total = money(total + subtotal);

    out.push({
      ...it,
      nome,
      precoUnitario,
      subtotal,
      subtotalFmt: formatPreco(subtotal),
      detalhe,
      unidade: unidadeDef,
    });
  }

  return {
    cadeira: state.cadeira,
    lines: out,
    totalProduto: total,
    totalProdutoFmt: formatPreco(total),
  };
}

// ── Share Link (D4) ─────────────────────────────────────────────────────────

const LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const b64urlEncode = (s: string) =>
  btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlDecode = (s: string) =>
  atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));

/**
 * Token a partir de uma lista ARBITRÁRIA de itens — não do carrinho atual. É o que a página
 * de favoritos precisa: montar link compartilhável sem tocar no carrinho de quem clica.
 * A 013 removeu esta função ao reescrever o carrinho, mas o chamador continuou importando —
 * e é por isso que o site parou de buildar.
 */
export function encodeItems(cadeira: string, itens: Array<{ slug: string; quantidade: number }>): string {
  return b64urlEncode(JSON.stringify({ v: 2, ts: Date.now(), cadeira, itens }));
}

export function encodeCart(): string {
  const state = getCart();
  return encodeItems(
    state.cadeira,
    state.itens.map((i) => ({ slug: i.slug, quantidade: i.quantidade })),
  );
}

/** Aceita v1 (array de {slug, caixas}) e v1_fitas, ou v2 ({cadeira, itens}) */
export function decodeCart(token: string): CartState | 'expired' {
  let payload: any;
  try {
    payload = JSON.parse(b64urlDecode(token));
  } catch {
    return 'expired';
  }

  const ts = typeof payload.ts === 'number' ? payload.ts : null;
  if (!ts || Date.now() - ts > LINK_TTL_MS) return 'expired';

  // v1: array puro no payload.items (assumimos porcelanato)
  if (payload.v === 1 && Array.isArray(payload.items)) {
    return {
      cadeira: 'porcelanato',
      itens: payload.items
        .filter((i: any) => i && typeof i.slug === 'string' && Number.isFinite(i.caixas))
        .map((i: any) => ({ slug: i.slug, quantidade: Math.max(1, Math.floor(i.caixas)) })),
    };
  }

  // v2
  if (payload.v === 2 && typeof payload.cadeira === 'string' && Array.isArray(payload.itens)) {
    return {
      cadeira: payload.cadeira,
      itens: payload.itens
        .filter((i: any) => i && typeof i.slug === 'string' && Number.isFinite(i.quantidade))
        .map((i: any) => ({ slug: i.slug, quantidade: Math.max(1, i.quantidade) })),
    };
  }

  return 'expired';
}

export function restoreCart(state: CartState) {
  save(state);
}
