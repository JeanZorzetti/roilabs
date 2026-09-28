/**
 * Catálogo de serviços da Vértice — fonte única para /admin.
 *
 * Espelha ENTREGAVEIS.md (escopo, anexo de contrato) e PRECIFICACAO-INTERNA.md
 * (custo, margem, piso). Os campos `cost`, `marginPct` e `floor` são INTERNOS:
 * nunca renderizar fora de /admin, que está atrás do Basic Auth do middleware.
 *
 * Versão 2 — 08/09/2026 (alteração avulsa e banner). Mudou preço ou hora? Muda aqui e nos dois .md.
 */

export const HOUR_COST = 150; // custo-hora carregado (PRECIFICACAO §1)
export const HOUR_RATE_EXEC = 350; // hora avulsa de execução
export const HOUR_RATE_SENIOR = 450; // hora avulsa de consultoria sênior
export const MARGIN_TARGET = 0.55; // margem bruta alvo
export const MARGIN_FLOOR = 0.4; // piso absoluto — abaixo disso não se fecha

export type OfferKind = "setup" | "recorrente" | "avulso";

export type DeliverableGroup = {
  title: string;
  items: string[];
};

export type Offer = {
  id: string;
  name: string;
  kind: OfferKind;
  /** null quando o preço é variável (ex.: % da verba). */
  price: number | null;
  priceLabel: string;
  hours: number | null;
  hoursLabel: string;
  /** Prazo de entrega em dias úteis, quando é projeto. */
  sla?: string;
  cost?: number;
  marginPct?: number;
  floor?: number | null;
  deliverables: DeliverableGroup[];
  hourBudget?: string;
  excludes?: string[];
  prereq?: string[];
  rules?: string[];
  /** Recorrente que entra no desconto de combinação (PRECIFICACAO §8). */
  discountEligible: boolean;
};

export type Service = {
  id: string;
  name: string;
  tagline: string;
  offers: Offer[];
};

/**
 * Google Ads e Meta Ads são serviços separados. A implantação e a faixa acima de
 * R$ 150 mil são iguais nos dois; as mensalidades não: no Meta o trabalho é
 * produzir e testar criativo, então as faixas baixas são mais finas e contam
 * criativo em vez de texto e peça separados.
 */
function implantacao(prefix: string, setup: DeliverableGroup[], setupExcludes: string[]): Offer {
  return {
    id: `${prefix}-implantacao`,
    name: "Implantação",
    kind: "setup",
    price: 3900,
    priceLabel: "R$ 3.900",
    hours: 12,
    hoursLabel: "12h",
    sla: "10 dias úteis",
    cost: 1800,
    marginPct: 0.54,
    floor: null,
    discountEligible: false,
    deliverables: [
      ...setup,
      {
        title: "Leitura e ritmo",
        items: [
          "Painel de acompanhamento em Looker Studio, atualizado sozinho",
          "Reunião de kickoff (1h), gravada",
          "Reunião de entrega da estrutura (1h), gravada",
        ],
      },
    ],
    excludes: ["Landing page — serviço à parte (R$ 5.900)", "Produção de criativo em vídeo", ...setupExcludes],
  };
}

/** Mensalidade por faixa de verba. Custo = horas × custo-hora; a margem sai dele. */
function mensal(o: {
  id: string;
  name: string;
  price: number;
  hours: number;
  floor: number;
  items: string[];
  excludes?: string[];
  hourBudget?: string;
}): Offer {
  const cost = o.hours * HOUR_COST;
  return {
    id: o.id,
    name: o.name,
    kind: "recorrente",
    price: o.price,
    priceLabel: `${brl(o.price)}/mês`,
    hours: o.hours,
    hoursLabel: `${o.hours}h/mês`,
    cost,
    marginPct: Math.round(((o.price - cost) / o.price) * 100) / 100,
    floor: o.floor,
    discountEligible: true,
    hourBudget: o.hourBudget,
    deliverables: [{ title: "Cadência", items: o.items }],
    excludes: o.excludes,
  };
}

function acima(prefix: string, platform: string): Offer {
  return {
    id: `${prefix}-mensal-acima`,
    name: `Mensalidade · verba ${platform} acima de R$ 150 mil`,
    kind: "recorrente",
    price: null,
    priceLabel: "6% da verba",
    hours: null,
    hoursLabel: "dimensionado no contrato",
    floor: null,
    discountEligible: false,
    deliverables: [
      {
        title: "Cadência",
        items: [
          "Escopo da faixa de R$ 40–150k como base, dimensionado no contrato",
          "Piso de negociação: 5% da verba",
        ],
      },
    ],
    rules: ["Preço percentual precisa de verba auditável no relatório mensal."],
  };
}

const PLANO_TRIMESTRAL = "Planejamento de mídia trimestral, com projeção";

/** Criativo = peça estática adaptada + texto principal e título. É a unidade de produção no Meta. */
const criativos = (n: number) =>
  `Até ${n} criativos novos por mês — peça estática adaptada (feed, stories e reels) + texto principal e título`;

