// 016 — Tabela de precificação do success fee por nicho (proposta da pesquisa de 27/09/2026:
// margens IBGE PAC/PIA 2024 e balanços, comissões de marketplace, afiliados, representantes
// e CAC de mídia paga). É REFERÊNCIA para montar a proposta de uma cadeira: nada aqui é lido
// pela cobrança. A taxa que fatura continua sendo a do cadastro do Parceiro
// (comissaoAquisicao/comissaoRecorrencia, spec 010), congelada por negócio.
//
// ponytail: tabela em código, não no banco — muda poucas vezes por ano e mudar é um commit.
// Teto: se o Jean quiser editar pelo /admin, vira model Prisma + form, no molde dos
// parâmetros de centros de custo (004). Nada além desta página lê este arquivo.

export type Faixa = 'premium' | 'padrao' | 'intermediaria' | 'margem-fina' | 'especial';
export type Confianca = 'alta' | 'media-alta' | 'media' | 'media-baixa' | 'baixa';
export type TipoCompra = 'aquisicao' | 'recorrencia';

interface NichoBase {
  id: string;
  faixa: Faixa;
  nicho: string;
  regra: string | null;
  porque: string;
  confianca: Confianca;
  // Radicais (sem acento, minúsculos) que casam com o INÍCIO de uma palavra do nicho de um
  // parceiro. Só alimenta a sugestão da tabela "Taxas em vigor" — nunca a cobrança.
  radicais: string[];
}

export interface NichoPercentual extends NichoBase {
  modelo: 'percentual';
  aquisicao: number; // fração [0,1] sobre o produto com desconto, nunca sobre o frete
  recorrencia: number;
}

// SaaS e clínicas não cabem em "% por pedido": a primeira compra de um SaaS é uma
// mensalidade, e clínica não cobra % de tratamento. Guardam texto, não número.
export interface NichoOutroModelo extends NichoBase {
  modelo: 'mensalidade' | 'consulta';
  aquisicaoTexto: string;
  recorrenciaTexto: string;
}

export type NichoPreco = NichoPercentual | NichoOutroModelo;

export const PISO_POR_PEDIDO = 5; // R$ — abaixo do fixo que ML e Shopee cobram em item < R$79
export const TAXA_MINIMA = 0.05;
export const AJUSTE_DISTRIBUIDOR: Record<TipoCompra, number> = { aquisicao: 0.03, recorrencia: 0.02 };
// Premissas da régua de margem (projecao-financeira.md): Simples ~9% efetivo, cartão ~4%.
export const IMPOSTO_REF = 0.09;
export const MEIO_PAGAMENTO_REF = 0.04;

export const FAIXAS: Record<Faixa, { rotulo: string; criterio: string }> = {
  premium: { rotulo: 'Premium', criterio: 'Margem acima de 55% e pouca devolução' },
  padrao: { rotulo: 'Padrão', criterio: 'Margem de 45% a 60% (a devolução alta segura aqui)' },
  intermediaria: { rotulo: 'Intermediária', criterio: 'Margem de 35% a 45%, ou frete pesado' },
  'margem-fina': { rotulo: 'Margem fina', criterio: 'Margem de 20% a 35%' },
  especial: { rotulo: 'Modelo especial', criterio: 'Formato próprio de cobrança' },
};

const pct = (aquisicao: number, recorrencia: number) => ({ modelo: 'percentual', aquisicao, recorrencia }) as const;

