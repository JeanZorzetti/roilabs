// 017 — Projeção do ritmo de venda pela demanda de busca. Conta pura, sem I/O: volume dos termos
// (DataForSEO) × CTR da posição alcançável pela dificuldade × rampa de 12 meses × funil do nicho.
// Cada número abaixo tem a mesma fonte e data de specs/017-projecao-ritmo-venda/research.md
// (D6–D11). Se mudar um número aqui, mude lá também.

import { NICHOS, type Confianca, type NichoPreco } from './precificacao';

export const CENARIOS = ['conservador', 'base', 'otimista'] as const;
export type Cenario = (typeof CENARIOS)[number];
export const CENARIO_PADRAO: Cenario = 'conservador'; // FR-005b: o simulador já pede "um número conservador"

export const ROTULO_CENARIO: Record<Cenario, string> = {
  conservador: 'Conservador',
  base: 'Base',
  otimista: 'Otimista',
};

export const UNIDADES = {
  percentual: { plural: 'pedidos pagos', singular: 'pedido pago' },
  mensalidade: { plural: 'assinaturas novas', singular: 'assinatura nova' },
  consulta: { plural: 'consultas comparecidas', singular: 'consulta comparecida' },
} as const satisfies Record<NichoPreco['modelo'], { plural: string; singular: string }>;
export type Unidade = (typeof UNIDADES)[keyof typeof UNIDADES];

export interface Degrau {
  de: string;
  para: string;
  taxa: Record<Cenario, number>; // fração: 0.01 = 1%
  fonte: string;
  data: string; // publicação da fonte
  confianca: Confianca;
  premissa?: string; // presente quando a taxa, ou o multiplicador do cenário, não vem de estudo
}

export interface FunilNicho {
  nichoId: string;
  unidade: Unidade;
  degraus: Degrau[];
}

/** A resposta de /api/projecao/consultar, um por termo enviado. */
export interface TermoConsultado {
  termo: string;
  volume: number | null; // null = sem volume medido, diferente de 0
  mensal: number[] | null; // 12 meses, do mais antigo para o mais novo
  dificuldade: number | null; // 0–100; null = não medida
}

// ── Captura: CTR por posição (research D6) ─────────────────────────────────────────────

export const FONTE_CTR =
  'First Page Sage, Google CTRs by Ranking Position (01/03 a 31/08/2026, 1.184 domínios, 3,67 bi de impressões, desktop e mobile nos EUA)';
export const DATA_CTR = '2026-09';

// Posições 1 a 10, em fração.
export const CTR_SEM_IA = [0.226, 0.102, 0.058, 0.037, 0.025, 0.018, 0.013, 0.009, 0.007, 0.005];
export const CTR_COM_IA = [0.036, 0.014, 0.008, 0.005, 0.003, 0.003, 0.002, 0.002, 0.001, 0.001];

/** Fatia das buscas com resposta de IA no topo, por cenário. */
export const FATIA_IA: Record<Cenario, { s: number; fonte: string }> = {
  conservador: {
    s: 0.816,
    fonte: 'First Page Sage, set/2026: todas as buscas dos EUA (supõe que a IA chegue aos termos de compra como já chegou à média)',
  },
  base: {
    s: 0.14,
    fonte: 'Visibility Labs, início de 2026: 20,9 mi de buscas de compra (BrightEdge, nov/2025: 13% das transacionais)',
  },
  otimista: {
    s: 0.14,
    fonte: 'A mesma do base. O otimista se diferencia pela posição e pela conversão',
  },
};

// ── Posição alcançável pela dificuldade (research D7, premissa) ────────────────────────

export const PREMISSA_POSICAO =
  'A tabela não sai de estudo. A loja nova não tem backlink, e a dificuldade mede o backlink do top 10: só 1,74% das páginas novas chega ao top 10 em um ano (Ahrefs, 2025).';

// [dificuldade máxima, posição]. Acima da última faixa = fora do alcance no ano 1.
export const POSICAO_POR_DIFICULDADE: Record<Cenario, [number, number][]> = {
  conservador: [[10, 8], [20, 10]],
  base: [[10, 5], [20, 7], [30, 10]],
  otimista: [[10, 3], [20, 5], [30, 7], [40, 10]],
};

// Termo sem dificuldade medida costuma ser cauda longa pouco disputada: meio da faixa alcançável
// no conservador.
export const KD_SEM_DADO = 15;

/** Maior dificuldade que o cenário ainda alcança (20, 30 ou 40). */
export const limiteDificuldade = (c: Cenario) => POSICAO_POR_DIFICULDADE[c].at(-1)![0];

