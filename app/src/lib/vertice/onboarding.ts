/**
 * Checklists de onboarding — um por serviço.
 *
 * `blocking: true` = item de entrada. Enquanto ele não fecha, **o relógio de
 * prazo não começa** (regra transversal do ENTREGAVEIS.md). É o que segura o
 * "atrasou por nossa culpa" no terceiro mês.
 *
 * Os `id` são estáveis e vão para o banco (onboarding_progress.item_id).
 * NUNCA renomear um id existente — renomear = perder o progresso gravado.
 * Item que sai de escopo: apagar a linha; item novo: id novo no fim da fase.
 */

export type ItemOwner = "vertice" | "cliente";

export type ChecklistItem = {
  id: string;
  label: string;
  owner: ItemOwner;
  detail?: string;
  /** Trava o início do prazo contratado. */
  blocking?: boolean;
};

export type ChecklistPhase = {
  id: string;
  title: string;
  when: string;
  items: ChecklistItem[];
};

/** Fase que abre todo contrato, igual para todos os serviços. */
const BASE_PHASE: ChecklistPhase = {
  id: "base",
  title: "Contrato e abertura",
  when: "Antes de qualquer execução",
  items: [
    {
      id: "base-contrato",
      label: "Contrato assinado com o ENTREGAVEIS.md anexado como escopo",
      owner: "vertice",
      detail: "O que não está no anexo não está contratado. É o que sustenta o preço da tabela.",
      blocking: true,
    },
    {
      id: "base-responsavel",
      label: "Responsável único nomeado, com poder de aprovar",
      owner: "cliente",
      detail: "Aprovação por comitê sem dono é o que mais atrasa projeto.",
      blocking: true,
    },
    {
      id: "base-canal",
      label: "Grupo de WhatsApp do projeto criado + e-mail oficial definido",
      owner: "vertice",
      detail: "Mensagem no privado não gera registro nem prazo — dito ao cliente na abertura.",
    },
    {
      id: "base-operador",
      label: "Operador sênior responsável apresentado por nome",
      owner: "vertice",
    },
    {
      id: "base-cobranca",
      label: "Primeira cobrança emitida e paga",
      owner: "vertice",
      blocking: true,
    },
    {
      id: "base-sla",
      label: "SLA comunicado por escrito: 1 dia útil normal, 4h úteis para urgência",
      owner: "vertice",
    },
    {
      id: "base-aniversario",
      label: "Data de aniversário do contrato e da renovação registrada",
      owner: "vertice",
      detail: "Recorrente é 6 meses; reajuste anual IPCA + 3%.",
    },
  ],
};

/**
 * Google Ads e Meta Ads têm o mesmo ritmo de onboarding: só mudam os acessos,
 * a tag e a forma de montar o público. O resto é o mesmo item com o mesmo id —
 * o progresso é gravado por serviço, então repetir o id nos dois não colide.
 */
