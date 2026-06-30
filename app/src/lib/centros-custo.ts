// Dois centros de custo da operação ROI Labs sobre a MESMA venda (preço de varejo
// minerado em precos.ts). Espelha a mecânica fechada nos docs do vault:
//   - Intermediação  → Docs/Obsidian/60-legal-fin/anexo-A-intermediacao.md
//   - White Label    → Docs/Obsidian/60-legal-fin/anexo-B-white-label.md
//   - números/alíquotas → Docs/Obsidian/60-legal-fin/projecao-financeira.md (cenário Base)
//
// Só temos o varejo (preço do concorrente). O atacado (piso) é derivado por markup
// até o 1º fornecedor fechar (Gate 3) e dar o piso real por SKU.
// ponytail: parâmetros fiscais hard-coded no cenário Base do Simples; viram config/DB
// só quando o contador fechar o regime e o volume real definir a faixa (fator-r / Anexo I).

export interface Parametros {
  markup: number; // atacado = varejo / (1 + markup). Âncora R$9.100/R$7.000 = 0,30 (modelo.md)
  comissao: number; // % sobre o varejo (Anexo A.2.2.a) — só na intermediação
  aliqIntermediacao: number; // imposto sobre a RECEITA DE SERVIÇO (Simples Anexo III, Base ~10,2%)
  aliqWL: number; // imposto sobre o GMV CHEIO (Simples Anexo I após ICMS-ST, Base ~6,2%)
}

export const PARAMS: Parametros = {
  markup: 0.3,
  comissao: 0.1,
  aliqIntermediacao: 0.102,
  aliqWL: 0.062,
};

export interface Resultado {
  centro: 'intermediacao' | 'wl';
  receita: number; // receita bruta da ROI Labs (serviço na interm.; GMV na WL)
  custo: number; // custo de aquisição (só na WL: o atacado)
  imposto: number;
  liquido: number; // o que sobra pra ROI Labs depois de custo e imposto
}

export const atacadoDe = (varejo: number, markup = PARAMS.markup): number =>
  varejo / (1 + markup);

// Intermediação: ROI Labs é plataforma, não compra. Receita = excedente + comissão,
// tributada como serviço. Não há custo de mercadoria (o fornecedor é o vendedor de fato).
export function calcIntermediacao(
  varejo: number,
  atacado: number,
  p: Parametros = PARAMS,
): Resultado & { excedente: number; comissao: number } {
  const excedente = varejo - atacado; // Preço de Varejo − Piso (Anexo A.2.2.b)
  const comissao = p.comissao * varejo; // Anexo A.2.2.a
  const receita = excedente + comissao;
  const imposto = p.aliqIntermediacao * receita;
  return { centro: 'intermediacao', receita, custo: 0, imposto, liquido: receita - imposto, excedente, comissao };
}

// White Label: ROI Labs revende sob marca própria (vendedora de fato). Receita = GMV,
// custo = atacado, margem = spread (sem comissão), imposto sobre o ticket cheio.
export function calcWL(
  varejo: number,
  atacado: number,
  p: Parametros = PARAMS,
): Resultado & { margem: number } {
  const margem = varejo - atacado; // spread
  const imposto = p.aliqWL * varejo;
  return { centro: 'wl', receita: varejo, custo: atacado, imposto, liquido: margem - imposto, margem };
}