// ── Rampa (research D8, premissa) ──────────────────────────────────────────────────────

/** Mês em que a posição se estabiliza. Antes dele, a captura sobe em reta a partir de zero no mês 1. */
export const MES_ESTAVEL: Record<Cenario, number> = { conservador: 9, base: 6, otimista: 4 };
export const PREMISSA_RAMPA =
  'O mês 1 é zero (a loja entra no ar e é indexada) e a captura sobe em reta até o mês em que a posição se estabiliza. O simulador já fala em 3 a 6 meses; o conservador estica até o 9º para cobrir uma loja sem autoridade nenhuma.';

export const LIMITE = { termos: 200, caracteres: 80, palavras: 10 };

// ── Funis por nicho (research D10 e D11) ───────────────────────────────────────────────

const FONTE_PRAX = 'Prax, Benchmarks E-commerce Brasil 2025 (mais de 1.000 lojas, mediana de todos os canais)';
const DATA_PRAX = '2026-09-14';
export const PREMISSA_MULTIPLICADOR =
  'Conservador = base × 0,7: a amostra são lojas estabelecidas (≥ R$ 50 mil/mês, com avaliação e marca), e a loja da cadeira começa sem nada disso. Otimista = base × 1,3: o termo de compra orgânico converte acima da média de todos os canais.';

const cenarios = (base: number): Record<Cenario, number> => ({
  conservador: base * 0.7,
  base,
  otimista: base * 1.3,
});

// [setor da Prax usado, taxa base, confiança, proxy?]
const PRAX: Record<string, [string, number, Confianca, boolean?]> = {
  beleza: ['Cosméticos', 0.021, 'media-alta'],
  joias: ['Jóias/Semijóias', 0.011, 'media-alta'],
  moda: ['Moda Feminina (Masculina 0,9%, Infantil 0,9%)', 0.01, 'alta'],
  esporte: ['Esporte e Lazer (Moda Fitness 1,5%)', 0.012, 'media-alta'],
  pet: ['Pet Shop', 0.012, 'alta'],
  suplementos: ['Esporte e Lazer', 0.012, 'baixa', true],
  casa: ['Casa, Jardim e Decoração', 0.004, 'alta'],
  construcao: ['Casa, Jardim e Decoração', 0.004, 'media-baixa', true],
  ferramentas: ['Máquinas/Industriais', 0.007, 'media'],
  saude: ['Saúde', 0.005, 'media-alta'],
  brinquedos: ['Brinquedo/Diversão', 0.01, 'alta'],
  papelaria: ['Papelaria', 0.013, 'alta'],
  jardinagem: ['Casa, Jardim e Decoração', 0.004, 'media'],
  autopecas: ['Máquinas/Industriais', 0.007, 'baixa', true],
  alimentos: ['Alimentos e Bebidas', 0.033, 'alta'],
  eletronicos: ['Eletrônico e Informática', 0.005, 'alta'],
  agro: ['Máquinas/Industriais', 0.007, 'baixa', true],
  b2b: ['Papelaria (suprimento padronizado de recompra)', 0.013, 'baixa', true],
};

function degrauPrax(id: string): Degrau | undefined {
  const linha = PRAX[id];
  if (!linha) return undefined;
  const [setor, base, confianca, proxy] = linha;
  return {
    de: 'visita',
    para: 'pedido pago',
    taxa: cenarios(base),
    fonte: `${FONTE_PRAX} · ${proxy ? 'setor mais próximo: ' : ''}${setor}`,
    data: DATA_PRAX,
    confianca,
    premissa: proxy
      ? `A Prax não tem linha própria para este nicho: usa o setor mais próximo. ${PREMISSA_MULTIPLICADOR}`
      : PREMISSA_MULTIPLICADOR,
  };
}

const SAAS: Degrau[] = [
  {
    de: 'visita',
    para: 'lead (trial ou demonstração)',
    taxa: cenarios(0.0183),
    fonte: 'Leadster, Panorama de Geração de Leads no Brasil 2026 · Software (2.425 sites, dados de 2025)',
    data: '2026-07-06',
    confianca: 'media-alta',
    premissa: 'Conservador = base × 0,7 e otimista = base × 1,3, como no e-commerce.',
  },
  {
    de: 'lead',
    para: 'assinatura',
    taxa: cenarios(0.182),
    fonte: 'First Page Sage, SaaS Free Trial Conversion Benchmarks · trial opt-in de tráfego orgânico (86 SaaS, 2022–T3/2025)',
    data: '2025-09-05',
    confianca: 'media',
    premissa: 'Conservador = base × 0,7 e otimista = base × 1,3, como no e-commerce.',
  },
];