function trafegoPhases(p: {
  acessos: ChecklistItem[];
  rastreamento: ChecklistItem[];
  publicos: ChecklistItem;
}): ChecklistPhase[] {
  return [
    BASE_PHASE,
    {
      id: "traf-entrada",
      title: "Acessos e informações de entrada",
      when: "Antes do kickoff — trava o prazo de 10 dias úteis",
      items: [
        ...p.acessos,
        {
          id: "traf-site-acesso",
          label: "Acesso ao site para instalar a tag — ou contato do dev responsável",
          owner: "cliente",
          blocking: true,
        },
        {
          id: "traf-verba",
          label: "Verba mensal definida e cartão cadastrado nas contas do próprio cliente",
          owner: "cliente",
          detail: "A verba nunca passa pelo caixa da Vértice. Tratar verba como receita destrói a leitura de margem.",
          blocking: true,
        },
        {
          id: "traf-oferta",
          label: "Oferta, ticket médio, margem e regiões atendidas informados",
          owner: "cliente",
          blocking: true,
        },
        {
          id: "traf-concorrentes",
          label: "3 concorrentes diretos nomeados pelo cliente",
          owner: "cliente",
        },
        {
          id: "traf-faixa",
          label: "Faixa de verba confirmada e registrada (define preço e cadência)",
          owner: "vertice",
          blocking: true,
        },
      ],
    },
    {
      id: "traf-kickoff",
      title: "Kickoff (1h, gravada)",
      when: "Dia 1 após o checklist de entrada fechar",
      items: [
        { id: "traf-kickoff-reuniao", label: "Reunião de kickoff realizada e gravada", owner: "vertice" },
        {
          id: "traf-evento-valor",
          label: "Evento de valor definido e escrito — o que conta como conversão",
          owner: "vertice",
          blocking: true,
        },
        {
          id: "traf-funil",
          label: "Funil de vendas atual mapeado: quem atende o lead e em quanto tempo",
          owner: "vertice",
        },
        {
          id: "traf-lead-bom",
          label: "Definição de 'lead bom' acordada por escrito com o cliente",
          owner: "vertice",
          detail: "Sem isso, mês 3 vira discussão sobre qualidade de lead sem critério.",
        },
        {
          id: "traf-expectativa",
          label: "Expectativa de prazo comunicada por escrito: mês 1 implantação, mês 2 aprendizado, mês 3 leitura confiável",
          owner: "vertice",
          detail: "Nenhuma meta de venda é prometida antes do mês 3.",
        },
      ],
    },
    {
      id: "traf-rastreamento",
      title: "Rastreamento",
      when: "Dias 2 a 6",
      items: [
        ...p.rastreamento,
        {
          id: "traf-crm-offline",
          label: "Conexão com o CRM Vértice para conversão offline (lead → venda)",
          owner: "vertice",
          detail: "Só quando o CRM está contratado.",
        },
        {
          id: "traf-teste-ponta",
          label: "Teste de ponta a ponta: lead de teste chega no CRM e a conversão aparece na plataforma",
          owner: "vertice",
          detail: "Sem esse teste passando, não se sobe campanha.",
          blocking: true,
        },
      ],
    },
    {
      id: "traf-estrutura",
      title: "Estrutura e criativo",
      when: "Dias 5 a 9",
      items: [
        { id: "traf-auditoria", label: "Auditoria escrita da estrutura atual entregue", owner: "vertice" },
        {
          id: "traf-estrutura-doc",
          label: "Estrutura de campanhas, conjuntos e anúncios documentada",
          owner: "vertice",
        },
        {
          id: "traf-copies",
          label: "Primeiros textos de anúncio escritos e aprovados",
          owner: "vertice",
          detail: "2 rodadas de revisão inclusas. Da 3ª em diante: R$ 350/h.",
        },
        {
          id: "traf-pecas",
          label: "Peças estáticas adaptadas a partir do material que o cliente já tem",
          owner: "vertice",
          detail: "Criação de peça do zero, vídeo e locução são escopo extra.",
        },
        p.publicos,
      ],
    },
    {
      id: "traf-golive",
      title: "Go-live e ritmo",
      when: "Dia 10",
      items: [
        { id: "traf-orcamento", label: "Orçamento diário configurado dentro da faixa contratada", owner: "vertice" },
        { id: "traf-campanhas-ar", label: "Primeira leva de anúncios no ar", owner: "vertice" },
        { id: "traf-looker", label: "Painel em Looker Studio no ar, atualizando sozinho", owner: "vertice" },
        { id: "traf-entrega-reuniao", label: "Reunião de entrega da estrutura (1h) realizada e gravada", owner: "vertice" },
        {
          id: "traf-cadencia",
          label: "Cadência da faixa agendada no calendário: dias de reunião e data do relatório",
          owner: "vertice",
          detail: "Relatório mensal até o 5º dia útil do mês seguinte.",
        },
        {
          id: "traf-performance",
          label: "Camada de performance avaliada — só oferecer com rastreamento limpo ponta a ponta",
          owner: "vertice",
          detail: "Bônus sobre número duvidoso queima a relação no terceiro mês. Opcional.",
        },
      ],
    },
  ];
}

