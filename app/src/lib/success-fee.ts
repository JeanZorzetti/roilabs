// Cálculo puro da fatura mensal de success fee (D2/D4). Sem Prisma, sem Asaas — testável
// isoladamente (test/success-fee.test.mjs). A rota /api/faturas lê do DB, chama esta
// função e só então emite a cobrança.
//
// 010: cada negócio carrega sua própria taxaAplicada (snapshot na criação). A fatura SOMA
// por negócio (Σ valor × taxaAplicada), não aplica uma taxa única sobre o total.

export interface NegocioCalc {
  id: string;
  valor: number;
  taxaAplicada: number; // fração [0,1] congelada na criação do negócio
  estagio: string;
  faturavel: boolean;
  pedidoReembolsado: boolean;
  jaFaturado: boolean;
}

export interface FaturaCalculada {
  base: number;
  valor: number;
  negocioIds: string[];
}

const money = (n: number) => Math.round(n * 100) / 100;

/** Elegível: estagio==='ganho' && faturavel && !pedidoReembolsado && !jaFaturado. */
export const elegivel = (n: NegocioCalc) =>
  n.estagio === 'ganho' && n.faturavel && !n.pedidoReembolsado && !n.jaFaturado;

export function calcularFaturaMensal(negocios: NegocioCalc[]): FaturaCalculada {
  const elegiveis = negocios.filter(elegivel);
  const base = money(elegiveis.reduce((sum, n) => sum + n.valor, 0));
  // Arredonda por negócio antes de somar: o total confere com o breakdown do demonstrativo (SC-002).
  const valor = money(elegiveis.reduce((sum, n) => sum + money(n.valor * n.taxaAplicada), 0));
  return { base, valor, negocioIds: elegiveis.map((n) => n.id) };
}