export const NICHOS: NichoPreco[] = [
  {
    id: 'beleza', faixa: 'premium', nicho: 'Beleza, cosméticos e perfumaria (marca própria)', ...pct(0.18, 0.1),
    regra: 'Piso de R$ 5 por pedido. Se a margem ficar abaixo de 55%, usar 15% / 10%.',
    porque: 'As marcas já repassam de 15% a 35% do preço às revendedoras de venda direta. Conquistar o cliente com anúncio custa de 29% a 36% do pedido. A Hypera tem 60% de margem bruta.',
    confianca: 'media-baixa', radicais: ['beleza', 'cosmet', 'perfum', 'maquiag', 'skincare'],
  },
  {
    id: 'joias', faixa: 'premium', nicho: 'Joias (fabricação própria)', ...pct(0.18, 0.1),
    regra: 'Taxa reduzida acima de R$ 1.500.',
    porque: 'A Vivara tem margem bruta de 69,6%. Em joias, o anúncio consome cerca de 40% da venda. Quase ninguém recompra, então a primeira venda paga a conta.',
    confianca: 'media-baixa', radicais: ['joia', 'joalher', 'semijoia'],
  },
  {
    id: 'moda', faixa: 'padrao', nicho: 'Moda, vestuário e calçados', ...pct(0.15, 0.1),
    regra: 'Estornar a comissão quando o produto voltar (em moda, 30% a 40% dos pedidos voltam).',
    porque: 'Marcas próprias têm margem de 54% a 59%. Os canais de moda cobram de 18% a 30%. O anúncio custa cerca de 33% do pedido. A devolução alta é o que impede subir para 18%.',
    confianca: 'media-alta', radicais: ['moda', 'vestuario', 'roupa', 'calcad', 'confec', 'sapato'],
  },
  {
    id: 'esporte', faixa: 'padrao', nicho: 'Esporte e fitness', ...pct(0.15, 0.1),
    regra: 'Equipamentos grandes usam a taxa reduzida acima de R$ 1.500.',
    porque: 'Centauro e Track&Field têm margem de 50% a 58%. A Netshoes cobra de 20% a 30%. O anúncio custa cerca de 38% do pedido.',
    confianca: 'media', radicais: ['esporte', 'esportiv', 'fitness', 'academia', 'bike', 'ciclismo'],
  },
  {
    id: 'pet', faixa: 'padrao', nicho: 'Pet (acessórios e marca própria)', ...pct(0.15, 0.1),
    regra: 'Ração de giro com margem abaixo de 40%: 12% / 7%.',
    porque: 'A Petz Cobasi tem margem de 47%. O anúncio custa cerca de 67% do pedido. Ração é recomprada todo mês, então a recorrência pesa mais que a aquisição.',
    confianca: 'media', radicais: ['pet', 'racao', 'animal'],
  },
  {
    id: 'suplementos', faixa: 'padrao', nicho: 'Suplementos (marca própria)', ...pct(0.15, 0.1),
    regra: 'Revenda de outras marcas: 12% / 8%.',
    porque: 'O cliente recompra rápido. O afiliado da Amazon ganha 13% em saúde. A margem de marca própria não tem fonte confiável: confirmar com o fornecedor.',
    confianca: 'baixa', radicais: ['suplement', 'nutricao', 'whey', 'vitamina'],
  },
  {
    id: 'casa', faixa: 'intermediaria', nicho: 'Casa, móveis, decoração e cama-mesa-banho', ...pct(0.12, 0.08),
    regra: 'Taxa reduzida acima de R$ 1.500. Decoração leve com margem de 45% ou mais: 15% / 10%.',
    porque: 'O varejo do setor tem margem de 41% a 44%, mas o frete de móveis consome cerca de 8% do valor. Pouca gente recompra. A Amazon cobra 15% até R$ 200 e 10% no que passar.',
    confianca: 'media', radicais: ['casa', 'movel', 'moveis', 'decora', 'colchao', 'enxoval', 'utilidade'],
  },
  {
    id: 'construcao', faixa: 'intermediaria', nicho: 'Materiais de construção e revestimentos', ...pct(0.12, 0.08),
    regra: 'Taxa reduzida acima de R$ 1.500. Argumento de venda: a ROI Labs não cobra sobre o frete.',
    porque: 'Margem entre 35% e 36% (IBGE e Portobello). A Leroy Merlin cobra 18% + mensalidade; a MadeiraMadeira cobra também sobre o frete. Afiliados ganham de 6% a 8%.',
    confianca: 'media-baixa', radicais: ['construc', 'revestiment', 'porcelanato', 'piso', 'ceramic', 'telha', 'cimento', 'tinta'],
  },
  {
    id: 'ferramentas', faixa: 'intermediaria', nicho: 'Ferramentas, ferragens, elétrica e iluminação', ...pct(0.12, 0.08),
    regra: null,
    porque: 'Margem de 28% a 41%. Representante de indústria de material elétrico ganha até 10%. A Amazon cobra 11%.',
    confianca: 'media-baixa', radicais: ['ferrament', 'ferrage', 'eletric', 'iluminac', 'lampad'],
  },
  {
    id: 'saude', faixa: 'intermediaria', nicho: 'Saúde, produtos médicos e odontológicos', ...pct(0.12, 0.08),
    regra: null,
    porque: 'O comércio do setor tem margem de 32% a 40%. A Amazon cobra 12%. Não há dado confiável de conversão para o nicho.',
    confianca: 'baixa', radicais: ['saude', 'medic', 'hospital', 'odont', 'ortodont', 'alinhador', 'dental'],
  },
  {
    id: 'brinquedos', faixa: 'intermediaria', nicho: 'Brinquedos e bebês', ...pct(0.12, 0.08),
    regra: null,
    porque: 'Margem de 42% a 46%. A Amazon cobra 12%. Afiliados ganham de 8% a 13%.',
    confianca: 'baixa', radicais: ['brinqued', 'bebe', 'infantil'],
  },
  {
    id: 'papelaria', faixa: 'intermediaria', nicho: 'Papelaria e escritório', ...pct(0.12, 0.08),
    regra: 'Piso de R$ 5 (o valor do pedido costuma ser baixo).',
    porque: 'Margem de 38% a 42%. A Amazon cobra 13%. O anúncio consome cerca de 33% da venda.',
    confianca: 'baixa', radicais: ['papelaria', 'escritorio', 'caderno'],
  },
  {
    id: 'jardinagem', faixa: 'intermediaria', nicho: 'Jardinagem (plantas, acessórios, biológicos)', ...pct(0.12, 0.08),
    regra: null,
    porque: 'O varejo tem margem de cerca de 37%. Produtos biológicos chegam a 59%.',
    confianca: 'baixa', radicais: ['jardin', 'planta', 'paisagis'],
  },
  {
    id: 'autopecas', faixa: 'margem-fina', nicho: 'Autopeças e acessórios automotivos', ...pct(0.1, 0.06),
    regra: null,
    porque: 'Margem de cerca de 30% (IBGE e Frasle). Amazon e Mercado Livre cobram 12%. Afiliados ganham de 4% a 7%. A ROI Labs precisa ficar abaixo do marketplace mais barato.',
    confianca: 'media-baixa', radicais: ['autopeca', 'automotiv', 'veicul', 'pneu'],
  },
  {
    id: 'alimentos', faixa: 'margem-fina', nicho: 'Alimentos e bebidas (especiais, marca própria)', ...pct(0.1, 0.06),
    regra: 'Piso de R$ 5. Alimento commodity com margem abaixo de 25%: não abrir cadeira cobrando percentual.',
    porque: 'Margem de 32% a 34%. A Amazon cobra 10%. O cliente recompra muito. No atacado de alimentos, 15% consumiria toda a folga do fornecedor.',
    confianca: 'media', radicais: ['aliment', 'bebida', 'gourmet', 'cafe', 'vinho', 'cerveja', 'doce'],
  },
  {
    id: 'eletronicos', faixa: 'margem-fina', nicho: 'Eletrodomésticos, eletrônicos e informática', ...pct(0.08, 0.05),
    regra: 'Acima de R$ 1.500, a parte que passar paga 5%.',
    porque: 'Margem de 25% a 31% (Magalu, Multi, Intelbras). A Amazon cobra de 10% a 13%. Afiliados ganham de 4% a 8%. De 10% a 20% dos pedidos são devolvidos.',
    confianca: 'media', radicais: ['eletronic', 'eletrodomest', 'informatic', 'celular', 'computador', 'notebook'],
  },
  {
    id: 'agro', faixa: 'margem-fina', nicho: 'Agro-insumos (fertilizantes, defensivos)', ...pct(0.08, 0.05),
    regra: 'Só abrir cadeira se a margem for de 30% ou mais.',
    porque: 'O atacado de adubos tem margem de 18,5%; a Vittia tem 30,5%. Com margem menor que isso, nenhum percentual fecha a conta.',
    confianca: 'baixa', radicais: ['agro', 'agricol', 'fertiliz', 'defensiv', 'adubo', 'semente'],
  },
  {
    id: 'b2b', faixa: 'especial', nicho: 'Embalagens, fitas adesivas e suprimentos B2B', ...pct(0.15, 0.08),
    regra: 'Recorrência sobe para 10% se a margem for de 40% ou mais. Cliente que já comprava do fornecedor paga a taxa de recorrência.',
    porque: 'Conquistar um cliente industrial por anúncio custa de R$ 1.700 a R$ 5.500 (clique de até R$ 32,95 em "fitas adesivas personalizadas", ago/2026). O fabricante tem margem de 24% a 40%. Representante industrial ganha de 5% a 10% nas recompras.',
    confianca: 'media-baixa', radicais: ['embalage', 'fita', 'adesiv', 'industrial', 'suprimento'],
  },
  {
    id: 'saas', faixa: 'especial', nicho: 'Software e SaaS B2B', modelo: 'mensalidade',
    aquisicaoTexto: '20% das 12 primeiras mensalidades', recorrenciaTexto: '10% a partir da 13ª mensalidade',
    regra: 'Taxa de implantação: 20%. SaaS de mensalidade baixa: 15% nos 12 primeiros meses.',
    porque: 'RD Station paga 20% por 12 meses, HubSpot 30%, Bling 10% e Nuvemshop 20% sem prazo. A margem de software fica perto de 73%.',
    confianca: 'media', radicais: ['saas', 'software', 'crm', 'erp', 'sistema', 'aplicativo'],
  },
  {
    id: 'clinicas', faixa: 'especial', nicho: 'Serviços locais e clínicas (saúde, estética)', modelo: 'consulta',
    aquisicaoTexto: 'R$ 150 a R$ 300 por consulta comparecida', recorrenciaTexto: 'Nenhum % sobre o tratamento',
    regra: 'Checar as regras do CFO/CFM antes de fechar qualquer valor por paciente.',
    porque: 'O mercado cobra de R$ 150 a R$ 350 por consulta marcada. Ninguém cobra percentual sobre o tratamento.',
    confianca: 'baixa', radicais: ['clinica', 'consultorio', 'estetica', 'servico'],
  },
];

