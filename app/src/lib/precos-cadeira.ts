// Preços da ROI Labs — a tela /admin/precos lê daqui.
//
// Mesmo esqueleto da tabela de preços da Vértice (lib/vertice/catalog.ts), mas a ROI Labs
// não vende hora: vende a cadeira. O que o parceiro paga é sempre o mesmo trio —
// anuidade, domínio próprio e comissão pela faixa do nicho (lib/precificacao.ts, spec 016).
// É referência para a proposta: nada aqui é lido pela cobrança, que continua lendo a taxa
// gravada no cadastro do Parceiro (spec 010).

import { ANUIDADE, TIPOS_CADEIRA, type TipoCadeira } from './entregaveis';
import { calcularComissao, lerNumeroBR, type NichoPreco, type TipoCompra } from './precificacao';

export { ANUIDADE };
export const ANUIDADE_MES = ANUIDADE / 12; // R$ 330 — como aparece no /modelo
/** R$/ano — domínio próprio da cadeira, comprado pela ROI Labs na Hostinger e repassado. */
export const DOMINIO_ANO = 50;
export const ENTRADA_ANO = ANUIDADE + DOMINIO_ANO;

// SaaS: 20% das 12 primeiras mensalidades de cada assinatura, 10% da 13ª em diante.
export const SAAS_ANO_1 = 0.2;
export const SAAS_DEPOIS = 0.1;
export const CONSULTA_MIN = 150;
export const CONSULTA_MAX = 300;

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export type EntradaSimulacao = {
  nicho: NichoPreco;
  /** Percentual: pedidos pagos por mês e valor médio do produto (sem frete). */
  pedidosMes: number;
  ticket: number;
  /** Percentual: fração [0,1] dos pedidos que vem de quem já comprou antes. */
  recompra: number;
  distribuidor: boolean;
  /** SaaS: assinaturas novas por mês e mensalidade do plano. */
  assinaturasMes: number;
  mensalidade: number;
  /** Clínica: consultas comparecidas por mês e valor combinado por consulta. */
  consultasMes: number;
  valorConsulta: number;
  /** Percentual: taxa negociada à mão (fração). Ausente ou null = a da tabela do nicho. */
  taxaManual?: Partial<Record<TipoCompra, number | null>>;
  /** Anuidade negociada à mão (R$/ano). Ausente ou null = ANUIDADE. */
  anuidade?: number | null;
};

/** Anuidade digitada em R$. Vazio = null (vale a tabela); fora de [0, 1.000.000] = NaN. */
export function lerAnuidadeManual(s: string): number | null {
  if (!s.trim()) return null;
  const v = lerNumeroBR(s);
  return v >= 0 && v <= 1_000_000 ? Math.round(v * 100) / 100 : NaN;
}

/** O tipo de cadeira do nicho: o do nicho, se ele disser; senão, o que o modelo de cobrança pede. */
export function tipoPadrao(nicho: NichoPreco): TipoCadeira {
  const id = nicho.cadeira ?? { percentual: 'loja', mensalidade: 'software', consulta: 'servico' }[nicho.modelo];
  return TIPOS_CADEIRA.find((t) => t.id === id) ?? TIPOS_CADEIRA[0];
}

/**
 * Comissão manual digitada em %, arredondada a 0,1 ponto (o que a tela mostra é o que vale).
 * Vazio = null (vale a tabela); fora de (0, 100] = NaN.
 */
export function lerTaxaManual(s: string): number | null {
  if (!s.trim()) return null;
  const taxa = Math.round(lerNumeroBR(s) * 10) / 1000;
  return taxa > 0 && taxa <= 1 ? taxa : NaN;
}

export type Simulacao = {
  /** Anuidade (a da tabela ou a negociada) + domínio. */
  entrada: number;
  /** Comissão de um mês no ritmo informado (SaaS: o 12º mês, com a carteira do ano toda pagando). */
  comissaoMes: number;
  /** Comissão somada nos 12 primeiros meses no ritmo informado. */
  comissaoAno: number;
  /** Venda do parceiro originada pela cadeira em 12 meses. */
  vendasAno: number;
  totalAno: number; // entrada + comissão
  /** O que a ROI Labs leva, em % da venda originada no ano. */
  pctDaVenda: number | null;
  avisos: string[];
};

