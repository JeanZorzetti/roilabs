// Preços da ROI Labs — a tela /admin/precos lê daqui.
//
// Mesmo esqueleto da tabela de preços da Vértice (lib/vertice/catalog.ts), mas a ROI Labs
// não vende hora: vende a cadeira. O que o parceiro paga é sempre o mesmo trio —
// anuidade, domínio próprio e comissão pela faixa do nicho (lib/precificacao.ts, spec 016).
// É referência para a proposta: nada aqui é lido pela cobrança, que continua lendo a taxa
// gravada no cadastro do Parceiro (spec 010).

import { ANUIDADE } from './entregaveis';
import { calcularComissao, type NichoPreco } from './precificacao';

export { ANUIDADE };
export const ANUIDADE_MES = ANUIDADE / 12; // R$ 220 — como aparece no /modelo
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
};

export type Simulacao = {
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
    const aq = calcularComissao(e.nicho, 'aquisicao', ticket, e.distribuidor);
    const rec = calcularComissao(e.nicho, 'recorrencia', ticket, e.distribuidor);
    comissaoMes = pedidos * ((1 - recompra) * aq.comissao + recompra * rec.comissao);
    comissaoAno = comissaoMes * 12;
    vendasAno = pedidos * ticket * 12;
    if (aq.pisoAplicado) avisos.push('Ticket baixo: o percentual dá menos que o piso de R$ 5 por pedido, e vale o piso.');
    if (ticket > e.nicho.corte) {
      avisos.push(`Ticket acima de ${brl(e.nicho.corte)}: a parte que passa paga 2/3 da taxa.`);
    }
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
  const totalAno = ENTRADA_ANO + comissaoAno;
  return {
    comissaoMes,
    comissaoAno,
    vendasAno,
    totalAno,
    pctDaVenda: vendasAno > 0 ? totalAno / vendasAno : null,
    avisos,
  };
}

/** Linhas fixas que toda cadeira paga, na ordem em que entram na proposta. */
export const ITENS_FIXOS: { item: string; valor: string; quando: string; nota: string }[] = [
  { item: 'Setup', valor: 'R$ 0', quando: '—', nota: 'Loja, site, tecnologia e tráfego são bancados pela ROI Labs' },
  {
    item: 'Anuidade da cadeira',
    valor: `${brl(ANUIDADE)}/ano`,
    quando: 'Na assinatura e a cada renovação',
    nota: `${brl(ANUIDADE_MES)}/mês. Pix à vista, ou cartão em até 12x com acréscimo`,
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

export const REGRAS_DOMINIO = [
  'A ROI Labs compra o domínio na Hostinger antes de o site ir ao ar e repassa o valor ao cliente junto com a anuidade',
  `${brl(DOMINIO_ANO)}/ano é o valor inicial, para .com.br. Outra extensão (.com, .net) ou domínio já ocupado: orçar antes com o preço da Hostinger do dia`,
  'Renova todo ano junto com a anuidade. Domínio vencido derruba o site: a renovação automática fica ligada na Hostinger',
];

export const REGRAS_CONTRATO = [
  'Contrato anual, renovável por desempenho dos dois lados',
  'Uma cadeira por nicho no Brasil inteiro enquanto o contrato vigorar',
  'Comissão sobre o produto com desconto, nunca sobre o frete. Piso de R$ 5 por pedido',
  'Devolução, cancelamento ou chargeback devolvem a comissão',
  'Relatório venda por venda antes de cada cobrança do dia 05',
  'A recompra dos clientes que a ROI Labs trouxe segue comissionada por 12 meses depois do fim do contrato',
  'Desconto na comissão só até a faixa logo abaixo, e só em troca de algo (ex.: contrato de 24 meses).',
];