const CLINICA: Degrau[] = [
  {
    de: 'visita',
    para: 'contato (formulário ou WhatsApp)',
    taxa: { conservador: 0.0285, base: 0.0407, otimista: 0.0529 },
    fonte: 'Leadster, Panorama 2025 · Saúde',
    data: '2025',
    confianca: 'media',
    premissa: 'Conservador e otimista = base × 0,7 e × 1,3.',
  },
  {
    de: 'contato',
    para: 'agendamento',
    taxa: { conservador: 0.18, base: 0.25, otimista: 0.35 },
    fonte: 'Faixa de 18% a 35% sem automação relatada por fornecedores de software para clínica (Clint, Odonto Results)',
    data: '2026',
    confianca: 'baixa',
    premissa: 'Relato de fornecedor, não estudo.',
  },
  {
    de: 'agendamento',
    para: 'consulta comparecida',
    taxa: { conservador: 0.722, base: 0.75, otimista: 0.85 },
    fonte: 'Dantas et al., No-shows in appointment scheduling, Health Policy (falta de 27,8% na América do Sul) · falta de ~25% em consultório particular (Fácil Consulta, ByDoctor)',
    data: '2018',
    confianca: 'media',
    premissa: 'O otimista supõe falta de 15% (a maioria das instituições privadas relata de 5% a 20%).',
  },
];

// Cursos (29/09/2026): a Prax não tem linha de educação, e a venda do curso fecha no WhatsApp, como a da
// clínica. Só o 1º degrau tem fonte; o 2º é premissa declarada.
const CURSOS: Degrau[] = [
  {
    de: 'visita',
    para: 'contato (formulário ou WhatsApp)',
    taxa: cenarios(0.0267),
    fonte: 'Leadster, Panorama de Geração de Leads no Brasil 2025 · Educacional (156 sites)',
    data: '2025',
    confianca: 'media',
    premissa:
      'O segmento junta escolas, idiomas, cursos profissionalizantes, graduação e pós, sem recorte de curso livre. Conservador e otimista = base × 0,7 e × 1,3.',
  },
  {
    de: 'contato',
    para: 'matrícula paga',
    taxa: { conservador: 0.18, base: 0.25, otimista: 0.35 },
    fonte: 'Sem estudo de matrícula: usa a faixa de contato → agendamento da clínica (18% a 35%, relato de fornecedores de software para clínica)',
    data: '2026',
    confianca: 'baixa',
    premissa: 'Matrícula paga pede mais do que um agendamento: o número real tende a ficar abaixo. Troque pela taxa do parceiro assim que ele tiver a dele.',
  },
];

// Advocacia (02/10/2026): a Prax não tem linha de serviço, e o contrato de honorários fecha na conversa com o
// advogado. Só o 1º degrau tem fonte; o 2º é premissa declarada, como em cursos.
const ADVOCACIA: Degrau[] = [
  {
    de: 'visita',
    para: 'contato (formulário ou WhatsApp)',
    taxa: cenarios(0.0445),
    fonte: 'Leadster, Panorama de Geração de Leads no Brasil 2025 · Jurídico',
    data: '2025',
    confianca: 'media',
    premissa: 'Conservador e otimista = base × 0,7 e × 1,3.',
  },
  {
    de: 'contato',
    para: 'contrato de honorários',
    taxa: { conservador: 0.18, base: 0.25, otimista: 0.35 },
    fonte: 'Sem estudo de fechamento em advocacia: usa a faixa de contato → agendamento da clínica (18% a 35%, relato de fornecedores de software para clínica)',
    data: '2026',
    confianca: 'baixa',
    premissa: 'Fechar contrato pede mais do que marcar consulta: o número real tende a ficar abaixo. Troque pela taxa do escritório assim que ele tiver a dele.',
  },
];

const DEGRAUS_ESPECIAIS: Record<string, Degrau[]> = { saas: SAAS, clinicas: CLINICA, cursos: CURSOS, advocacia: ADVOCACIA };

export const FUNIS: Record<string, FunilNicho> = Object.fromEntries(
  NICHOS.map((n) => [
    n.id,
    {
      nichoId: n.id,
      unidade: UNIDADES[n.modelo],
      degraus: DEGRAUS_ESPECIAIS[n.id] ?? [degrauPrax(n.id)].filter((d): d is Degrau => !!d),
    },
  ]),
);

