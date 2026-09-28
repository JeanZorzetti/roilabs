/**
 * Formatação e parsing sem dependência, para que as páginas públicas não
 * tragam o catálogo junto. Este módulo não importa nada — é o piso da árvore
 * de imports, então nada que ele usa pode vazar para quem o usa.
 */

// Formatador próprio em vez do `brl` do catálogo: importar catalog.ts aqui
// arrastaria custo, margem e piso para o módulo que a página pública usa. São
// três linhas contra uma dependência que não pode existir.
export function money(value: number): string {
  // A Gotham tem o espaço não-separável (U+00A0) com largura quebrada — 749px a
  // 30px de fonte, o que joga o número para fora da tela. O Intl usa U+00A0
  // entre "R$" e o valor, então ele sai aqui, na origem, e não em cada tela.
  // Centavos só quando existem: preço de tabela sai "R$ 690", preço promocional
  // sai "R$ 798,90" — arredondar para real mostraria outro número.
  const cents = Number.isInteger(value) ? 0 : 2;
  return value
    .toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: cents,
      maximumFractionDigits: cents,
    })
    .replace(/ /g, " ");
}

// ponytail: mapa de 1 irregular em vez de biblioteca de pluralização. As
// unidades reais são hora, mês, chamado, peça, página e usuário — só "mês" não
// segue a regra do "+s". Apareceu outra irregular? Uma linha aqui.
const PLURAL: Record<string, string> = { "mês": "meses" };

/**
 * Linha livre escrita em várias linhas: a primeira é o título, as demais viram
 * os marcadores que o cliente lê — reaproveita o mesmo `items` que as ofertas de
 * catálogo já renderizam. Marcador digitado ("- ", "• ") sai do texto para não
 * duplicar com o da tela.
 */
export function splitCustomLabel(label: string): { name: string; items: string[] } {
  const [name = "", ...items] = label
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•·]\s*/, "").trim())
    .filter((line) => line.length > 0);

  return { name, items };
}

export function unitLabel(unit: string, qty: number): string {
  if (qty === 1) return unit;
  return PLURAL[unit] ?? (unit.endsWith("s") ? unit : `${unit}s`);
}
