// Carrinho do vertical FITAS (011). Paralelo a cart.ts (porcelanato), que NÃO é tocado.
//
// A chave diferente resolve o FR-028 por construção: dois carrinhos no localStorage com
// chaves distintas não colidem, sem uma linha de lógica de coordenação.
//
// Muito menor que o de porcelanato de propósito: rolo é unidade inteira, sem perda de
// corte, sem simulador de ambiente, sem conversão de área. O SERVIDOR recalcula o dinheiro
// no checkout (FR-006) — o que está aqui é display.
import { fitasBySlug, formatPreco, type Fita } from '../data/fitas';

const KEY = 'roi_cart_fitas_v1';
export const CART_FITAS_EVENT = 'roi-cart-fitas-change';

export interface CartFitaItem {
  slug: string;
  rolos: number;
}

export function getCart(): CartFitaItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((i) => i && typeof i.slug === 'string' && Number.isFinite(i.rolos))
      .map((i) => ({ slug: i.slug, rolos: Math.max(1, Math.floor(i.rolos)) }));
  } catch {
    return [];
  }
}

function save(items: CartFitaItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_FITAS_EVENT));
}

/** Piso por SKU (FR-029). O servidor revalida — aqui é só não deixar o comprador errar. */
const minimo = (slug: string) => fitasBySlug.get(slug)?.minimoRolos ?? 1;

export function addItem(slug: string, rolos: number) {
  const items = getCart();
  const existing = items.find((i) => i.slug === slug);
  const add = Math.max(1, Math.floor(rolos));
  if (existing) existing.rolos += add;
  else items.push({ slug, rolos: Math.max(minimo(slug), add) });
  save(items);
}

export function setRolos(slug: string, rolos: number) {
  const items = getCart();
  const item = items.find((i) => i.slug === slug);
  if (!item) return;
  item.rolos = Math.max(minimo(slug), Math.floor(rolos) || minimo(slug));
  save(items);
}

export function removeItem(slug: string) {
  save(getCart().filter((i) => i.slug !== slug));
}

/** Linhas distintas — para o badge do header. */
export function count(): number {
  return getCart().length;
}

export interface CartFitaLine extends CartFitaItem {
  nome: string;
  precoRolo: number;
  subtotal: number;
  faixa: string;
  abaixoDoMinimo: boolean;
  minimoRolos: number;
  precoFmt: string;
  subtotalFmt: string;
}

/**
 * Unitário da faixa correspondente à quantidade — o display precisa ACOMPANHAR a faixa
 * quando o comprador muda a quantidade, senão o total do carrinho diverge do cobrado.
 * ponytail: espelho do precoPorQuantidade do servidor; as faixas vivem em data/fitas.ts,
 * que o check-matrix trava contra o institucional.
 */
function faixaPara(f: Fita, rolos: number): { precoRolo: number; rotulo: string } {
  // Faixas em ordem crescente de `min`: a última cujo piso a quantidade alcança é a
  // aplicável. `min` é campo próprio de propósito — derivar do rótulo (texto) daria
  // "15 a 100" → 15100 e cobraria a faixa errada.
  let escolhida = f.faixas[0];
  for (const fx of f.faixas) if (rolos >= fx.min) escolhida = fx;
  return { precoRolo: escolhida.precoRolo, rotulo: escolhida.rotulo };
}

/** Resolve os itens contra o catálogo, descartando slug desconhecido. */
export function lines(): CartFitaLine[] {
  const out: CartFitaLine[] = [];
  for (const it of getCart()) {
    const f = fitasBySlug.get(it.slug);
    if (!f) continue;
    const { precoRolo, rotulo } = faixaPara(f, it.rolos);
    out.push({
      ...it,
      nome: f.nome,
      precoRolo,
      subtotal: it.rolos * precoRolo,
      faixa: rotulo,
      abaixoDoMinimo: it.rolos < f.minimoRolos,
      minimoRolos: f.minimoRolos,
      precoFmt: formatPreco(precoRolo),
      subtotalFmt: formatPreco(it.rolos * precoRolo),
    });
  }
  return out;
}

export function totalProduto(): number {
  return lines().reduce((s, l) => s + l.subtotal, 0);
}
