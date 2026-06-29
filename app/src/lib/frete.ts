// Static freight table for Grande Goiânia (FR-010/011/016). No carrier API (YAGNI).
// retirada → 0; CEP in a range → flat value; CEP outside → null = "a combinar"
// (total online = product only; operation closes freight with the supplier later).
// ponytail: operator knob — edit ranges/values here. Swap for a carrier calc only
// if sales leave the polo. Front (carrinho.astro) mirrors this same table for display.

type Faixa = { min: number; max: number; valor: number; regiao: string };

// Ranges over the first 5 CEP digits (numeric). Grande Goiânia.
const FAIXAS: Faixa[] = [
  { min: 74000, max: 74894, valor: 150, regiao: 'Goiânia' },
  { min: 74900, max: 74999, valor: 180, regiao: 'Aparecida de Goiânia' },
  { min: 75250, max: 75269, valor: 200, regiao: 'Senador Canedo' },
  { min: 75370, max: 75379, valor: 220, regiao: 'Goianira' },
  { min: 75380, max: 75399, valor: 220, regiao: 'Trindade' },
];

export type Entrega = 'retirada' | 'entrega';

/** 0 = retirada · number = freight from table · null = "a combinar" (CEP outside / invalid). */
export function calcFrete(entrega: Entrega, cep?: string | null): number | null {
  if (entrega === 'retirada') return 0;
  const digits = (cep ?? '').replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const prefix = parseInt(digits.slice(0, 5), 10);
  const faixa = FAIXAS.find((f) => prefix >= f.min && prefix <= f.max);
  return faixa ? faixa.valor : null;
}