const positivo = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);

export function simular(e: EntradaSimulacao): Simulacao {
  const avisos: string[] = [];
  let comissaoMes = 0;
  let comissaoAno = 0;
  let vendasAno = 0;

  if (e.nicho.modelo === 'percentual') {
    const pedidos = positivo(e.pedidosMes);
    const ticket = positivo(e.ticket);
    const recompra = Math.min(1, positivo(e.recompra));
    const aq = calcularComissao(e.nicho, 'aquisicao', ticket, e.distribuidor, e.taxaManual?.aquisicao);
    const rec = calcularComissao(e.nicho, 'recorrencia', ticket, e.distribuidor, e.taxaManual?.recorrencia);
    comissaoMes = pedidos * ((1 - recompra) * aq.comissao + recompra * rec.comissao);
    comissaoAno = comissaoMes * 12;
    vendasAno = pedidos * ticket * 12;
    if (aq.pisoAplicado) avisos.push('Ticket baixo: o percentual dá menos que o piso de R$ 5 por pedido, e vale o piso.');
  } else if (e.nicho.modelo === 'mensalidade') {
    const novas = positivo(e.assinaturasMes);
    const mensalidade = positivo(e.mensalidade);
    // No 1º ano toda assinatura está nas 12 primeiras mensalidades: quem entrou no mês k paga
    // 13 − k mensalidades até o fim do ano (12 + 11 + … + 1 = 78 por assinatura nova/mês).
    comissaoMes = novas * 12 * mensalidade * SAAS_ANO_1;
    comissaoAno = novas * 78 * mensalidade * SAAS_ANO_1;
    vendasAno = novas * 78 * mensalidade;
    avisos.push('Implantação cobrada pelo parceiro também paga 20%. A partir da 13ª mensalidade de cada assinatura, a taxa cai para 10%.');
  } else {
    const consultas = positivo(e.consultasMes);
    const valor = positivo(e.valorConsulta);
    comissaoMes = consultas * valor;
    comissaoAno = comissaoMes * 12;
    if (valor > 0 && (valor < CONSULTA_MIN || valor > CONSULTA_MAX)) {
      avisos.push(`Fora da faixa da tabela: ${brl(CONSULTA_MIN)} a ${brl(CONSULTA_MAX)} por consulta comparecida.`);
    }
    avisos.push('Checar as regras do CFO/CFM antes de fechar qualquer valor por paciente.');
  }

  comissaoMes = Math.round(comissaoMes * 100) / 100;
  comissaoAno = Math.round(comissaoAno * 100) / 100;
  const entrada = (e.anuidade ?? ANUIDADE) + DOMINIO_ANO;
  const totalAno = entrada + comissaoAno;
  return {
    entrada,
    comissaoMes,
    comissaoAno,
    vendasAno,
    totalAno,
    pctDaVenda: vendasAno > 0 ? totalAno / vendasAno : null,
    avisos,
  };
}

/** Linhas fixas que toda cadeira paga, na ordem em que entram na proposta. A anuidade pode ser a negociada. */
export const itensFixos = (anuidade = ANUIDADE): { item: string; valor: string; quando: string; nota: string }[] => [
  { item: 'Setup', valor: 'R$ 0', quando: '—', nota: 'Loja, site, tecnologia e tráfego são bancados pela ROI Labs' },
  {
    item: 'Anuidade da cadeira',
    valor: `${brl(anuidade)}/ano`,
    quando: 'Na assinatura e a cada renovação',
    nota: `${brl(anuidade / 12)}/mês. Pix à vista, ou cartão em até 12x com acréscimo`,
  },
  {
    item: 'Domínio próprio (Hostinger)',
    valor: `${brl(DOMINIO_ANO)}/ano`,
    quando: 'Junto com a anuidade',
    nota: 'Valor inicial, para .com.br. Toda cadeira vai ao ar com o domínio próprio do cliente',
  },
  {
    item: 'Comissão',
    valor: 'Pela faixa do nicho',
    quando: 'Todo dia 05, sobre o mês anterior',
    nota: 'Só sobre venda paga e originada pela cadeira. Vendeu zero, comissão zero',
  },
];
export const ITENS_FIXOS = itensFixos();