export const NICHOS_PERCENTUAIS = NICHOS.filter((n): n is NichoPercentual => n.modelo === 'percentual');

const reais = (v: number) => Math.round(v * 100) / 100;
const fracao = (v: number) => Math.round(v * 10000) / 10000;

export interface ResultadoComissao {
  taxaTabela: number;
  taxaAplicada: number; // já com o ajuste de distribuidor, nunca abaixo de TAXA_MINIMA (a manual vale como está)
  pisoAplicado: boolean;
  comissao: number;
  pctEfetivo: number;
  fornecedorFica: number; // antes do custo do produto e dos impostos
}

export function calcularComissao(
  nicho: NichoPercentual,
  tipo: TipoCompra,
  valorProduto: number,
  distribuidor = false,
  /** Taxa negociada à mão (fração): troca a da tabela e o ajuste de distribuidor, sem piso de TAXA_MINIMA. */
  taxaManual: number | null = null,
): ResultadoComissao {
  const valor = Number.isFinite(valorProduto) && valorProduto > 0 ? reais(valorProduto) : 0;
  const taxaTabela = nicho[tipo];
  const taxaAplicada =
    taxaManual !== null
      ? fracao(taxaManual)
      : Math.max(TAXA_MINIMA, fracao(taxaTabela - (distribuidor ? AJUSTE_DISTRIBUIDOR[tipo] : 0)));
  // Taxa única sobre o pedido inteiro: não há faixa reduzida em pedido grande (Jean, 29/09/2026).
  const pelaTaxa = reais(valor * taxaAplicada);
  // O piso nunca passa do valor do pedido: num item de R$ 3, cobrar R$ 5 seria absurdo.
  const piso = Math.min(PISO_POR_PEDIDO, valor);
  const pisoAplicado = valor > 0 && pelaTaxa < piso;
  const comissao = pisoAplicado ? piso : pelaTaxa;
  return {
    taxaTabela,
    taxaAplicada,
    pisoAplicado,
    comissao,
    pctEfetivo: valor > 0 ? comissao / valor : 0,
    fornecedorFica: reais(valor - comissao),
  };
}