// ── Entrada: limpar e validar antes de pagar a consulta (research D1, D4) ──────────────

/** Sem acento, minúsculo, espaço colapsado. Também é a chave que junta as duas respostas da API. */
export const normalizar = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Apara, tira linhas vazias e remove repetidas (sem diferenciar caixa, acento e espaço), mantendo a 1ª. */
export function limparTermos(linhas: string[]): { termos: string[]; removidos: number } {
  const vistos = new Set<string>();
  const termos: string[] = [];
  let removidos = 0;
  for (const linha of linhas) {
    const t = linha.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const chave = normalizar(t);
    if (vistos.has(chave)) {
      removidos++;
      continue;
    }
    vistos.add(chave);
    termos.push(t);
  }
  return { termos, removidos };
}

export interface ErroEntrada {
  termo: string; // vazio quando o problema é a lista, não um termo
  regra: 'vazia' | 'limite' | 'caracteres' | 'palavras' | 'caractere';
  mensagem: string;
}

// Letra (com acento), número, espaço, hífen e apóstrofo. Emoji e símbolo o Google Ads recusa.
const CARACTERE = /^[\p{L}\p{M}\p{N} '’-]$/u;

export function validarTermos(termos: string[]): ErroEntrada | null {
  if (termos.length === 0) {
    return { termo: '', regra: 'vazia', mensagem: 'Cole pelo menos um termo, um por linha.' };
  }
  if (termos.length > LIMITE.termos) {
    return {
      termo: '',
      regra: 'limite',
      mensagem: `A lista tem ${termos.length} termos, e o limite é ${LIMITE.termos} por consulta. Corte os de menor intenção de compra.`,
    };
  }
  for (const termo of termos) {
    if (termo.length > LIMITE.caracteres) {
      return {
        termo,
        regra: 'caracteres',
        mensagem: `«${termo}» tem ${termo.length} caracteres. O limite do Google Ads é ${LIMITE.caracteres}.`,
      };
    }
    const palavras = termo.split(' ').length;
    if (palavras > LIMITE.palavras) {
      return {
        termo,
        regra: 'palavras',
        mensagem: `«${termo}» tem ${palavras} palavras. O limite do Google Ads é ${LIMITE.palavras}.`,
      };
    }
    const simbolo = [...termo].find((ch) => !CARACTERE.test(ch));
    if (simbolo) {
      return {
        termo,
        regra: 'caractere',
        mensagem: `«${termo}» tem "${simbolo}", que o Google Ads recusa. Use só letras, números, espaço, hífen e apóstrofo.`,
      };
    }
  }
  return null;
}

// ── A conta (research D5–D9) ───────────────────────────────────────────────────────────

export interface TermoProjetado extends TermoConsultado {
  posicao: number | null; // 1–10; null = fora do alcance no ano 1
  ctr: number;
  cliquesEstaveis: number;
  grupo: string | null; // texto do 1º termo do grupo, quando este é uma variante agrupada
}

export interface Demanda {
  total: number; // buscas/mês, uma vez por grupo de variantes
  alcancavel: number;
  foraDoAlcance: number;
  semVolume: number; // contagens de termos
  semDificuldade: number;
  agrupados: number;
}

/** Um elo da cadeia buscas → cliques → degraus do funil, no mês estável (US3). */
export interface Elo {
  rotulo: string;
  n: number;
  taxa?: number; // do elo anterior para este; o 1º elo não tem
  fonte: string;
  origem: 'mercado' | 'parceiro' | 'premissa';
  degrau?: number; // índice no funil do nicho, para trocar pela taxa do parceiro
  premissa?: string;
  confianca?: Confianca;
}

export interface ResultadoCenario {
  termos: TermoProjetado[];
  demanda: Demanda;
  cliquesEstaveis: number;
  vendasEstaveis: number;
  porMes: number[]; // 12 meses
  mediaAno1: number; // o número que vai ao simulador (FR-010)
  cadeia: Elo[];
}

/** Taxa real do parceiro por índice de degrau (fração). Vale para os 3 cenários (FR-009). */
export type TaxasDoParceiro = Record<number, number | undefined>;

const taxaValida = (t: number | undefined): t is number => typeof t === 'number' && Number.isFinite(t) && t >= 0 && t <= 1;

/**
 * Para cada termo, o texto do 1º termo do mesmo grupo (ou null). Grupo = mesmo volume > 0 e a mesma
 * série de 12 meses: o Google Ads devolve o volume combinado das variantes próximas (research D5).
 * ponytail: dois termos sem relação com séries iguais por acaso viram um grupo. Só é provável em
 * volume mínimo, e a perda é no máximo o volume do menor. Upgrade: agrupar também pelo texto.
 */
export function agruparVariantes(termos: TermoConsultado[]): (string | null)[] {
  const primeiro = new Map<string, string>();
  return termos.map((t) => {
    if (!t.volume || !t.mensal?.length) return null;
    const chave = `${t.volume}|${t.mensal.join(',')}`;
    const rep = primeiro.get(chave);
    if (rep !== undefined) return rep;
    primeiro.set(chave, t.termo);
    return null;
  });
}

// ponytail: a dificuldade é nacional (a base do Labs não corta por cidade), mesmo quando o volume
// é de uma cidade. Upgrade: só se a DataForSEO passar a medir dificuldade local.
export function posicaoPara(dificuldade: number | null, c: Cenario): number | null {
  const kd = dificuldade ?? KD_SEM_DADO;
  return POSICAO_POR_DIFICULDADE[c].find(([max]) => kd <= max)?.[1] ?? null;
}

// ponytail: posição 11+ conta zero. O relatório só mede até a 10ª, e a 2ª página recebe menos de 1%.
export function ctrPara(posicao: number | null, c: Cenario): number {
  if (posicao === null || posicao < 1 || posicao > 10) return 0;
  const { s } = FATIA_IA[c];
  return s * CTR_COM_IA[posicao - 1] + (1 - s) * CTR_SEM_IA[posicao - 1];
}

/** Fração da captura estável no mês m (1–12): zero no mês 1, reta até o mês estável. */
export const captura = (m: number, c: Cenario) => Math.min(1, (m - 1) / (MES_ESTAVEL[c] - 1));

function projetarCenario(
  termos: TermoConsultado[],
  grupos: (string | null)[],
  funil: FunilNicho,
  c: Cenario,
  taxasDoParceiro: TaxasDoParceiro,
): ResultadoCenario {
  const demanda: Demanda = { total: 0, alcancavel: 0, foraDoAlcance: 0, semVolume: 0, semDificuldade: 0, agrupados: 0 };
  let cliquesEstaveis = 0;
  const projetados = termos.map((t, i): TermoProjetado => {
    const grupo = grupos[i];
    if (grupo !== null) {
      // A variante não soma volume nem tem posição própria: o grupo usa a do 1º termo.
      demanda.agrupados++;
      return { ...t, posicao: null, ctr: 0, cliquesEstaveis: 0, grupo };
    }
    const posicao = posicaoPara(t.dificuldade, c);
    const ctr = ctrPara(posicao, c);
    if (t.volume === null) {
      demanda.semVolume++;
      return { ...t, posicao, ctr, cliquesEstaveis: 0, grupo };
    }
    if (t.dificuldade === null) demanda.semDificuldade++;
    demanda.total += t.volume;
    if (posicao !== null) demanda.alcancavel += t.volume;
    const cliques = t.volume * ctr;
    cliquesEstaveis += cliques;
    return { ...t, posicao, ctr, cliquesEstaveis: cliques, grupo };
  });
  demanda.foraDoAlcance = demanda.total - demanda.alcancavel;

  const cadeia: Elo[] = [
    { rotulo: 'buscas alcançáveis por mês', n: demanda.alcancavel, fonte: 'Google Ads via DataForSEO', origem: 'mercado' },
    {
      rotulo: 'cliques (visitas)',
      n: cliquesEstaveis,
      taxa: demanda.alcancavel > 0 ? cliquesEstaveis / demanda.alcancavel : 0,
      fonte: `CTR ponderado pela posição de cada termo · ${FONTE_CTR}`,
      origem: 'premissa', // a posição sai da tabela de dificuldade (D7), que é premissa
      premissa: PREMISSA_POSICAO,
    },
  ];
  let vendasEstaveis = cliquesEstaveis;
  funil.degraus.forEach((d, i) => {
    const doParceiro = taxasDoParceiro[i];
    const parceiro = taxaValida(doParceiro);
    const taxa = parceiro ? doParceiro : d.taxa[c];
    vendasEstaveis *= taxa;
    cadeia.push({
      rotulo: d.para,
      n: vendasEstaveis,
      taxa,
      fonte: parceiro ? 'taxa do parceiro' : `${d.fonte} (${d.data.split('-').reverse().join('/')})`,
      origem: parceiro ? 'parceiro' : 'mercado',
      degrau: i,
      premissa: parceiro ? undefined : d.premissa,
      confianca: parceiro ? undefined : d.confianca,
    });
  });

  const porMes = Array.from({ length: 12 }, (_, i) => vendasEstaveis * captura(i + 1, c));
  const mediaAno1 = porMes.reduce((s, v) => s + v, 0) / 12;
  return { termos: projetados, demanda, cliquesEstaveis, vendasEstaveis, porMes, mediaAno1, cadeia };
}

/** Os 3 cenários a partir dos termos já consultados. Não chama a API (FR-003). */
export function projetar(
  termos: TermoConsultado[],
  nichoId: string,
  taxasDoParceiro: TaxasDoParceiro = {},
): Record<Cenario, ResultadoCenario> {
  const funil = FUNIS[nichoId];
  if (!funil) throw new Error(`projetar: nicho desconhecido "${nichoId}"`);
  const grupos = agruparVariantes(termos);
  return {
    conservador: projetarCenario(termos, grupos, funil, 'conservador', taxasDoParceiro),
    base: projetarCenario(termos, grupos, funil, 'base', taxasDoParceiro),
    otimista: projetarCenario(termos, grupos, funil, 'otimista', taxasDoParceiro),
  };
}

// ── Histórico (spec 018) ───────────────────────────────────────────────────────────────

/**
 * Uma linha do histórico, recalculada com as premissas de hoje a partir da resposta guardada da fonte.
 * `null` quando o nicho gravado saiu da tabela de Precificação: sem funil, não há conta a fazer.
 */
export function resumirConsulta(termos: TermoConsultado[], nichoId: string) {
  const funil = FUNIS[nichoId];
  if (!funil) return null;
  const r = projetar(termos, nichoId);
  return {
    demanda: r.conservador.demanda.total,
    conservador: r.conservador.mediaAno1,
    otimista: r.otimista.mediaAno1,
    unidade: funil.unidade,
  };
}

// ── Números na tela (contracts/ui.md, Números) ─────────────────────────────────────────

/** 1 decimal abaixo de 10, inteiro a partir de 10. A única regra: a tela e a ponte do simulador usam esta. */
export const arredondarVendas = (n: number) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n));

