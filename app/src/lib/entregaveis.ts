// Entregáveis da ROI Labs por tipo de cadeira — a tela /admin/entregaveis lê daqui.
//
// Mesmo esqueleto do catálogo da Vértice (lib/vertice/catalog.ts), mas sem preço por
// item nem hora: a ROI Labs não vende hora, vende a cadeira. Cada "fase" segue o plano
// de seis meses da proposta padrão (Destravar → Aparecer e medir → Crescer e segurar).
//
// Fontes: /modelo do site, proposta padrão em slides, lib/precificacao.ts (spec 016),
// specs 010/012/013 e Docs/Obsidian (oferta, operacao). Nada aqui é lido pela cobrança.

export const ANUIDADE = 3960; // R$/ano — preço público do /modelo

export type Fase = 'implantacao' | 'operacao';

export type GrupoEntregavel = {
  title: string;
  items: string[];
};

export type FaseCadeira = {
  id: string;
  name: string;
  fase: Fase;
  /** Quando acontece, contado do site no ar ("Mês 1", "Meses 2 e 3"). */
  prazo: string;
  deliverables: GrupoEntregavel[];
  prereq?: string[];
  excludes?: string[];
  rules?: string[];
};

export type TipoCadeira = {
  id: string;
  name: string;
  tagline: string;
  /** Como a ROI Labs ganha nesta cadeira — além da anuidade. */
  cobranca: string;
  /** Cadeiras no ar que seguem este formato. */
  exemplos: string[];
  fases: FaseCadeira[];
};

const MES_6 = 'No 6º mês: balanço dos números e o plano dos seis meses seguintes';

// Equipe de vendas e carteira valem para toda cadeira (/modelo, "A ROI Labs banca"). Só muda o que a venda
// vira na mão do parceiro.
const equipeDeVendas = (entregue: string): GrupoEntregavel => ({
  title: 'Equipe de vendas',
  items: ['Equipe de vendas da ROI Labs atendendo todo cliente que chega pelo site: tira as dúvidas e fecha a venda', entregue],
});
const CARTEIRA: GrupoEntregavel = {
  title: 'Carteira',
  items: ['Quem comprou pode ficar na carteira da ROI Labs, e a equipe trabalha para esse cliente comprar de novo'],
};