// Régua de margem: nas recompras, a comissão não passa de 1/3 da folga (o que sobra da
// margem depois de imposto, meio de pagamento e frete pago pelo fornecedor). É premissa
// da pesquisa, sem fonte externa — ponto de partida, não lei.
const DEGRAUS: { faixa: Faixa; margemMinima: number; aquisicao: number; recorrencia: number }[] = [
  { faixa: 'premium', margemMinima: 0.55, aquisicao: 0.18, recorrencia: 0.1 },
  { faixa: 'padrao', margemMinima: 0.45, aquisicao: 0.15, recorrencia: 0.1 },
  { faixa: 'intermediaria', margemMinima: 0.35, aquisicao: 0.12, recorrencia: 0.08 },
  { faixa: 'margem-fina', margemMinima: 0.3, aquisicao: 0.1, recorrencia: 0.06 },
  { faixa: 'margem-fina', margemMinima: 0.2, aquisicao: 0.08, recorrencia: 0.05 },
];

export interface EncaixeMargem {
  folga: number; // fração da venda que sobra para pagar comissão e o resto do negócio
  recorrenciaMaxima: number;
  sugestao: { faixa: Faixa; aquisicao: number; recorrencia: number } | null; // null = não fecha
}

export function encaixarPorMargem(margem: number, frete = 0): EncaixeMargem {
  const m = Number.isFinite(margem) ? Math.min(1, Math.max(0, margem)) : 0;
  const f = Number.isFinite(frete) ? Math.min(1, Math.max(0, frete)) : 0;
  const folga = Math.max(0, m * (1 - IMPOSTO_REF) - MEIO_PAGAMENTO_REF - f);
  const recorrenciaMaxima = folga / 3;
  // A faixa mais alta que a margem alcança E cuja recorrência cabe na folga: frete pesado
  // derruba a faixa mesmo com margem boa.
  const degrau = DEGRAUS.find(
    (d) => m >= d.margemMinima && d.recorrencia <= recorrenciaMaxima + 1e-9,
  );
  return {
    folga,
    recorrenciaMaxima,
    sugestao: degrau ? { faixa: degrau.faixa, aquisicao: degrau.aquisicao, recorrencia: degrau.recorrencia } : null,
  };
}

const semAcento = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Sugere a linha da tabela para o nicho gravado num parceiro ("Fitas adesivas" → B2B).
// Modelos especiais primeiro: são os mais específicos ("CRM / Estética" é SaaS, não clínica).
export function nichoSugerido(texto: string): NichoPreco | null {
  const palavras = semAcento(texto).split(/[^a-z0-9]+/).filter(Boolean);
  const ordem = [...NICHOS.filter((n) => n.faixa === 'especial'), ...NICHOS.filter((n) => n.faixa !== 'especial')];
  return ordem.find((n) => n.radicais.some((r) => palavras.some((p) => p.startsWith(r)))) ?? null;
}

// "1.500,50" / "1500,5" / "R$ 1.500" / "1500.5" → número; vazio ou lixo → NaN.
// Sem vírgula, ponto seguido de grupos de 3 dígitos é milhar ("1.500" = 1500), não decimal.
export function lerNumeroBR(s: string): number {
  const limpo = s.replace(/[R$\s%]/g, '');
  if (!limpo) return NaN;
  const milhar = limpo.includes(',') || /^\d{1,3}(\.\d{3})+$/.test(limpo);
  const normal = milhar ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  return /^\d+(\.\d+)?$/.test(normal) ? Number(normal) : NaN;
}