/** Meta até R$ 10 mil: ~6h de cadência + ~0,5h por criativo, a 55% de margem. */
const metaFaixaBaixa = (n: number) => [
  "Otimização da conta 2× por semana",
  "1 reunião de resultado por mês (45min)",
  "Relatório mensal escrito até o 5º dia útil",
  criativos(n),
  "1 teste A/B estruturado por mês",
  PLANO_TRIMESTRAL,
  "Ajuste de público e exclusões quinzenal",
];

/** Anúncio de pesquisa responsivo: até 15 títulos e 4 descrições. É a unidade de texto no Google. */
const anunciosPesquisa = (n: number) =>
  `Até ${n} anúncios de pesquisa novos por mês (responsivos: títulos e descrições)`;
const pecasGoogle = (n: number) =>
  `Até ${n} peças estáticas adaptadas por mês (Display e Performance Max)`;

/**
 * Google até R$ 10 mil: ~4h de cadência + ~0,5h por anúncio, ~0,25h por peça e
 * 1h por teste A/B, a 55% de margem. Mais barato que o Meta porque o resultado
 * aqui vem mais de palavra-chave e lance do que de criativo.
 */
const googleFaixaBaixa = (anuncios: number, pecas: number) => [
  "Otimização da conta 2× por semana",
  "1 reunião de resultado por mês (45min)",
  "Relatório mensal escrito até o 5º dia útil",
  anunciosPesquisa(anuncios),
  pecasGoogle(pecas),
  "Ajuste de palavra-chave e negativação quinzenal",
];

/** Mensalidade de mídia paga contratada nesta lista de ofertas? */
export function hasTrafegoMensal(offerIds: Iterable<string>): boolean {
  return [...offerIds].some((id) => id.startsWith("google-mensal") || id.startsWith("meta-mensal"));
}

