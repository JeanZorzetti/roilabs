// Static freight table for Grande Goiânia (FR-010/011/016). No carrier API (YAGNI).
// retirada → 0; CEP in a range → flat value; CEP outside → null = "a combinar"
// (total online = product only; operation closes freight with the supplier later).
// ponytail: operator knob — edit ranges/values here. Swap for a carrier calc only
// if sales leave the polo. Front (carrinho.astro) mirrors this same table for display.

type Faixa = { min: number; max: number; valor: number; prazo: string; regiao: string };

// Ranges over the first 5 CEP digits (numeric). Grande Goiânia.
// ponytail: prazo is an operator knob (real lead times per region) — edit alongside valor.
const FAIXAS: Faixa[] = [
  { min: 74000, max: 74894, valor: 150, prazo: '2–4 dias úteis', regiao: 'Goiânia' },
  { min: 74900, max: 74999, valor: 180, prazo: '3–5 dias úteis', regiao: 'Aparecida de Goiânia' },
  { min: 75250, max: 75269, valor: 200, prazo: '3–6 dias úteis', regiao: 'Senador Canedo' },
  { min: 75370, max: 75379, valor: 220, prazo: '4–7 dias úteis', regiao: 'Goianira' },
  { min: 75380, max: 75399, valor: 220, prazo: '4–7 dias úteis', regiao: 'Trindade' },
];

export type Entrega = 'retirada' | 'entrega';
export type FaixaInfo = { valor: number; prazo: string; regiao: string };

/** The freight band for a CEP, or null when outside the table (= "a combinar"). */
export function getFaixa(cep?: string | null): FaixaInfo | null {
  const digits = (cep ?? '').replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const prefix = parseInt(digits.slice(0, 5), 10);
  const f = FAIXAS.find((x) => prefix >= x.min && prefix <= x.max);
  return f ? { valor: f.valor, prazo: f.prazo, regiao: f.regiao } : null;
}

/** 0 = retirada · number = freight from table · null = "a combinar" (CEP outside / invalid). */
export function calcFrete(entrega: Entrega, cep?: string | null): number | null {
  if (entrega === 'retirada') return 0;
  return getFaixa(cep)?.valor ?? null;
}
