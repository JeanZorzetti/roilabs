// Agregados da carteira (012, FR-010). Puros.
//
// ⚠️ O limite que a spec impõe é objetivo e não negociável: NENHUM número de faturamento,
// fee ou "receita da carteira" pode somar cadeira da casa. Exibir uma cadeira da casa como
// parceiro é decisão de posicionamento do Jean; somar o dinheiro dela é o mesmo defeito dos
// 20 pagamentos de teste da Atma.
//
// Este módulo existe para que a regra tenha UM lugar e um teste, em vez de virar um
// `where` que alguém esquece de repetir na próxima consulta.

export interface VendaAgregavel {
  valor: number;
  /** null = venda boa. 'conta-divergente' | 'payer-teste' = fora da receita. */
  motivoDescarte: string | null;
  /** A cadeira que originou a venda é da casa. */
  daCasa: boolean;
  /** null = não atribuída (FR-005) — falha fechada, nunca somada por aproximação. */
  parceiroId: string | null;
  status: string;
}

export interface ReceitaCarteira {
  /** Σ das vendas que contam como receita da carteira. */
  receita: number;
  /** Quantas vendas entraram. */
  vendas: number;
  /** O que ficou de fora e por quê — sem isto o número é afirmação, não medição. */
  excluidas: { daCasa: number; descartadas: number; naoAtribuidas: number; naoAprovadas: number };
}

const money = (n: number) => Math.round(n * 100) / 100;

/**
 * A ÚNICA definição de "receita da carteira". Uma venda só entra se passar em todas:
 *   aprovada · atribuída · sem motivo de descarte · cadeira NÃO da casa.
 */
export function receitaDaCarteira(vendas: VendaAgregavel[]): ReceitaCarteira {
  const excluidas = { daCasa: 0, descartadas: 0, naoAtribuidas: 0, naoAprovadas: 0 };
  const entram: VendaAgregavel[] = [];

  for (const v of vendas) {
    if (v.status !== 'aprovada') { excluidas.naoAprovadas++; continue; }
    if (!v.parceiroId) { excluidas.naoAtribuidas++; continue; }
    if (v.motivoDescarte) { excluidas.descartadas++; continue; }
    // ⚠️ Por último de propósito: uma venda da casa que também seja payer de teste conta
    // como descartada, mas a ordem não muda o resultado — nenhuma das duas soma.
    if (v.daCasa) { excluidas.daCasa++; continue; }
    entram.push(v);
  }

  return {
    receita: money(entram.reduce((s, v) => s + v.valor, 0)),
    vendas: entram.length,
    excluidas,
  };
}

/**
 * FR-011 como TESTE, não constraint. `@@unique` em `repoUrl` proibiria para sempre um repo
 * servir dois sites legítimos — e `goiania` e `roilabs` são exatamente isso hoje. Devolve
 * os repos compartilhados por mais de uma cadeira.
 */
export function reposDuplicados(cadeiras: Array<{ niche: string; repoUrl: string | null }>): Array<{ repoUrl: string; niches: string[] }> {
  const por = new Map<string, string[]>();
  for (const c of cadeiras) {
    if (!c.repoUrl) continue; // nulo = não apurado; não é duplicata
    const chave = c.repoUrl.trim().toLowerCase().replace(/\.git$/, '').replace(/\/+$/, '');
    por.set(chave, [...(por.get(chave) ?? []), c.niche]);
  }
  return [...por.entries()].filter(([, n]) => n.length > 1).map(([repoUrl, niches]) => ({ repoUrl, niches }));
}