export const ONBOARDING: Record<string, ChecklistPhase[]> = {
  "google-ads": trafegoPhases({
    acessos: [
      {
        id: "traf-ads-acesso",
        label: "Acesso administrador ao Google Ads (ID da conta) ou conta criada no nome do cliente",
        owner: "cliente",
        blocking: true,
      },
      {
        id: "traf-ga4-acesso",
        label: "Acesso de editar/publicar no GA4 e no Google Tag Manager",
        owner: "cliente",
        blocking: true,
      },
    ],
    rastreamento: [
      { id: "traf-ga4", label: "GA4 instalado, configurado e vinculado ao Google Ads", owner: "vertice" },
      { id: "traf-gtm", label: "GTM publicado com os disparos documentados", owner: "vertice" },
      {
        id: "traf-conv-import",
        label: "Conversões importadas no Google Ads e marcadas como primárias",
        owner: "vertice",
      },
    ],
    publicos: {
      id: "traf-publicos",
      label: "Palavras-chave, públicos e lista inicial de negativação montados",
      owner: "vertice",
    },
  }),

  "meta-ads": trafegoPhases({
    acessos: [
      {
        id: "traf-meta-acesso",
        label: "Acesso ao Meta Business Manager por solicitação de parceria (ID do BM)",
        owner: "cliente",
        blocking: true,
      },
      {
        id: "traf-gtm-acesso",
        label: "Acesso de editar/publicar no Google Tag Manager",
        owner: "cliente",
        blocking: true,
      },
      {
        id: "traf-dns",
        label: "DNS liberado para verificação de domínio no Meta",
        owner: "cliente",
        detail: "Sem isso a verificação de domínio fica fora do escopo entregue.",
      },
    ],
    rastreamento: [
      { id: "traf-gtm", label: "GTM publicado com os disparos documentados", owner: "vertice" },
      { id: "traf-pixel", label: "Meta Pixel + API de Conversões ativos", owner: "vertice" },
      { id: "traf-dominio", label: "Domínio verificado no Meta", owner: "vertice" },
    ],
    publicos: {
      id: "traf-publicos",
      label: "Públicos iniciais e exclusões montados",
      owner: "vertice",
    },
  }),

  crm: [
    BASE_PHASE,
    {
      id: "crm-entrada",
      title: "Acessos e informações de entrada",
      when: "Antes do kickoff — trava o prazo de 15 dias úteis",
      items: [
        {
          id: "crm-usuarios",
          label: "Lista de usuários com nome, e-mail e papel (até 5 na licença base)",
          owner: "cliente",
          blocking: true,
        },
        {
          id: "crm-funil-atual",
          label: "Funil atual descrito como é de verdade, não como está no papel",
          owner: "cliente",
          blocking: true,
        },
        {
          id: "crm-motivos-perda",
          label: "Motivos de perda usados hoje pela equipe de vendas",
          owner: "cliente",
        },
        {
          id: "crm-base",
          label: "Base atual exportada na planilha modelo da Vértice — até 5.000 registros",
          owner: "cliente",
          detail: "1 importação inclusa. Fora do modelo, volta para o cliente ajustar.",
          blocking: true,
        },
        {
          id: "crm-canais",
          label: "Canais de captação em uso listados (site, Meta, Google, WhatsApp, indicação)",
          owner: "cliente",
          blocking: true,
        },
        {
          id: "crm-whatsapp",
          label: "Número de WhatsApp do comercial e quem responde por ele",
          owner: "cliente",
        },
        {
          id: "crm-acesso-ads",
          label: "Acesso ao Meta Lead Ads e ao Google Ads para conectar os formulários",
          owner: "cliente",
        },
      ],
    },
    {
      id: "crm-desenho",
      title: "Descoberta e desenho",
      when: "Dias 1 a 4",
      items: [
        { id: "crm-descoberta", label: "Reunião de descoberta realizada", owner: "vertice" },
        {
          id: "crm-funil-aprovado",
          label: "Funil desenhado e aprovado por escrito pelo responsável",
          owner: "vertice",
          blocking: true,
        },
        { id: "crm-campos", label: "Campos personalizados definidos", owner: "vertice" },
        { id: "crm-perda-def", label: "Motivos de perda definidos", owner: "vertice" },
        {
          id: "crm-distribuicao",
          label: "Regra de distribuição de lead definida (rodízio, região, produto)",
          owner: "vertice",
        },
        {
          id: "crm-sla-interno",
          label: "SLA interno de primeiro contato acordado com o cliente",
          owner: "cliente",
          detail: "Lead que ninguém atende em 1h não é problema de CRM — e precisa estar dito antes.",
        },
      ],
    },
    {
      id: "crm-config",
      title: "Configuração",
      when: "Dias 4 a 9",
      items: [
        { id: "crm-etapas", label: "Etapas criadas na plataforma", owner: "vertice" },
        { id: "crm-campos-criados", label: "Campos personalizados criados", owner: "vertice" },
        { id: "crm-usuarios-criados", label: "Usuários criados com as permissões corretas", owner: "vertice" },
        { id: "crm-auto-1", label: "Automação 1 · distribuição de lead", owner: "vertice" },
        { id: "crm-auto-2", label: "Automação 2 · alerta de lead novo", owner: "vertice" },
        { id: "crm-auto-3", label: "Automação 3 · lembrete de follow-up", owner: "vertice" },
        { id: "crm-auto-4", label: "Automação 4 · aviso de lead parado", owner: "vertice" },
        { id: "crm-auto-5", label: "Automação 5 · notificação de fechamento", owner: "vertice" },
        {
          id: "crm-auto-limite",
          label: "Cliente avisado por escrito: automação além da 5ª é R$ 350/h",
          owner: "vertice",
        },
      ],
    },
    {
      id: "crm-captacao",
      title: "Captação conectada",
      when: "Dias 8 a 12",
      items: [
        { id: "crm-form-site", label: "Formulários do site conectados", owner: "vertice" },
        { id: "crm-meta-lead", label: "Meta Lead Ads conectado", owner: "vertice" },
        { id: "crm-google-lead", label: "Google Lead Form conectado", owner: "vertice" },
        { id: "crm-wpp-conectado", label: "WhatsApp conectado", owner: "vertice" },
        {
          id: "crm-teste-canais",
          label: "Teste de ponta a ponta em cada canal: lead entra, distribui e alerta",
          owner: "vertice",
          blocking: true,
        },
      ],
    },
    {
      id: "crm-importacao",
      title: "Importação da base",
      when: "Dias 10 a 13",
      items: [
        { id: "crm-planilha-valida", label: "Planilha validada contra o modelo", owner: "vertice" },
        { id: "crm-dedup", label: "Duplicidade conferida antes de importar", owner: "vertice" },
        { id: "crm-import-exec", label: "Importação executada", owner: "vertice" },
        {
          id: "crm-import-confere",
          label: "Contagem final conferida com o cliente e registrada",
          owner: "vertice",
        },
      ],
    },
    {
      id: "crm-adocao",
      title: "Treinamento e adoção",
      when: "Dia 15 + 30 dias",
      items: [
        { id: "crm-treino-1", label: "Sessão de treinamento 1 (1h) realizada e gravada", owner: "vertice" },
        { id: "crm-treino-2", label: "Sessão de treinamento 2 (1h) realizada e gravada", owner: "vertice" },
        { id: "crm-guia", label: "Guia de 1 página entregue", owner: "vertice" },
        {
          id: "crm-adocao-check",
          label: "Checagem de adoção: os leads estão sendo movidos de etapa de verdade?",
          owner: "vertice",
          detail: "CRM que ninguém usa não prende cliente nenhum.",
        },
        { id: "crm-ajuste-fino", label: "Ajuste fino dos 30 dias concluído", owner: "vertice" },
      ],
    },
  ],

  consultoria: [
    BASE_PHASE,
    {
      id: "cons-fronteira",
      title: "Fronteira do serviço",
      when: "Antes de qualquer acesso",
      items: [
        {
          id: "cons-nao-opera",
          label: "Escrito e confirmado com o cliente: a Vértice analisa e orienta, não opera",
          owner: "vertice",
          detail: "Vender consultoria e acabar executando de graça é o jeito mais rápido de zerar a margem de 62%.",
          blocking: true,
        },
        {
          id: "cons-leitura",
          label: "Todos os acessos concedidos como somente leitura",
          owner: "cliente",
          blocking: true,
        },
        {
          id: "cons-executor",
          label: "Quem executa do lado do cliente está nomeado",
          owner: "cliente",
          detail: "Sem executor nomeado, o plano não sai do PDF e a culpa cai na consultoria.",
          blocking: true,
        },
      ],
    },
    {
      id: "cons-entrada",
      title: "Acessos e dados de entrada",
      when: "Antes de começar — trava o prazo de 15 dias úteis",
      items: [
        { id: "cons-ads-leitura", label: "Google Ads (leitura)", owner: "cliente", blocking: true },
        { id: "cons-meta-leitura", label: "Meta Ads / Business Manager (leitura)", owner: "cliente", blocking: true },
        { id: "cons-ga4-leitura", label: "GA4 (leitura)", owner: "cliente", blocking: true },
        { id: "cons-gsc-leitura", label: "Google Search Console (leitura)", owner: "cliente" },
        {
          id: "cons-vendas",
          label: "Dados de venda dos últimos 12 meses (CRM ou planilha)",
          owner: "cliente",
          detail: "Sem dado de venda, a auditoria vira leitura de métrica de plataforma.",
          blocking: true,
        },
        { id: "cons-ticket", label: "Ticket médio, margem e ciclo de venda informados", owner: "cliente", blocking: true },
        { id: "cons-concorrentes", label: "3 concorrentes diretos nomeados", owner: "cliente" },
        { id: "cons-tentado", label: "Histórico do que já foi tentado e não funcionou", owner: "cliente" },
      ],
    },
    {
      id: "cons-analise",
      title: "Análise",
      when: "Dias 1 a 10",
      items: [
        { id: "cons-aud-midia", label: "Auditoria das contas de mídia", owner: "vertice" },
        { id: "cons-aud-track", label: "Auditoria do rastreamento", owner: "vertice" },
        { id: "cons-aud-funil", label: "Auditoria do funil de vendas", owner: "vertice" },
        { id: "cons-conc-leitura", label: "Leitura dos 3 concorrentes diretos", owner: "vertice" },
        {
          id: "cons-evidencia",
          label: "Cada achado com evidência anexada — print, número ou link",
          owner: "vertice",
          detail: "Achado sem evidência é opinião, e opinião não sustenta R$ 4.900.",
          blocking: true,
        },
      ],
    },
    {
      id: "cons-entrega",
      title: "Entrega",
      when: "Dias 11 a 15",
      items: [
        { id: "cons-plano", label: "Plano de ação priorizado por esforço × impacto", owner: "vertice" },
        { id: "cons-responsavel-item", label: "Responsável sugerido em cada item do plano", owner: "vertice" },
        { id: "cons-apresentacao", label: "Reunião de apresentação (90min) realizada e gravada", owner: "vertice" },
        {
          id: "cons-duvidas",
          label: "Rodada de dúvidas por escrito aberta — válida por 30 dias",
          owner: "vertice",
        },
      ],
    },
    {
      id: "cons-mensal",
      title: "Acompanhamento mensal (só quando contratado)",
      when: "A partir do mês 1 do retainer",
      items: [
        {
          id: "cons-datas",
          label: "Duas datas quinzenais fixadas no calendário para os 6 meses",
          owner: "vertice",
        },
        { id: "cons-dashboard", label: "Dashboard construído e validado com o cliente", owner: "vertice" },
        { id: "cons-plano-mes", label: "Plano do mês 1 entregue por escrito", owner: "vertice" },
        {
          id: "cons-gatilho-execucao",
          label: "Gatilho registrado: se pedirem execução, migra para Gestão de Google Ads ou de Meta Ads",
          owner: "vertice",
        },
      ],
    },
  ],

  sites: [
    BASE_PHASE,
    {
      id: "site-entrada",
      title: "Material e acessos de entrada",
      when: "Cliente tem 5 dias — trava o prazo de entrega",
      items: [
        {
          id: "site-logo",
          label: "Logo em vetor (.ai, .svg ou .eps)",
          owner: "cliente",
          detail: "PNG de 400px não serve. Layout não começa sem vetor.",
          blocking: true,
        },
        { id: "site-manual", label: "Manual de marca, se existir", owner: "cliente" },
        { id: "site-fotos", label: "Fotos em alta resolução", owner: "cliente", blocking: true },
        {
          id: "site-dados",
          label: "Dados de contato completos: endereço, telefone, WhatsApp, e-mail, CNPJ, horário",
          owner: "cliente",
          blocking: true,
        },
        { id: "site-material", label: "Material atual (site antigo, catálogo, apresentação)", owner: "cliente" },
        {
          id: "site-dominio",
          label: "Acesso ao registrador do domínio",
          owner: "cliente",
          blocking: true,
        },
        { id: "site-hosp-atual", label: "Acesso à hospedagem atual, quando há site no ar", owner: "cliente" },
        { id: "site-referencias", label: "3 referências visuais de sites que o cliente gosta", owner: "cliente" },
        {
          id: "site-marca-aviso",
          label: "Cliente avisado: criação de identidade visual e manual de marca não está inclusa",
          owner: "vertice",
        },
      ],
    },
    {
      id: "site-briefing",
      title: "Briefing (1h)",
      when: "Dia 1",
      items: [
        { id: "site-brief-reuniao", label: "Briefing de 1h realizado", owner: "vertice" },
        { id: "site-publico", label: "Público-alvo e objeção principal definidos", owner: "vertice", blocking: true },
        { id: "site-oferta", label: "Oferta e proposta de valor escritas", owner: "vertice", blocking: true },
        {
          id: "site-prova",
          label: "Prova social disponível levantada: depoimento, número, caso, logo de cliente",
          owner: "cliente",
        },
        {
          id: "site-cta",
          label: "CTA único definido e o que conta como conversão",
          owner: "vertice",
          blocking: true,
        },
      ],
    },
    {
      id: "site-criacao",
      title: "Copy e layout",
      when: "Dias 2 a 8",
      items: [
        { id: "site-copy", label: "Copy de conversão escrita pela Vértice", owner: "vertice" },
        { id: "site-copy-aprov", label: "Copy aprovada — rodada de revisão 1", owner: "cliente" },
        { id: "site-layout", label: "Layout apresentado sobre a identidade existente", owner: "vertice" },
        { id: "site-layout-aprov", label: "Layout aprovado — rodada de revisão 2", owner: "cliente" },
        {
          id: "site-revisao-aviso",
          label: "Cliente avisado por escrito: da 3ª rodada em diante é R$ 350/h",
          owner: "vertice",
          detail: "Mudança de direção depois do aceite é escopo novo, não revisão.",
        },
      ],
    },
    {
      id: "site-build",
      title: "Construção",
      when: "Dias 8 a 13",
      items: [
        { id: "site-secoes", label: "Seções construídas dentro do limite contratado", owner: "vertice" },
        { id: "site-responsivo", label: "Responsivo testado em 3 larguras", owner: "vertice" },
        {
          id: "site-form-crm",
          label: "Formulário integrado ao CRM Vértice — ou e-mail, quando não há CRM",
          owner: "vertice",
        },
        { id: "site-ga4-gtm", label: "GA4 e Tag Manager instalados com a conversão configurada", owner: "vertice" },
        {
          id: "site-seo",
          label: "SEO on-page: title, meta, headings, dados estruturados, sitemap, robots",
          owner: "vertice",
        },
        {
          id: "site-301",
          label: "Redirecionamentos 301 do site antigo mapeados (institucional, quando há site anterior)",
          owner: "vertice",
        },
      ],
    },
    {
      id: "site-medicao",
      title: "Medição antes de entregar",
      when: "Dia 14 — sem isso não se diz que está pronto",
      items: [
        {
          id: "site-lcp",
          label: "LCP abaixo de 2,5s medido, com print anexado",
          owner: "vertice",
          detail: "Está no contrato como número. Entregar sem medir é prometer no escuro.",
          blocking: true,
        },
        {
          id: "site-lighthouse",
          label: "Lighthouse de performance ≥ 90 no mobile, com print anexado",
          owner: "vertice",
          blocking: true,
        },
        { id: "site-console", label: "Console do navegador limpo de erro", owner: "vertice" },
        { id: "site-teclado", label: "Passagem de teclado nos formulários e no menu", owner: "vertice" },
        { id: "site-form-teste", label: "Formulário testado: lead de teste chega no destino", owner: "vertice", blocking: true },
      ],
    },
    {
      id: "site-publicacao",
      title: "Publicação e entrega",
      when: "Dia 15",
      items: [
        { id: "site-dominio-apontado", label: "Domínio apontado", owner: "vertice" },
        { id: "site-ssl", label: "SSL ativo", owner: "vertice" },
        { id: "site-301-ativo", label: "301 do site antigo no ar, quando havia site", owner: "vertice" },
        {
          id: "site-treino",
          label: "Treinamento de 1h para publicar conteúdo (site institucional)",
          owner: "vertice",
        },
        {
          id: "site-acessos-cliente",
          label: "Acessos de administrador entregues em nome do cliente",
          owner: "vertice",
        },
        {
          id: "site-manutencao-oferta",
          label: "Manutenção mensal (R$ 690) apresentada — hospedagem, backup, 2h de alteração",
          owner: "vertice",
          detail: "Site entregue sem plano de manutenção volta como pedido avulso e come hora não faturada.",
        },
      ],
    },
  ],

  seo: [
    BASE_PHASE,
    {
      id: "seo-entrada",
      title: "Acessos e informações de entrada",
      when: "Antes de começar — trava o prazo de 15 dias úteis",
      items: [
        {
          id: "seo-gsc",
          label: "Google Search Console com permissão de proprietário ou completa",
          owner: "cliente",
          blocking: true,
        },
        { id: "seo-ga4", label: "GA4 (leitura)", owner: "cliente", blocking: true },
        {
          id: "seo-cms",
          label: "Acesso ao CMS — obrigatório só se a Vértice for implementar as correções",
          owner: "cliente",
        },
        {
          id: "seo-quem-mantem",
          label: "Definido quem mantém o site: Vértice implementa, ou terceiro recebe especificação",
          owner: "vertice",
          detail: "Em site de terceiro, sem acesso não há implementação — só especificação.",
          blocking: true,
        },
        {
          id: "seo-servicos",
          label: "Lista de serviços e produtos com o nome comercial que o cliente usa",
          owner: "cliente",
          blocking: true,
        },
        { id: "seo-regioes", label: "Regiões atendidas informadas", owner: "cliente", blocking: true },
        { id: "seo-concorrentes", label: "3 concorrentes de busca nomeados", owner: "cliente" },
      ],
    },
    {
      id: "seo-expectativa",
      title: "Expectativa alinhada por escrito",
      when: "Antes do diagnóstico",
      items: [
        {
          id: "seo-sem-promessa",
          label: "Registrado: nenhuma posição é prometida",
          owner: "vertice",
          blocking: true,
        },
        {
          id: "seo-prazo-real",
          label: "Registrado: o primeiro movimento sério costuma aparecer entre o 4º e o 6º mês",
          owner: "vertice",
        },
        {
          id: "seo-artigo-fora",
          label: "Registrado: redação de artigo NÃO está inclusa no SEO contínuo (R$ 890/artigo)",
          owner: "vertice",
          detail: "10h/mês não escrevem artigo. É o mal-entendido mais caro desse serviço.",
          blocking: true,
        },
      ],
    },
    {
      id: "seo-diagnostico",
      title: "Diagnóstico técnico",
      when: "Dias 1 a 12",
      items: [
        {
          id: "seo-crawl",
          label: "Rastreamento completo: indexação, redirect, canonical, duplicidade, canibalização",
          owner: "vertice",
        },
        { id: "seo-cwv", label: "Core Web Vitals de campo e de laboratório", owner: "vertice" },
        { id: "seo-ia-url", label: "Arquitetura de informação e estrutura de URL avaliadas", owner: "vertice" },
        {
          id: "seo-keywords",
          label: "Pesquisa de palavra-chave: até 50 termos com intenção e dificuldade",
          owner: "vertice",
        },
        { id: "seo-conc-busca", label: "Análise dos 3 concorrentes na busca", owner: "vertice" },
        { id: "seo-robots", label: "robots.txt e llms.txt revisados ou criados", owner: "vertice" },
        {
          id: "seo-teste-ia",
          label: "Leitura por IA testada: ChatGPT, Perplexity e AI Overviews",
          owner: "vertice",
        },
        { id: "seo-plano", label: "Plano priorizado entregue", owner: "vertice" },
        { id: "seo-reuniao", label: "Reunião de 1h realizada", owner: "vertice" },
      ],
    },
    {
      id: "seo-continuo",
      title: "SEO contínuo · mês 1 (só quando contratado)",
      when: "Primeiro mês do retainer",
      items: [
        {
          id: "seo-fila",
          label: "Fila técnica priorizada dentro das 3h/mês de correção",
          owner: "vertice",
        },
        { id: "seo-2-paginas", label: "As 2 páginas do mês escolhidas e otimizadas", owner: "vertice" },
        { id: "seo-pauta", label: "Pauta de conteúdo do mês aprovada, com palavra e intenção", owner: "vertice" },
        { id: "seo-monitor", label: "50 termos no monitoramento de posição", owner: "vertice" },
        { id: "seo-data-reuniao", label: "Data fixa da reunião mensal no calendário", owner: "vertice" },
        {
          id: "seo-conteudo-oferta",
          label: "Pacote de conteúdo apresentado se o cliente quer artigo (R$ 2.990/mês por 4)",
          owner: "vertice",
          detail: "Menor margem da casa (43%). Não entra no desconto de combinação.",
        },
      ],
    },
  ],

  ecommerce: [
    BASE_PHASE,
    {
      id: "ecom-entrada",
      title: "Plataforma, catálogo e acessos",
      when: "Antes do kickoff — trava o prazo (30 ou 45 dias úteis)",
      items: [
        {
          id: "ecom-plataforma",
          label: "Plataforma escolhida e licença paga pelo cliente",
          owner: "cliente",
          detail: "Licença de terceiro nunca está inclusa em nenhum serviço.",
          blocking: true,
        },
        {
          id: "ecom-catalogo",
          label: "Catálogo na planilha modelo: SKU, preço, peso, dimensão, variação, descrição",
          owner: "cliente",
          detail: "É o item que mais atrasa loja. 50 produtos na enxuta, 300 na completa.",
          blocking: true,
        },
        { id: "ecom-fotos", label: "Fotos de produto em alta resolução", owner: "cliente", blocking: true },
        {
          id: "ecom-pagamento",
          label: "Conta de pagamento aprovada no gateway ou adquirente",
          owner: "cliente",
          detail: "Aprovação de gateway pode levar dias e não está sob controle da Vértice.",
          blocking: true,
        },
        { id: "ecom-frete", label: "Contrato de frete definido: Correios, transportadora ou tabela própria", owner: "cliente", blocking: true },
        { id: "ecom-trocas", label: "Regras de troca e devolução por escrito", owner: "cliente" },
        { id: "ecom-fiscal", label: "CNPJ e dados fiscais informados", owner: "cliente", blocking: true },
        {
          id: "ecom-api-erp",
          label: "Acesso ao ERP com API documentada — só na loja completa com integração",
          owner: "cliente",
          detail: "Sem API documentada não é este serviço: vira levantamento por hora.",
        },
        { id: "ecom-dominio", label: "Acesso ao registrador do domínio", owner: "cliente", blocking: true },
      ],
    },
    {
      id: "ecom-kickoff",
      title: "Kickoff",
      when: "Dia 1",
      items: [
        { id: "ecom-escopo-catalogo", label: "Limite de catálogo confirmado por escrito (50 ou 300 produtos)", owner: "vertice", blocking: true },
        { id: "ecom-regras-frete", label: "Regras de frete definidas", owner: "vertice" },
        { id: "ecom-regras-promo", label: "Cupom, frete grátis condicional e regras promocionais definidos (loja completa)", owner: "vertice" },
        { id: "ecom-metodos-pgto", label: "Métodos de pagamento definidos", owner: "vertice" },
        {
          id: "ecom-substitui-trafego",
          label: "Registrado: a gestão mensal de e-commerce substitui a Gestão de Google Ads e a de Meta Ads, não se soma",
          owner: "vertice",
          detail: "Somar as duas é vender escopo duplicado e o cliente descobre no mês 2.",
        },
      ],
    },
    {
      id: "ecom-build",
      title: "Construção da loja",
      when: "Dias 2 a 25 (ou 40 na completa)",
      items: [
        { id: "ecom-tema", label: "Tema comercial customizado na identidade do cliente", owner: "vertice" },
        { id: "ecom-produtos", label: "Produtos cadastrados a partir da planilha", owner: "vertice" },
        {
          id: "ecom-paginas",
          label: "5 páginas institucionais: sobre, trocas, entrega, privacidade, contato",
          owner: "vertice",
        },
        { id: "ecom-pgto-config", label: "Meios de pagamento configurados", owner: "vertice" },
        { id: "ecom-frete-config", label: "Regras de frete configuradas", owner: "vertice" },
        { id: "ecom-variacoes", label: "Catálogo com variações, filtros e busca (loja completa)", owner: "vertice" },
        { id: "ecom-erp-integrado", label: "ERP ou hub integrado, com log de sincronização (loja completa)", owner: "vertice" },
        { id: "ecom-emails", label: "E-mails transacionais na identidade da marca (loja completa)", owner: "vertice" },
        { id: "ecom-migracao", label: "Catálogo migrado da plataforma anterior (loja completa)", owner: "vertice" },
      ],
    },
    {
      id: "ecom-tracking",
      title: "Rastreamento e feed",
      when: "Dias 20 a 28",
      items: [
        { id: "ecom-ga4-funil", label: "GA4 de e-commerce com o funil completo: view_item → purchase", owner: "vertice" },
        { id: "ecom-merchant", label: "Google Merchant Center com feed aprovado", owner: "vertice", blocking: true },
        { id: "ecom-catalog", label: "Meta Catalog + API de Conversões ativos", owner: "vertice" },
        { id: "ecom-consent", label: "Consent Mode configurado", owner: "vertice" },
        {
          id: "ecom-divergencia",
          label: "Divergência entre plataforma de anúncio e loja conferida e documentada",
          owner: "vertice",
          detail: "Sem esse número, toda reunião de resultado vira briga sobre qual painel está certo.",
          blocking: true,
        },
      ],
    },
    {
      id: "ecom-homologacao",
      title: "Homologação",
      when: "Antes do go-live",
      items: [
        {
          id: "ecom-compra-real",
          label: "Checkout testado ponta a ponta com compra real",
          owner: "vertice",
          detail: "Compra real, não modo sandbox. Está no contrato assim.",
          blocking: true,
        },
        { id: "ecom-email-recebido", label: "E-mail transacional recebido na caixa do cliente", owner: "vertice" },
        { id: "ecom-pedido-erp", label: "Pedido chegou no ERP e o estoque baixou (quando há integração)", owner: "vertice" },
        { id: "ecom-reembolso", label: "Reembolso testado", owner: "vertice" },
        { id: "ecom-purchase", label: "Evento purchase conferido no GA4 e no Meta com o valor certo", owner: "vertice", blocking: true },
      ],
    },
    {
      id: "ecom-golive",
      title: "Go-live e gestão mensal",
      when: "Entrega + mês 1",
      items: [
        { id: "ecom-dominio-apontado", label: "Domínio apontado e SSL ativo", owner: "vertice" },
        { id: "ecom-campanhas", label: "Google Shopping + Search e Meta no ar", owner: "vertice" },
        {
          id: "ecom-fluxos",
          label: "3 fluxos de e-mail ativos: carrinho abandonado, boas-vindas, pós-compra",
          owner: "vertice",
        },
        { id: "ecom-cro-1", label: "Primeiro teste de CRO definido para o mês 1", owner: "vertice" },
        { id: "ecom-quinzenal", label: "Reunião quinzenal agendada e relatório mensal na agenda", owner: "vertice" },
        {
          id: "ecom-performance",
          label: "Camada de performance avaliada — só com rastreamento limpo ponta a ponta",
          owner: "vertice",
          detail: "Opcional. Exige relatório de atribuição auditável com a lista de vendas.",
        },
      ],
    },
  ],
};

export function phasesFor(serviceId: string): ChecklistPhase[] {
  return ONBOARDING[serviceId] ?? [];
}

export function countItems(phases: ChecklistPhase[]): number {
  return phases.reduce((total, phase) => total + phase.items.length, 0);
}

export function blockingIds(phases: ChecklistPhase[]): string[] {
  return phases.flatMap((phase) => phase.items.filter((i) => i.blocking).map((i) => i.id));
}