const VENDAS = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function formatarVendas(n: number): string {
  const r = arredondarVendas(n);
  // Venda rara não pode parecer o zero real de "tudo fora do alcance".
  if (n > 0 && r === 0) return 'menos de 0,1';
  return VENDAS.format(r);
}

// ── Ponte para o simulador (research D13) ──────────────────────────────────────────────

/** Leva o número que a tela mostra ao lado do botão, não a média crua. */
export function urlSimulador(nichoId: string, ritmo: number, cenario: Cenario): string {
  const q = new URLSearchParams({ nicho: nichoId, ritmo: String(arredondarVendas(ritmo)), cenario });
  return `/admin/precos?${q}#simulador`;
}

export interface PonteSimulador {
  nichoId: string;
  ritmo: number;
  cenario: Cenario;
}

/** Qualquer parâmetro inválido anula os três: o simulador abre como sempre abriu (FR-011). */
export function lerPonteSimulador(params: Record<string, string | string[] | undefined>): PonteSimulador | null {
  const { nicho, ritmo, cenario } = params;
  if (typeof nicho !== 'string' || typeof ritmo !== 'string' || typeof cenario !== 'string') return null;
  if (!NICHOS.some((n) => n.id === nicho)) return null;
  if (!(CENARIOS as readonly string[]).includes(cenario)) return null;
  if (!/^\d+(\.\d+)?$/.test(ritmo)) return null;
  const valor = Number(ritmo);
  if (!Number.isFinite(valor) || valor > 100_000) return null;
  return { nichoId: nicho, ritmo: valor, cenario: cenario as Cenario };
}

// ── Erros da DataForSEO (contracts/api.md) ─────────────────────────────────────────────

export type ErroFonte = 'chave' | 'saldo' | 'fonte';

// 503, nunca 502: a EasyPanel troca o 502 do app pela página "Service is not reachable" dela, e a tela
// perderia a causa. O corpo (`erro`) é que separa chave de fonte.
export function erroDataForSEO(statusCode: number): { erro: ErroFonte; http: 503 | 402 } {
  if (statusCode === 40100) return { erro: 'chave', http: 503 };
  if (statusCode === 40200 || statusCode === 40210) return { erro: 'saldo', http: 402 };
  return { erro: 'fonte', http: 503 };
}
