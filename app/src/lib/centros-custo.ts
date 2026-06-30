// Dois centros de custo da operação ROI Labs sobre a MESMA venda (preço de varejo
// minerado em precos.ts). Espelha a mecânica fechada nos docs do vault:
//   - Intermediação  → Docs/Obsidian/60-legal-fin/anexo-A-intermediacao.md
//   - White Label    → Docs/Obsidian/60-legal-fin/anexo-B-white-label.md
//   - números/alíquotas → Docs/Obsidian/60-legal-fin/projecao-financeira.md (cenário Base)
//
// Feature 004: parâmetros agora persistidos em DB com camadas SKU > linha > global.
// PARAMS é o fallback quando o DB não tem global (FR-004). Fórmulas calcIntermediacao/calcWL
// são intactas (FR-016); apenas a origem dos parâmetros mudou.

export interface Parametros {
  markup: number; // atacado = varejo / (1 + markup). Âncora R$9.100/R$7.000 = 0,30 (modelo.md)
  comissao: number; // % sobre o varejo (Anexo A.2.2.a) — só na intermediação
  aliqIntermediacao: number; // imposto sobre a RECEITA DE SERVIÇO (Simples Anexo III, Base ~10,2%)
  aliqWL: number; // imposto sobre o GMV CHEIO (Simples Anexo I após ICMS-ST, Base ~6,2%)
}

// Defaults dos docs — fallback quando o DB não tem global (FR-004).
export const PARAMS: Parametros = {
  markup: 0.3,
  comissao: 0.1,
  aliqIntermediacao: 0.102,
  aliqWL: 0.062,
};

// Presets tributários (D4 / projecao-financeira.md). Aplicar um preset preenche as alíquotas;
// ajuste manual posterior usa cenario='ajustado' e prevalece (FR-013).
export const CENARIOS: Record<string, Pick<Parametros, 'aliqIntermediacao' | 'aliqWL'>> = {
  conservador: { aliqIntermediacao: 0.06, aliqWL: 0.046 },
  base: { aliqIntermediacao: 0.102, aliqWL: 0.062 },
  otimista: { aliqIntermediacao: 0.127, aliqWL: 0.078 },
};

// Camadas carregadas do DB para resolver parâmetros de um SKU (D5).
// Todas as propriedades de parâmetro são Decimal do Prisma (convertidas para number externamente).
export interface CamadasConfig {
  sku?: Partial<Parametros> & { piso?: number | null; modalidadeAlvo?: string | null } | null;
  linha?: Partial<Parametros> | null;
  global?: Partial<Parametros> | null;
}

function resolveField<K extends keyof Parametros>(camadas: CamadasConfig, key: K): number {
  const fromSku = camadas.sku?.[key];
  if (fromSku != null) return Number(fromSku);
  const fromLinha = camadas.linha?.[key];
  if (fromLinha != null) return Number(fromLinha);
  const fromGlobal = camadas.global?.[key];
  if (fromGlobal != null) return Number(fromGlobal);
  return PARAMS[key];
}

// Resolve parâmetros efetivos de um SKU com precedência SKU > linha > global > PARAMS campo a campo.
export function resolverParametros(camadas: CamadasConfig): Parametros {
  return {
    markup: resolveField(camadas, 'markup'),
    comissao: resolveField(camadas, 'comissao'),
    aliqIntermediacao: resolveField(camadas, 'aliqIntermediacao'),
    aliqWL: resolveField(camadas, 'aliqWL'),
  };
}

// Resolve o piso (atacado) real vs estimado para um SKU.
export function resolverPiso(
  varejo: number,
  camadas: CamadasConfig,
): { piso: number; real: boolean } {
  const skuPiso = camadas.sku?.piso;
  if (skuPiso != null) return { piso: Number(skuPiso), real: true };
  return { piso: atacadoDe(varejo, resolveField(camadas, 'markup')), real: false };
}

// Resolve a modalidade-alvo de um SKU. Ausente = Intermediação (padrão dos docs, FR-014).
export function resolverModalidade(camadas: CamadasConfig): 'intermediacao' | 'wl' {
  return camadas.sku?.modalidadeAlvo === 'wl' ? 'wl' : 'intermediacao';
}

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