export const SERVICES: Service[] = [
  {
    id: "google-ads",
    name: "Gestão de Google Ads",
    tagline: "Pesquisa, Performance Max e Display operados com a conversão importada até a venda.",
    offers: [
      implantacao(
        "google",
        [
          {
            title: "Diagnóstico e estrutura",
            items: [
              "Auditoria escrita da conta atual de Google Ads — ou montagem do zero quando não existe conta",
              "Pesquisa de palavras-chave e lista inicial de negativação",
              "Estrutura de campanhas, grupos de anúncios e anúncios documentada",
              "Primeiros textos de anúncio e a primeira leva de anúncios no ar",
            ],
          },
          {
            title: "Rastreamento",
            items: [
              "GA4 instalado, configurado e vinculado ao Google Ads",
              "Google Tag Manager com os disparos documentados",
              "Conversões importadas no Google Ads e marcadas como primárias",
              "Definição do evento de valor e de quais conversões contam",
              "Conexão com o CRM Vértice quando contratado — importação de conversão offline lead → venda",
            ],
          },
        ],
        ["Merchant Center e Shopping — é escopo de E-commerce"]
      ),
      mensal({
        id: "google-mensal-3k",
        name: "Mensalidade · verba Google até R$ 3 mil",
        price: 2000,
        hours: 6,
        floor: 1500,
        items: googleFaixaBaixa(3, 2),
        excludes: ["Teste A/B estruturado", "Planejamento de mídia com projeção"],
      }),
      mensal({
        id: "google-mensal-6k",
        name: "Mensalidade · verba Google R$ 3 mil a 6 mil",
        price: 2400,
        hours: 7,
        floor: 1750,
        items: googleFaixaBaixa(4, 3),
        excludes: ["Teste A/B estruturado", "Planejamento de mídia com projeção"],
      }),
      mensal({
        id: "google-mensal-10k",
        name: "Mensalidade · verba Google R$ 6 mil a 10 mil",
        price: 3000,
        hours: 9,
        floor: 2250,
        items: [...googleFaixaBaixa(6, 4), "1 teste A/B estruturado por mês"],
        excludes: ["Planejamento de mídia com projeção"],
      }),
      mensal({
        id: "google-mensal-40k",
        name: "Mensalidade · verba Google R$ 10 mil a 40 mil",
        price: 4400,
        hours: 13,
        floor: 3250,
        hourBudget:
          "Otimização 6h · análise e relatório 2h · reuniões e preparação 3h · criativo e testes 2h",
        items: [
          "Otimização da conta todo dia útil",
          "2 reuniões de resultado por mês (1h cada)",
          "Relatório mensal + resumo quinzenal",
          anunciosPesquisa(8),
          pecasGoogle(4),
          "1 teste A/B estruturado por mês",
          "Ajuste de palavra-chave e negativação semanal",
        ],
        excludes: ["Planejamento de mídia trimestral com projeção"],
      }),
      mensal({
        id: "google-mensal-150k",
        name: "Mensalidade · verba Google R$ 40 mil a 150 mil",
        price: 8900,
        hours: 26,
        floor: 6500,
        items: [
          "Otimização todo dia útil + revisão de portfólio",
          "2 reuniões por mês (1h) + pauta estratégica",
          "Relatório mensal + dashboard ao vivo",
          anunciosPesquisa(16),
          pecasGoogle(8),
          "2 testes A/B estruturados por mês",
          PLANO_TRIMESTRAL,
          "Ajuste de palavra-chave e negativação semanal",
        ],
      }),
      acima("google", "Google"),
    ],
  },
  {
    id: "meta-ads",
    name: "Gestão de Meta Ads",
    tagline: "Facebook e Instagram operados com a API de Conversões fechada até a venda.",
    offers: [
      implantacao(
        "meta",
        [
          {
            title: "Diagnóstico e estrutura",
            items: [
              "Auditoria escrita da conta atual de Meta Ads — ou montagem do zero quando não existe conta",
              "Públicos iniciais e exclusões montados",
              "Estrutura de campanhas, conjuntos e anúncios documentada",
              "Primeiros criativos e a primeira leva de anúncios no ar",
            ],
          },
          {
            title: "Rastreamento",
            items: [
              "Meta Pixel + API de Conversões",
              "Google Tag Manager com os disparos documentados",
              "Verificação de domínio no Meta",
              "Definição do evento de valor e de quais conversões contam",
              "Conexão com o CRM Vértice quando contratado — conversão offline lead → venda pela API de Conversões",
            ],
          },
        ],
        ["Verificação de domínio quando o cliente não libera o DNS"]
      ),
      mensal({
        id: "meta-mensal-3k",
        name: "Mensalidade · verba Meta até R$ 3 mil",
        price: 3000,
        hours: 9,
        floor: 2250,
        items: metaFaixaBaixa(6),
      }),
      mensal({
        id: "meta-mensal-6k",
        name: "Mensalidade · verba Meta R$ 3 mil a 6 mil",
        price: 3400,
        hours: 10,
        floor: 2500,
        items: metaFaixaBaixa(8),
      }),
      mensal({
        id: "meta-mensal-10k",
        name: "Mensalidade · verba Meta R$ 6 mil a 10 mil",
        price: 3700,
        hours: 11,
        floor: 2750,
        items: metaFaixaBaixa(10),
      }),
      mensal({
        id: "meta-mensal-40k",
        name: "Mensalidade · verba Meta R$ 10 mil a 40 mil",
        price: 6000,
        hours: 18,
        floor: 4500,
        items: [
          "Otimização da conta todo dia útil",
          "2 reuniões de resultado por mês (1h cada)",
          "Relatório mensal + resumo quinzenal",
          criativos(14),
          "1 teste A/B estruturado por mês",
          PLANO_TRIMESTRAL,
          "Ajuste de público e exclusões semanal",
        ],
      }),
      mensal({
        id: "meta-mensal-150k",
        name: "Mensalidade · verba Meta R$ 40 mil a 150 mil",
        price: 10700,
        hours: 32,
        floor: 8000,
        items: [
          "Otimização todo dia útil + revisão de portfólio",
          "2 reuniões por mês (1h) + pauta estratégica",
          "Relatório mensal + dashboard ao vivo",
          criativos(20),
          "2 testes A/B estruturados por mês",
          PLANO_TRIMESTRAL,
          "Ajuste de público e exclusões semanal",
        ],
      }),
      acima("meta", "Meta"),
      {
        // ponytail: mora no Meta porque LinkedIn/TikTok são mídia social, mas
        // vale sobre qualquer mensalidade de Google ou Meta (ver quote.ts).
        id: "midia-canal-extra",
        name: "Canal adicional",
        kind: "recorrente",
        price: 1200,
        priceLabel: "R$ 1.200/mês",
        hours: 3,
        hoursLabel: "3h/mês",
        cost: 450,
        marginPct: 0.62,
        floor: null,
        discountEligible: true,
        deliverables: [
          {
            title: "Escopo",
            items: [
              "A mesma cadência da faixa de Google ou Meta contratada aplicada a um canal a mais (LinkedIn, TikTok, Microsoft Ads…)",
              "Resultado consolidado no mesmo relatório, sem relatório separado",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "crm",
    name: "CRM & Tecnologia Própria",
    tagline: "O funil do cliente mora aqui. É o que sustenta o retainer.",
    offers: [
      {
        id: "crm-implantacao",
        name: "Implantação",
        kind: "setup",
        price: 6900,
        priceLabel: "R$ 6.900",
        hours: 20,
        hoursLabel: "20h",
        sla: "15 dias úteis",
        cost: 3000,
        marginPct: 0.57,
        floor: null,
        discountEligible: false,
        deliverables: [
          {
            title: "Desenho",
            items: [
              "Reunião de descoberta e desenho do funil real — não o do papel",
              "Etapas, campos personalizados e motivos de perda configurados",
            ],
          },
          {
            title: "Automações (até 5)",
            items: [
              "Distribuição de lead",
              "Alerta de lead novo",
              "Lembrete de follow-up",
              "Aviso de lead parado",
              "Notificação de fechamento",
            ],
          },
          {
            title: "Captação conectada",
            items: ["Formulários do site", "Meta Lead Ads", "Google Lead Form", "WhatsApp"],
          },
          {
            title: "Base e adoção",
            items: [
              "1 importação da base atual — até 5.000 registros, em planilha no modelo enviado pela Vértice",
              "Treinamento: 2 sessões de 1h, gravadas, + guia de 1 página",
              "30 dias de acompanhamento de adoção com ajuste fino",
            ],
          },
        ],
        excludes: [
          "Migração de histórico de conversas de outro CRM",
          "Desenvolvimento de funcionalidade nova na plataforma",
          "Uso do CRM como sistema de emissão fiscal",
        ],
      },
      {
        id: "crm-integracao-erp",
        name: "Integração com ERP ou sistema de vendas",
        kind: "setup",
        price: 4900,
        priceLabel: "R$ 4.900",
        hours: 14,
        hoursLabel: "14h",
        sla: "20 dias úteis",
        cost: 2100,
        marginPct: 0.57,
        floor: null,
        discountEligible: false,
        deliverables: [
          {
            title: "Escopo",
            items: [
              "Um sistema por contrato",
              "Sincronização acordada campo a campo antes de começar, com a direção definida (uma via ou duas)",
              "Tratamento de erro e log de sincronização",
              "Teste com dados reais e homologação assistida",
            ],
          },
        ],
        prereq: [
          "O sistema do cliente precisa ter API documentada e acesso liberado. Sem isso não é este serviço — vira levantamento por hora (R$ 350/h).",
        ],
      },
      {
        id: "crm-licenca",
        name: "Licença e suporte (até 5 usuários)",
        kind: "recorrente",
        price: 390,
        priceLabel: "R$ 390/mês",
        hours: 1,
        hoursLabel: "~1h/mês",
        cost: 150,
        marginPct: 0.62,
        floor: 290,
        discountEligible: true,
        deliverables: [
          {
            title: "Sustentação",
            items: [
              "Hospedagem e disponibilidade",
              "Backup diário",
              "Atualizações da plataforma",
              "Suporte em dias úteis",
              "Até 1h/mês de ajuste de configuração — novo campo, novo motivo de perda, ajuste de permissão",
            ],
          },
        ],
        rules: [
          "Sem fidelidade. Na saída, exportação completa em CSV em até 5 dias úteis.",
          "Automação nova, novo funil ou relatório sob medida: R$ 350/h.",
          "Mensalidade barata de propósito — a margem se faz na implantação, não na licença.",
        ],
      },
      {
        id: "crm-usuario-extra",
        name: "Usuário adicional",
        kind: "recorrente",
        price: 70,
        priceLabel: "R$ 70/mês",
        hours: 0,
        hoursLabel: "—",
        cost: 10,
        marginPct: 0.86,
        floor: null,
        discountEligible: false,
        deliverables: [
          { title: "Escopo", items: ["1 usuário além dos 5 inclusos na licença"] },
        ],
      },
    ],
  },
  {
    id: "consultoria",
    name: "Consultoria de Performance",
    tagline: "Analisa e orienta. Não opera — os acessos são de leitura.",
    offers: [
      {
        id: "consultoria-diagnostico",
        name: "Diagnóstico avulso",
        kind: "avulso",
        price: 4900,
        priceLabel: "R$ 4.900",
        hours: 14,
        hoursLabel: "14h",
        sla: "15 dias úteis",
        cost: 2100,
        marginPct: 0.57,
        floor: 3500,
        discountEligible: false,
        deliverables: [
          {
            title: "Entregue",
            items: [
              "Auditoria das contas de mídia, do rastreamento e do funil de vendas",
              "Leitura de 3 concorrentes diretos",
              "Documento com achados, cada um com evidência — print, número, link",
              "Plano de ação priorizado por esforço × impacto, com responsável sugerido",
              "Reunião de apresentação de 90min, gravada",
              "1 rodada de dúvidas por escrito em até 30 dias após a entrega",
            ],
          },
        ],
        rules: [
          "É a porta de entrada quando o cliente não cabe no piso de nenhuma mensalidade.",
        ],
      },
      {
        id: "consultoria-mensal",
        name: "Acompanhamento mensal",
        kind: "recorrente",
        price: 2400,
        priceLabel: "R$ 2.400/mês",
        hours: 6,
        hoursLabel: "6h/mês",
        cost: 900,
        marginPct: 0.62,
        floor: 1750,
        discountEligible: true,
        hourBudget: "Reuniões 2h · análise e preparação 3h · plano escrito 1h",
        deliverables: [
          {
            title: "Entregue",
            items: [
              "2 reuniões de 1h (quinzenais), gravadas, com resumo escrito",
              "Dashboard mantido e revisado",
              "Plano do mês por escrito + fechamento do mês anterior",
              "Leitura crítica do que a equipe do cliente executou",
            ],
          },
        ],
        excludes: [
          "Execução de qualquer natureza — criar campanha, mexer em conta, produzir criativo, escrever anúncio",
        ],
        rules: [
          "No dia em que a Vértice mexe na conta, o serviço passou a ser Gestão de Google Ads ou de Meta Ads e é assim que precisa ser cobrado.",
        ],
      },
    ],
  },
  {
    id: "sites",
    name: "Criação de Sites",
    tagline: "Copy de conversão, LCP abaixo de 2,5s e formulário ligado ao CRM.",
    offers: [
      {
        id: "site-landing",
        name: "Landing page de conversão",
        kind: "setup",
        price: 5900,
        priceLabel: "R$ 5.900",
        hours: 18,
        hoursLabel: "18h",
        sla: "15 dias úteis",
        cost: 2700,
        marginPct: 0.54,
        floor: 4500,
        discountEligible: false,
        deliverables: [
          {
            title: "Conteúdo e layout",
            items: [
              "Briefing de 1h",
              "Copy de conversão escrita pela Vértice",
              "Até 8 seções em uma página",
              "Layout a partir da identidade que o cliente já tem — não é criação de marca",
              "Responsivo e testado em 3 larguras",
            ],
          },
          {
            title: "Performance e SEO",
            items: [
              "LCP abaixo de 2,5s, medido na entrega",
              "Lighthouse de performance ≥ 90 no mobile, medido na entrega",
              "SEO on-page: title, meta, headings, dados estruturados, sitemap, robots",
            ],
          },
          {
            title: "Integração e publicação",
            items: [
              "Formulário integrado ao CRM Vértice — ou e-mail, se não houver CRM",
              "GA4 e Tag Manager instalados com conversão configurada",
              "Publicação, domínio apontado e SSL",
            ],
          },
        ],
        prereq: [
          "Cliente fornece em até 5 dias: logo em vetor, fotos, dados de contato, aprovações",
        ],
        excludes: [
          "Sessão de fotos",
          "Ilustração autoral",
          "Versão em outro idioma",
          "Integração com sistema de terceiros",
        ],
      },
      {
        id: "site-institucional",
        name: "Site institucional (até 7 páginas)",
        kind: "setup",
        price: 12900,
        priceLabel: "R$ 12.900",
        hours: 38,
        hoursLabel: "38h",
        sla: "30 dias úteis",
        cost: 5700,
        marginPct: 0.56,
        floor: 9500,
        discountEligible: false,
        deliverables: [
          {
            title: "Tudo da landing page, mais",
            items: [
              "Até 7 páginas — uma delas pode ser blog com painel de publicação",
              "Menu, rodapé e navegação em todas as páginas",
              "Até 2 formulários",
              "Redirecionamentos 301 do site antigo, quando houver",
              "Treinamento de 1h para publicar conteúdo",
            ],
          },
        ],
      },
      {
        id: "site-pagina-extra",
        name: "Página adicional",
        kind: "avulso",
        price: 1400,
        priceLabel: "R$ 1.400",
        hours: 4,
        hoursLabel: "4h",
        sla: "5 dias úteis",
        cost: 600,
        marginPct: 0.57,
        floor: null,
        discountEligible: false,
        deliverables: [
          { title: "Escopo", items: ["1 página nova no padrão do site contratado"] },
        ],
      },
      {
        id: "site-manutencao",
        name: "Manutenção mensal",
        kind: "recorrente",
        price: 690,
        priceLabel: "R$ 690/mês",
        hours: 2,
        hoursLabel: "2h/mês",
        cost: 300,
        marginPct: 0.57,
        floor: null,
        discountEligible: true,
        deliverables: [
          {
            title: "Sustentação",
            items: [
              "Hospedagem",
              "SSL",
              "Backup",
              "Atualização de dependências e correção de segurança",
              "Monitoramento de uptime",
              "Até 2h de alteração por mês, não acumulativas",
            ],
          },
        ],
        rules: [
          "SLA de site fora do ar: 4h úteis.",
          "Alteração acima de 2h: R$ 350/h, aprovada por escrito antes.",
        ],
      },
      {
        id: "site-alteracao",
        name: "Alteração avulsa (chamado)",
        kind: "avulso",
        price: 700,
        priceLabel: "R$ 700 por chamado",
        hours: 2,
        hoursLabel: "2h (mínimo faturado)",
        sla: "5 dias úteis",
        cost: 300,
        marginPct: 0.57,
        floor: null,
        discountEligible: false,
        deliverables: [
          {
            title: "O que entra no chamado",
            items: [
              "Até 2h de alteração em site já no ar: trocar, mover ou remover banner, ajustar texto, remover seção ou página",
              "Redirect 301 quando uma URL sai do ar — sem isso a página vira 404 no Google",
              "Limpeza do que fica órfão: item de menu, link interno, entrada no sitemap",
              "Publicação e conferência em desktop e mobile",
              "1 rodada de ajuste",
            ],
          },
        ],
        rules: [
          "Mínimo de 2h por chamado. A hora cheia de R$ 350 num pedido de 40 minutos dá MB 36% e fura o piso — o custo de orçar, aprovar, publicar, conferir e faturar existe mesmo quando a execução é curta.",
          "Vários pedidos aprovados juntos são UM chamado. Fatiar em vários pedidos de uma linha é o que o mínimo existe para evitar.",
          "Acima de 2h: R$ 350/h, aprovada por escrito antes.",
          "Cliente que manda alteração todo mês: oferecer a Manutenção mensal (R$ 690/mês). É o mesmo dinheiro de um chamado e vira recorrente.",
        ],
      },
      {
        id: "site-banner",
        name: "Criação de banner",
        kind: "avulso",
        price: 450,
        priceLabel: "R$ 450/peça",
        hours: 1.5,
        hoursLabel: "1,5h/peça",
        sla: "5 dias úteis",
        cost: 225,
        marginPct: 0.5,
        floor: null,
        discountEligible: false,
        deliverables: [
          {
            title: "Por peça",
            items: [
              "Arte em 2 formatos: desktop e mobile",
              "Aplicação no site, com link de destino",
              "1 rodada de ajuste",
            ],
          },
        ],
        prereq: [
          "Identidade do site já definida e material de origem fornecido: logo em vetor, packshot ou peça do fabricante",
        ],
        rules: [
          "Arte que chega pronta do cliente não é este item — é só o chamado de alteração.",
          "Não inclui criação de identidade visual, foto, vídeo nem animação.",
        ],
      },
    ],
  },
  {
    id: "seo",
    name: "Consultoria de SEO",
    tagline: "Busca e citação por IA. Nenhuma posição é prometida.",
    offers: [
      {
        id: "seo-diagnostico",
        name: "Diagnóstico técnico",
        kind: "avulso",
        price: 4900,
        priceLabel: "R$ 4.900",
        hours: 14,
        hoursLabel: "14h",
        sla: "15 dias úteis",
        cost: 2100,
        marginPct: 0.57,
        floor: 3500,
        discountEligible: false,
        deliverables: [
          {
            title: "Técnico",
            items: [
              "Rastreamento completo do site — indexação, redirect, canonical, duplicidade, canibalização",
              "Core Web Vitals de campo e de laboratório",
              "Arquitetura de informação e estrutura de URL",
            ],
          },
          {
            title: "Demanda e concorrência",
            items: [
              "Pesquisa de palavra-chave: até 50 termos com intenção e dificuldade",
              "Análise de 3 concorrentes na busca",
            ],
          },
          {
            title: "Camada de GEO",
            items: [
              "robots.txt e llms.txt",
              "Leitura por IA: ChatGPT, Perplexity, AI Overviews",
            ],
          },
          { title: "Fechamento", items: ["Plano priorizado", "Reunião de 1h"] },
        ],
      },
      {
        id: "seo-continuo",
        name: "SEO contínuo",
        kind: "recorrente",
        price: 3400,
        priceLabel: "R$ 3.400/mês",
        hours: 10,
        hoursLabel: "10h/mês",
        cost: 1500,
        marginPct: 0.56,
        floor: 2500,
        discountEligible: true,
        deliverables: [
          {
            title: "Volumes",
            items: [
              "Correções técnicas implementadas: até 3h/mês",
              "2 páginas existentes otimizadas por mês",
              "Pauta de conteúdo com palavra e intenção: mensal",
              "Monitoramento de posição: até 50 termos",
              "Relatório mensal",
              "1 reunião por mês",
            ],
          },
        ],
        rules: [
          "Em site mantido pela Vértice, a correção é implementada. Em site de terceiro, é entregue como especificação para o time do cliente — sem acesso não há implementação.",
        ],
        excludes: [
          "Redação de artigo. 10h/mês não escrevem artigo — é item separado (R$ 890/artigo)",
        ],
      },
      {
        id: "seo-artigo",
        name: "Artigo otimizado avulso",
        kind: "avulso",
        price: 890,
        priceLabel: "R$ 890",
        hours: 1.5,
        hoursLabel: "1,5h + R$ 200 de redação",
        sla: "5 dias úteis",
        cost: 425,
        marginPct: 0.52,
        floor: null,
        discountEligible: false,
        deliverables: [
          {
            title: "Escopo",
            items: [
              "1.200 a 1.500 palavras",
              "Pesquisa de intenção",
              "Estrutura otimizada",
              "Revisão humana",
              "Imagem de capa de banco",
              "1 rodada de ajuste",
              "Publicado, se o site for mantido pela Vértice",
            ],
          },
        ],
      },
      {
        id: "seo-pacote-artigos",
        name: "Pacote de 4 artigos/mês",
        kind: "recorrente",
        price: 2990,
        priceLabel: "R$ 2.990/mês",
        hours: 6,
        hoursLabel: "6h + R$ 800 de redação",
        cost: 1700,
        marginPct: 0.43,
        floor: null,
        discountEligible: false,
        deliverables: [
          {
            title: "Escopo",
            items: [
              "4 artigos no padrão do avulso",
              "Calendário aprovado no 1º dia útil do mês",
            ],
          },
        ],
        rules: [
          "Item de MENOR margem da casa (43%). Não é produto âncora — existe para o SEO contínuo ter o que otimizar.",
          "Fora do desconto de combinação: −15% aqui furaria o piso de 40%.",
        ],
      },
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    tagline: "A gestão mensal substitui a Gestão de Google Ads e a de Meta Ads — não se soma.",
    offers: [
      {
        id: "ecom-loja-enxuta",
        name: "Loja enxuta (até 50 produtos)",
        kind: "setup",
        price: 14900,
        priceLabel: "R$ 14.900",
        hours: 45,
        hoursLabel: "45h",
        sla: "30 dias úteis",
        cost: 6750,
        marginPct: 0.55,
        floor: null,
        discountEligible: false,
        deliverables: [
          {
            title: "Entregue",
            items: [
              "Plataforma definida no kickoff — licença por conta do cliente",
              "Até 50 produtos cadastrados a partir de planilha no modelo da Vértice",
              "Tema comercial customizado na identidade do cliente — não é tema do zero",
              "Meios de pagamento e regras de frete configurados",
              "5 páginas institucionais: sobre, trocas, entrega, privacidade, contato",
              "Checkout testado ponta a ponta com compra real",
            ],
          },
        ],
      },
      {
        id: "ecom-loja-completa",
        name: "Loja completa (até 300 produtos)",
        kind: "setup",
        price: 29900,
        priceLabel: "R$ 29.900",
        hours: 90,
        hoursLabel: "90h",
        sla: "45 dias úteis",
        cost: 13500,
        marginPct: 0.55,
        floor: 22500,
        discountEligible: false,
        deliverables: [
          {
            title: "Tudo da loja enxuta, mais",
            items: [
              "Catálogo com variações, filtros e busca — até 300 produtos",
              "Integração com ERP ou hub de marketplace — 1 sistema, com API documentada",
              "Cupom, frete grátis condicional e regras promocionais",
              "E-mails transacionais na identidade da marca",
              "Migração de catálogo da plataforma anterior",
            ],
          },
        ],
      },
      {
        id: "ecom-tracking",
        name: "Setup de rastreamento e feed",
        kind: "setup",
        price: 3400,
        priceLabel: "R$ 3.400",
        hours: 10,
        hoursLabel: "10h",
        sla: "10 dias úteis",
        cost: 1500,
        marginPct: 0.56,
        floor: null,
        discountEligible: false,
        deliverables: [
          {
            title: "Entregue",
            items: [
              "GA4 de e-commerce com o funil completo: view_item → purchase",
              "Google Merchant Center com feed aprovado",
              "Meta Catalog + API de Conversões",
              "Consent Mode",
              "Conferência de divergência entre plataforma de anúncio e loja",
            ],
          },
        ],
      },
      {
        id: "ecom-gestao",
        name: "Gestão mensal",
        kind: "recorrente",
        price: 7900,
        priceLabel: "R$ 7.900/mês",
        hours: 24,
        hoursLabel: "24h/mês",
        cost: 3600,
        marginPct: 0.54,
        floor: 6000,
        discountEligible: true,
        hourBudget: "Tráfego 10h · CRO 4h · e-mail 4h · feed 3h · reuniões e relatório 3h",
        deliverables: [
          {
            title: "Tráfego",
            items: [
              "Google (Shopping + Search) e Meta operados diariamente — já inclusos, não se soma à Gestão de Google Ads nem à de Meta Ads",
            ],
          },
          {
            title: "Feed",
            items: ["Saúde do catálogo revisada semanalmente", "Reprovações corrigidas"],
          },
          { title: "CRO", items: ["1 teste estruturado por mês, com leitura de resultado"] },
          {
            title: "E-mail",
            items: [
              "Até 4 campanhas por mês",
              "3 fluxos ativos: carrinho, boas-vindas, pós-compra",
            ],
          },
          { title: "Ritmo", items: ["Reunião quinzenal", "Relatório mensal"] },
        ],
      },
    ],
  },
];

/** Regras que valem para todo contrato (ENTREGAVEIS §0). */
export const CROSS_RULES = {
  vertice: [
    ["Responsável nomeado", "Um operador sênior com nome e rosto, não fila de atendimento"],
    [
      "Canal oficial",
      "Grupo de WhatsApp do projeto + e-mail. Mensagem no privado não gera registro nem prazo",
    ],
    ["Horário", "Segunda a sexta, 9h–18h, exceto feriados nacionais"],
    ["Primeira resposta", "1 dia útil"],
    [
      "Urgência",
      "4 horas úteis — site fora do ar, conta suspensa, campanha reprovada, CRM inacessível, cobrança indevida",
    ],
    ["Relatório mensal", "Até o 5º dia útil do mês seguinte"],
    [
      "Reuniões",
      "Agendadas com 3 dias úteis de antecedência, com pauta antes e resumo escrito depois",
    ],
    ["Acessos e ativos", "Todas as contas em nome do cliente. A Vértice entra como usuária"],
    ["Saída", "Acessos devolvidos e dados exportados em até 5 dias úteis do encerramento"],
  ] as [string, string][],
  cliente: [
    "Um responsável único com poder de aprovar — aprovação por comitê sem dono é o que mais atrasa projeto",
    "Acessos administrativos solicitados no kickoff",
    "Aprovações em até 5 dias úteis",
    "Material bruto (logo em vetor, fotos, catálogo, dados) no formato pedido",
  ],
  neverIncluded: [
    "Verba de mídia",
    "Licenças de terceiros — plataforma de loja, ferramenta de e-mail, banco de imagens, domínio, plugins pagos",
    "Produção de vídeo, fotografia, locução e animação",
    "Criação de identidade visual e manual de marca",
    "Gestão de redes sociais orgânicas",
    "Atendimento e qualificação de lead (SDR)",
    "Assessoria de imprensa",
    "Influenciador",
    "Suporte a sistema de terceiros que a Vértice não implantou",
  ],
  revisions:
    "Todo entregável de criação inclui 2 rodadas de revisão. A partir da 3ª: R$ 350/h. A revisão vale para ajuste do que foi pedido no briefing — mudança de direção depois do aceite é escopo novo.",
};

/** Gatilhos de escopo extra (ENTREGAVEIS §8). */
export const SCOPE_TRIGGERS: [string, string][] = [
  ["3ª rodada de revisão em diante", "R$ 350/h"],
  ["Criativo em vídeo, foto ou locução", "Orçamento à parte"],
  ["Landing page pedida dentro de contrato de Google Ads ou Meta Ads", "R$ 5.900"],
  ["Novo canal de mídia", "R$ 1.200/mês"],
  ["Automação de CRM além da 5ª (ou da 1h/mês)", "R$ 350/h"],
  ["Integração com um 2º sistema", "R$ 4.900"],
  ["Alteração de site sem plano de manutenção contratado", "R$ 700 por chamado (mín. 2h)"],
  ["Alteração de site acima de 2h/mês", "R$ 350/h"],
  ["Banner com arte criada pela Vértice", "R$ 450/peça"],
  ["Redação de artigo pedida dentro do SEO contínuo", "R$ 890/artigo"],
  ["Reunião extra fora da cadência contratada", "R$ 450/h"],
  ["Execução pedida dentro de contrato de consultoria", "Migra para Gestão de Google Ads ou de Meta Ads"],
  ["Treinamento adicional de equipe", "R$ 450/h"],
  ["Recuperação de conta suspensa por ato do cliente", "R$ 350/h"],
];

/** Capacidade e contrato (PRECIFICACAO §9 e §10). */
export const BILLABLE_HOURS_PER_OPERATOR = 112;
export const OPERATOR_CEILING = 38620;

export const CONTRACT_RULES = [
  "Recorrentes: 6 meses, saída com 30 dias de aviso a partir do 3º mês. Tráfego com menos de 90 dias não gera dado para decidir nada.",
  "CRM e manutenção de site: mensal, sem fidelidade — são serviços de sustentação, prender contrato aqui só gera atrito.",
  "Reajuste anual: IPCA + 3%.",
  "Escopo extra: R$ 350/h (execução) ou R$ 450/h (consultoria), sempre aprovado por escrito antes.",
  "Setup e projeto nunca entram em desconto — é onde a margem paga o mês 1.",
  "Desconto adicional só contra 12 meses pré-pago, e no máximo 10% além da tabela.",
];

export const ALL_OFFERS: Offer[] = SERVICES.flatMap((s) => s.offers);

export function findOffer(id: string): Offer | undefined {
  return ALL_OFFERS.find((o) => o.id === id);
}

export function serviceOf(offerId: string): Service | undefined {
  return SERVICES.find((s) => s.offers.some((o) => o.id === offerId));
}

/** Desconto de combinação (PRECIFICACAO §8): só nas mensalidades elegíveis. */
export function combinationDiscount(eligibleRecurringCount: number): number {
  if (eligibleRecurringCount >= 3) return 0.15;
  if (eligibleRecurringCount === 2) return 0.1;
  return 0;
}

/**
 * Faixa de leitura de uma margem. Uma definição só — antes cada tela tinha a
 * sua e a mesma margem de 54% aparecia como normal na tabela e como alerta no
 * simulador. 54% é preço de tabela em cinco itens: alertar nele é ruído.
 */
export function marginBand(margin: number): "furou" | "atencao" | "ok" {
  if (margin < MARGIN_FLOOR) return "furou";
  if (margin < MARGIN_TARGET - 0.02) return "atencao";
  return "ok";
}

export function brl(value: number): string {
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
