// Cálculo puro da fatura mensal de success fee (D2). Sem Prisma, sem Asaas — testável
// isoladamente (test/success-fee.test.mjs). A rota /api/faturas lê do DB, chama esta
// função e só então emite a cobrança.

export interface NegocioCalc {
  id: string;
  valor: number;
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

/** Inclui: estagio==='ganho' && faturavel && !pedidoReembolsado && !jaFaturado. */
export function calcularFaturaMensal(comissaoPct: number, negocios: NegocioCalc[]): FaturaCalculada {
  const elegiveis = negocios.filter(
    (n) => n.estagio === 'ganho' && n.faturavel && !n.pedidoReembolsado && !n.jaFaturado,
  );
  const base = money(elegiveis.reduce((sum, n) => sum + n.valor, 0));
  const valor = money(base * comissaoPct);
  return { base, valor, negocioIds: elegiveis.map((n) => n.id) };
}