export const TIPOS_CADEIRA: TipoCadeira[] = [
  {
    id: 'loja',
    name: 'Cadeira de loja',
    tagline: 'Fornecedor com catálogo próprio. A venda fecha na loja da operação e o fee incide no pedido pago.',
    cobranca:
      'Anuidade + % do pedido pela faixa do nicho (padrão 15% na 1ª compra, 10% na recompra — ver Precificação)',
    exemplos: ['Tapepro'],
    fases: [
      {
        id: 'loja-destravar',
        name: 'Destravar — loja no ar',
        fase: 'implantacao',
        prazo: 'Mês 1',
        deliverables: [
          {
            title: 'Loja',
            items: [
              'Vitrine, página de produto, carrinho e checkout no motor de loja da ROI Labs',
              'Domínio próprio do cliente, comprado na Hostinger (R$ 50/ano), ligado e com HTTPS',
              'Catálogo cadastrado: produto, preço, foto e os atributos do nicho (ex.: dimensão, acabamento, cor, tamanho)',
              'Frete configurado por cadeira — ou marcado como sem entrega quando a unidade de venda não despacha',
              'Meio de pagamento ligado. Sem meio de cobrança, a loja não oferece checkout',
            ],
          },
          {
            title: 'Busca',
            items: [
              'Domínio no Google Search Console e no Bing Webmaster',
              'Sitemap, robots.txt e dados estruturados de produto (Product/Offer) no HTML',
              'Primeiras páginas de alta intenção no ar',
            ],
          },
          equipeDeVendas('Venda entregue pronta ao parceiro, para faturar e despachar'),
        ],
        prereq: [
          'Catálogo com foto em padrão (boa resolução, fundo neutro), preço e atributos estruturados do nicho',
          'Estoque sincronizável: API ou webhook (ideal) ou planilha exportada em horário fixo',
          'CNPJ ativo e emissão de nota fiscal da venda',
        ],
        excludes: [
          'Fotografia de produto — a foto vem do fornecedor',
          'Integração sob medida com ERP que não tem API nem exportação de planilha',
        ],
      },
      {
        id: 'loja-aparecer',
        name: 'Aparecer e medir',
        fase: 'operacao',
        prazo: 'Meses 2 e 3',
        deliverables: [
          {
            title: 'Páginas',
            items: [
              'Páginas de cauda longa (produto × característica × ocasião × intenção local), cada uma validada por volume real de busca',
              'Loja liberada para o Google e para as IAs (ChatGPT, Gemini, Perplexity)',
              'Feed de produtos no Google Merchant Center — Meta e Pinterest quando o nicho pedir',
            ],
          },
          {
            title: 'Medição',
            items: [
              'Cada pedido registrado no painel, com a cadeira e a origem',
              'Posição nas buscas acompanhada semana a semana',
            ],
          },
        ],
      },
      {
        id: 'loja-crescer',
        name: 'Crescer e segurar',
        fase: 'operacao',
        prazo: 'Meses 4 a 6',
        deliverables: [
          {
            title: 'Conteúdo que converte',
            items: [
              'Páginas que respondem às perguntas reais de quem compra',
              'Calculadoras e comparador quando o produto pede conta (m², rolos, caixas)',
              'Avaliações e fotos reais de clientes no ar',
            ],
          },
          CARTEIRA,
          { title: 'Fechamento do ciclo', items: [MES_6] },
        ],
        rules: [
          'O fee incide sobre o produto com desconto, nunca sobre o frete',
          'Piso de R$ 5 por pedido',
          'A taxa fica congelada no pedido: mudar o percentual do parceiro não reescreve pedido antigo',
          'Em moda, produto devolvido estorna a comissão',
        ],
      },
    ],
  },
  {
    id: 'servico',
    name: 'Cadeira de serviço',
    tagline: 'Quem vende por conversa. O site leva o cliente da busca até o WhatsApp da equipe de vendas da ROI Labs.',
    cobranca: 'Anuidade + 15% na primeira compra e 10% para quem já é da base',
    exemplos: ['Autogestor', 'Coopluz', 'Autogestor Viagens'],
    fases: [
      {
        id: 'servico-destravar',
        name: 'Destravar — site no ar',
        fase: 'implantacao',
        prazo: 'Mês 1',
        deliverables: [
          {
            title: 'Site',
            items: [
              'Site completo, com os produtos ou serviços e os preços cadastrados',
              'Botões de WhatsApp da equipe de vendas, com mensagem pronta ("Vim pelo site…"), em todas as páginas',
              'Domínio próprio do cliente, comprado na Hostinger (R$ 50/ano) e ligado ao Google Search Console',
              'Primeiras páginas no ar',
            ],
          },
          {
            title: 'Painel',
            items: ['Painel administrativo com cada contato registrado, visível para o parceiro'],
          },
          equipeDeVendas('Venda entregue pronta ao parceiro, para faturar e prestar o serviço'),
        ],
        prereq: [
          'Lista de produtos ou serviços, com preço e foto',
          'Fotos e vídeos reais do trabalho',
          'Depoimentos de clientes, com autorização',
          'Registro profissional, CNPJ ou selo do nicho',
          'Tudo numa planilha só, no prazo combinado na reunião de alinhamento',
        ],
      },
      {
        id: 'servico-aparecer',
        name: 'Aparecer e medir',
        fase: 'operacao',
        prazo: 'Meses 2 e 3',
        deliverables: [
          {
            title: 'Páginas',
            items: [
              'Site liberado para o Google e para as IAs',
              'Páginas novas para as buscas mais procuradas do nicho',
            ],
          },
          {
            title: 'Medição',
            items: [
              'Conversas do WhatsApp contadas no painel, semana a semana',
              'Em quais buscas do Google o parceiro aparece, e em que posição',
              'Se o ChatGPT, o Gemini e o Perplexity citam o parceiro — e se citam certo',
              'Quantas visitas chegam vindas dessas IAs',
            ],
          },
        ],
      },
      {
        id: 'servico-crescer',
        name: 'Crescer e segurar',
        fase: 'operacao',
        prazo: 'Meses 4 a 6',
        deliverables: [
          {
            title: 'Conteúdo que converte',
            items: [
              'Páginas que respondem às perguntas reais dos clientes',
              'Depoimentos e fotos reais no ar',
            ],
          },
          CARTEIRA,
          { title: 'Fechamento do ciclo', items: [MES_6] },
        ],
        excludes: ['Acompanhar a entrega do serviço depois da venda — é do parceiro'],
        rules: [
          'O relatório de comissões sai do painel, venda por venda, antes de cada cobrança',
          'Clínica (saúde, estética): cobra por consulta comparecida, R$ 150 a R$ 300 — nunca % do tratamento. Checar CFO/CFM antes de fechar o valor',
        ],
      },
    ],
  },
  {
    id: 'software',
    name: 'Cadeira de software',
    tagline: 'SaaS B2B. A assinatura fecha no gateway do parceiro e chega à ROI Labs por webhook.',
    cobranca: 'Anuidade + 20% das 12 primeiras mensalidades e 10% da 13ª em diante (implantação: 20%)',
    exemplos: ['Sirius CRM', 'Orion ERP', 'Estetia CRM', 'Polaris IA'],
    fases: [
      {
        id: 'software-destravar',
        name: 'Destravar — site e webhook',
        fase: 'implantacao',
        prazo: 'Mês 1',
        deliverables: [
          {
            title: 'Site',
            items: [
              'Site do software com os planos e o preço público',
              'Página da cadeira com conteúdo no HTML inicial, dados estruturados de produto e FAQ',
              'Domínio próprio do cliente, comprado na Hostinger (R$ 50/ano), no Google Search Console',
            ],
          },
          {
            title: 'Atribuição da venda',
            items: [
              'Webhook do gateway do parceiro ligado, com assinatura verificada',
              'Cada assinatura vira um negócio originado no painel — sem digitação manual',
              'Pagamento de conta de teste fica fora da receita apurada',
            ],
          },
          equipeDeVendas('Cliente assinante entregue ao parceiro, para o onboarding'),
        ],
        prereq: [
          'Gateway de pagamento com webhook (sem gateway ligado, a cadeira não oferece checkout)',
          'Planos e preços públicos definidos',
          'Conta de demonstração para as capturas de tela',
        ],
      },
      {
        id: 'software-aparecer',
        name: 'Aparecer e medir',
        fase: 'operacao',
        prazo: 'Meses 2 e 3',
        deliverables: [
          {
            title: 'Páginas',
            items: [
              'Páginas por nicho de cliente e por dor que o software resolve',
              'Site liberado para o Google e para as IAs',
            ],
          },
          {
            title: 'Medição',
            items: [
              'Negócios originados no painel, com a mensalidade de cada um',
              'Posição nas buscas e citação nas IAs',
            ],
          },
        ],
      },
      {
        id: 'software-crescer',
        name: 'Crescer e segurar',
        fase: 'operacao',
        prazo: 'Meses 4 a 6',
        deliverables: [
          {
            title: 'Conteúdo que converte',
            items: [
              'Páginas que respondem às perguntas reais de quem avalia o software',
              'Casos e depoimentos de clientes reais',
            ],
          },
          CARTEIRA,
          { title: 'Fechamento do ciclo', items: [MES_6] },
        ],
        excludes: ['Suporte, onboarding e sucesso do cliente do software — são do parceiro'],
        rules: [
          'A taxa fica congelada no negócio: mudar o percentual não reescreve negócio antigo',
          'Cadeira da casa (Sirius, Orion) é receita direta: não gera success fee',
        ],
      },
    ],
  },
];