export const REGRAS_DOMINIO = [
  'A ROI Labs compra o domínio na Hostinger antes de o site ir ao ar e repassa o valor ao cliente junto com a anuidade',
  `${brl(DOMINIO_ANO)}/ano é o valor inicial, para .com.br. Outra extensão (.com, .net) ou domínio já ocupado: orçar antes com o preço da Hostinger do dia`,
  'Renova todo ano junto com a anuidade. Domínio vencido derruba o site: a renovação automática fica ligada na Hostinger',
];

/** Só vale para nicho de % por pedido: a proposta de SaaS ou clínica não leva esta linha. */
export const REGRA_COMISSAO_PEDIDO = 'Comissão sobre o produto com desconto, nunca sobre o frete. Piso de R$ 5 por pedido';

/** Condições do contrato. Todas vão para a proposta do cliente (spec 019). */
export const REGRAS_CONTRATO = [
  'Contrato anual, renovável por desempenho dos dois lados',
  'Uma cadeira por nicho no Brasil inteiro enquanto o contrato vigorar',
  REGRA_COMISSAO_PEDIDO,
  'Devolução, cancelamento ou chargeback devolvem a comissão',
  'Relatório venda por venda antes de cada cobrança do dia 05',
  'A recompra dos clientes que a ROI Labs trouxe segue comissionada por 12 meses depois do fim do contrato',
];

/** Regra de negociação do operador: aparece em /admin/precos, nunca na proposta do cliente. */
export const REGRAS_NEGOCIACAO = [
  'Desconto na comissão só até a faixa logo abaixo, e só em troca de algo (ex.: contrato de 24 meses).',
];

// ── 019: proposta guardada ──────────────────────────────────────────────────────────────
// O documento é a única coisa que a página pública /p/<slug> lê. Congelado no save: mudar
// preço ou nicho amanhã não reescreve proposta já enviada. Nada interno entra aqui — nem
// `nicho.regra`, nem a faixa, nem os `avisos` de simular() (o do CFO/CFM é para o operador),
// nem REGRAS_NEGOCIACAO. A regra de comissão é reescrita para o cliente, com as taxas já
// ajustadas (distribuidor) e o valor por consulta que foi digitado.

export const PROPOSTA_VALIDADE_DIAS = 15;

export type PropostaCadeiraDoc = {
  versao: 1;
  paraQuem: string;
  criadaEm: string; // ISO
  validaAte: string; // ISO
  nicho: { id: string; nome: string; modelo: NichoPreco['modelo'] };
  comissao: { resumo: string; regras: string[]; quando: string };
  /** O ritmo informado na simulação, já formatado: é a premissa da estimativa. */
  ritmo: { rotulo: string; valor: string }[];
  entrada: { item: string; valor: string; nota: string }[];
  entradaTotal: number;
  /** null quando o ritmo não gera comissão: a proposta não promete "R$ 0,00". */
  estimativa: {
    comissaoMes: number;
    mesReferencia: string | null;
    comissaoAno: number;
    totalAno: number;
    vendasAno: number | null;
    pctDaVenda: number | null;
  } | null;
  condicoes: string[];
  /** Escopo da cadeira. Ausente nas propostas guardadas antes de 29/09/2026. */
  entregaveis?: {
    cadeira: string;
    fases: { nome: string; prazo: string; itens: string[] }[];
    precisamos: string[];
    naoInclui: string[];
  };
};