/** Regras que valem para toda cadeira. */
export const REGRAS_GERAIS = {
  roilabs: [
    ['Setup', 'Nenhum. Tecnologia, tráfego e equipe de vendas são bancados pela ROI Labs'],
    ['Equipe de vendas', 'A equipe de vendas da ROI Labs atende todo cliente que chega pelo site, fecha a venda e entrega a venda pronta ao parceiro'],
    ['Carteira', 'Quem comprou pode ficar na carteira da ROI Labs, e a equipe trabalha para esse cliente comprar de novo'],
    ['Anuidade', `R$ ${ANUIDADE.toLocaleString('pt-BR')}/ano (R$ 330/mês): Pix à vista, ou cartão em até 12x com acréscimo`],
    ['Domínio', 'Domínio próprio do cliente em toda cadeira, comprado na Hostinger: R$ 50/ano (valor inicial), cobrado junto com a anuidade'],
    ['Exclusividade', 'Uma cadeira por nicho no Brasil inteiro, enquanto o contrato vigorar'],
    ['Contrato', 'Anual, renovável por desempenho dos dois lados'],
    ['Comissões', 'Cobradas todo dia 05, somando o mês anterior. Relatório venda por venda antes da cobrança'],
    ['Vendeu zero', 'Comissão zero; fica só a anuidade'],
    ['Candidatura', 'Triagem responde em até 48h úteis'],
    ['Maturação', 'De 3 a 6 meses depois do site no ar até o volume orgânico estabilizar'],
    ['Propriedade', 'Domínio da operação, páginas, calculadoras e feed são da ROI Labs. Catálogo, marca e clientes são do parceiro'],
    ['Saída', 'Na renovação, sem dívida e sem amarra técnica no site próprio do parceiro'],
  ] as [string, string][],
  parceiro: [
    // Produto OU serviço (30/09/2026): 4 dos 5 negócios reais são serviço.
    'Produto ou serviço próprio, com preço e foto atualizados',
    'Capacidade de atender o que é anunciado',
    'Entrega no prazo: pronta-entrega, se é produto; agenda cumprida, se é serviço',
    'Faturar a venda que a equipe da ROI Labs entrega pronta',
    'Fotos, vídeos e depoimentos reais, com autorização',
  ],
  neverIncluded: [
    'Mídia paga (Google Ads, Meta Ads)',
    'Gestão de redes sociais',
    'Produção de foto e vídeo',
    'Acompanhamento da entrega do pedido',
    'Embalagem, despacho, frete de devolução e nota fiscal',
    'Garantia e defeito do produto',
    'Suporte ao ERP ou sistema do parceiro',
  ],
  metas:
    'Ninguém promete primeira posição no Google. Meta com número só depois de dois meses de dados reais — o que se mede é pedido pago, conversa no WhatsApp ou assinatura, conforme a cadeira.',
};

/** Pedidos fora da cadeira e para onde vão. */
export const FORA_DA_CADEIRA: [string, string][] = [
  ['Anúncio pago no Google ou no Meta', 'Vértice Marketing — contrato à parte'],
  ['Mexer no site próprio do parceiro', 'Vértice Marketing — orçamento à parte'],
  ['CRM para a equipe de vendas do parceiro', 'Sirius CRM — assinatura à parte'],
  ['Sistema de gestão (estoque, financeiro, nota)', 'Orion ERP — assinatura à parte'],
  ['Segundo nicho do mesmo parceiro', 'Nova cadeira, nova anuidade'],
  ['Catálogo sem API nem planilha de estoque', 'Não entra — é o requisito mínimo da loja'],
];

export const TOTAL_FASES = TIPOS_CADEIRA.reduce((total, t) => total + t.fases.length, 0);