const pctTexto = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const numTexto = (v: number) => positivo(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export function comissaoParaCliente(e: EntradaSimulacao): PropostaCadeiraDoc['comissao'] {
  const quando = 'Todo dia 05, sobre o mês anterior. Só sobre venda paga e originada pela cadeira: vendeu zero, comissão zero.';
  const n = e.nicho;
  if (n.modelo === 'percentual') {
    const aq = calcularComissao(n, 'aquisicao', 0, e.distribuidor, e.taxaManual?.aquisicao);
    const rec = calcularComissao(n, 'recorrencia', 0, e.distribuidor, e.taxaManual?.recorrencia);
    return {
      resumo: `${pctTexto(aq.taxaAplicada)} na 1ª compra · ${pctTexto(rec.taxaAplicada)} na recompra`,
      regras: [],
      quando,
    };
  }
  if (n.modelo === 'mensalidade') {
    return {
      resumo: `${n.aquisicaoTexto} · ${n.recorrenciaTexto}`,
      regras: [`A taxa de implantação que você cobrar do seu cliente também paga ${pctTexto(SAAS_ANO_1)}.`],
      quando,
    };
  }
  const valor = positivo(e.valorConsulta);
  return {
    resumo: valor > 0 ? `${brl(valor)} por consulta comparecida` : n.aquisicaoTexto,
    regras: [`${n.recorrenciaTexto}.`],
    quando,
  };
}

function ritmoInformado(e: EntradaSimulacao): PropostaCadeiraDoc['ritmo'] {
  if (e.nicho.modelo === 'percentual') {
    return [
      { rotulo: 'Pedidos pagos por mês', valor: numTexto(e.pedidosMes) },
      { rotulo: 'Valor médio do produto', valor: brl(positivo(e.ticket)) },
      { rotulo: 'Pedidos de recompra', valor: pctTexto(Math.min(1, positivo(e.recompra))) },
    ];
  }
  if (e.nicho.modelo === 'mensalidade') {
    return [
      { rotulo: 'Assinaturas novas por mês', valor: numTexto(e.assinaturasMes) },
      { rotulo: 'Mensalidade do plano', valor: brl(positivo(e.mensalidade)) },
    ];
  }
  return [
    { rotulo: 'Consultas comparecidas por mês', valor: numTexto(e.consultasMes) },
    { rotulo: 'Valor por consulta', valor: brl(positivo(e.valorConsulta)) },
  ];
}

// As `rules` de cada fase ficam de fora: são orientação ao operador (a de serviço traz o CFO/CFM).
function entregaveisParaCliente(tipo: TipoCadeira): NonNullable<PropostaCadeiraDoc['entregaveis']> {
  return {
    cadeira: tipo.name,
    fases: tipo.fases.map((f) => ({ nome: f.name, prazo: f.prazo, itens: f.deliverables.flatMap((g) => g.items) })),
    precisamos: tipo.fases.flatMap((f) => f.prereq ?? []),
    naoInclui: tipo.fases.flatMap((f) => f.excludes ?? []),
  };
}

export function montarPropostaCadeira(
  e: EntradaSimulacao,
  paraQuem: string,
  agora: Date,
  tipo: TipoCadeira = tipoPadrao(e.nicho),
): PropostaCadeiraDoc {
  const r = simular(e);
  return {
    versao: 1,
    paraQuem: paraQuem.trim(),
    criadaEm: agora.toISOString(),
    validaAte: new Date(agora.getTime() + PROPOSTA_VALIDADE_DIAS * 86_400_000).toISOString(),
    nicho: { id: e.nicho.id, nome: e.nicho.nicho, modelo: e.nicho.modelo },
    comissao: comissaoParaCliente(e),
    ritmo: ritmoInformado(e),
    entrada: itensFixos(e.anuidade ?? ANUIDADE)
      .filter((i) => i.item !== 'Comissão')
      .map(({ item, valor, nota }) => ({ item, valor, nota })),
    entradaTotal: r.entrada,
    estimativa:
      r.comissaoAno > 0
        ? {
            comissaoMes: r.comissaoMes,
            mesReferencia: e.nicho.modelo === 'mensalidade' ? 'no 12º mês' : null,
            comissaoAno: r.comissaoAno,
            totalAno: r.totalAno,
            vendasAno: r.vendasAno > 0 ? r.vendasAno : null,
            pctDaVenda: r.pctDaVenda,
          }
        : null,
    condicoes: [
      ...REGRAS_CONTRATO.filter((c) => e.nicho.modelo === 'percentual' || c !== REGRA_COMISSAO_PEDIDO),
      ...REGRAS_DOMINIO,
    ],
    entregaveis: entregaveisParaCliente(tipo),
  };
}
