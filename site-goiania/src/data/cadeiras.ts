// Cadeiras vendáveis da carteira (spec 012, US3). Uma página por cadeira.
//
// ⚠️ CONTEÚDO ANTES DE QUANTIDADE. A medição da Atma (2026-08-07) mostrou que 86% do
// tráfego dela vem de UMA página que responde uma pergunta de preço inteira, e que esforço
// por artigo não prediz nada — o vencedor é o 6º maior de 22. Publicar 7 páginas finas é o
// resultado a evitar, e é por isso que `src/scripts/check-cadeiras.mjs` roda no `prebuild`:
// página abaixo do piso de FR-014 QUEBRA O BUILD, não vira aviso que ninguém lê.
//
// Piso objetivo de FR-014, por página:
//   • ≥ 800 palavras no HTML INICIAL (não em shell de SPA)
//   • a pergunta de preço respondida EXPLICITAMENTE no corpo, não só no Offer
//   • ≥ 6 pares de FAQ
//
// FR-009: `publicado: false` ⇒ sem URL pública indexável e fora do sitemap. Cadeira em
// `em-preparacao` ou sem gateway ligado NÃO entra aqui.

export interface FaqCadeira {
  pergunta: string;
  /** Resposta inteira, em prosa. Uma linha não responde nada e não é citada por IA. */
  resposta: string;
}

export interface SecaoCadeira {
  titulo: string;
  /** Parágrafos. O contador de FR-014 lê o texto renderizado, então prosa real conta. */
  paragrafos: string[];
}

export interface Cadeira {
  slug: string;
  /** Nome do produto — vira o `name` do Product. */
  nome: string;
  /** Nicho da cadeira, como aparece no mapa do institucional. */
  niche: string;
  /** Uma frase. Vira meta description e o BLUF do topo da página. */
  resumo: string;
  /** Fonte do Offer de FR-013 — o MESMO número que a página escreve no corpo. */
  preco: number;
  moeda: 'BRL' | 'USD';
  recorrencia: 'unica' | 'mensal' | 'anual';
  /** 'carrinho' = caixa da ROI Labs; 'parceiro' = gateway do parceiro. */
  modoCobranca: 'carrinho' | 'parceiro';
  /** Obrigatório quando modoCobranca='parceiro'. https absoluto. */
  checkoutUrl: string | null;
  /** De quem é a página de pagamento. Comprador que não sabe a quem paga é chargeback. */
  pagoA: string;
  /**
   * A pergunta de preço, respondida em prosa NO CORPO. Não é o Offer, e não é uma tabela:
   * é o texto que responde "quanto custa" para quem chegou da busca perguntando isso.
   */
  respostaPreco: string;
  secoes: SecaoCadeira[];
  faq: FaqCadeira[];
  /** FR-009. false ⇒ nenhuma URL pública, nenhuma entrada no sitemap. */
  publicado: boolean;
}

/**
 * ⚠️ O QUE ENTRA AQUI EXIGE PREÇO REAL E DESCRIÇÃO REAL. Inventar preço numa página de
 * e-commerce publicada seria fabricar oferta comercial, e inventar descrição de produto de
 * parceiro seria afirmar em nome dele. Nenhum dos dois é decisão de engenharia.
 *
 * O que já está pronto e testado ao redor: o template, o Product/Offer + FAQPage no @graph
 * único, o portão de FR-009 no sitemap e o verificador do piso de FR-014. Cada cadeira
 * adicionada aqui já nasce medida — e reprovada se estiver fina.
 */
export const cadeiras: Cadeira[] = [
  {
    // T048 — a PRIMEIRA página de cadeira (Jean, 07/08: sirius, não atma — a atma tem página
    // de preço própria com 189 queries na pág. 1 e seria canibalizada).
    //
    // 🚨 `publicado: false` NÃO é rascunho: é FR-008/FR-009 valendo. O Sirius cobra por
    // Stripe e a `CredencialGateway` dele ainda NÃO existe (T033 em aberto). Publicar o
    // botão agora mandaria o cliente pagar num lugar que a carteira não enxerga — venda
    // feita, receita invisível, que é exatamente o buraco que a 012 existe para fechar.
    // ⚠️ Vira `true` quando T033 e T034 fecharem, e SÓ então. O conteúdo abaixo já passou
    // no piso de FR-014 (verificado com o flag em true, build + check-cadeiras).
    //
    // Preço e planos apurados em 07/08 no próprio produto (siriuscrm.com.br/pricing),
    // não estimados: Gratuito R$ 0 · Starter R$ 67 · Pro R$ 147 · Business R$ 397, mensais.
    slug: 'sirius',
    nome: 'Sirius CRM',
    niche: 'CRM / Solar',
    resumo:
      'O Sirius CRM começa em R$ 0 no plano Gratuito e custa R$ 147/mês no Pro, o plano que a maioria dos times contrata: pipeline Kanban, WhatsApp e agentes de IA que trabalham o funil sozinhos.',
    preco: 147,
    moeda: 'BRL',
    recorrencia: 'mensal',
    modoCobranca: 'parceiro',
    // A compra acontece na página de planos do próprio produto — de lá o cliente escolhe o
    // plano e paga. Não é link de vitrine: é o caminho real de pagamento.
    checkoutUrl: 'https://siriuscrm.com.br/pricing',
    pagoA: 'ROI Labs',
    respostaPreco:
      'São quatro faixas, todas por mês e sem fidelidade. O Gratuito custa R$ 0 para sempre, aceita até 2 usuários, 250 contatos e 1 pipeline, e não pede cartão de crédito para começar. O Starter custa R$ 67/mês e abre 5 usuários, 1.000 contatos, 5 pipelines e o primeiro agente de IA. O Pro custa R$ 147/mês, é o plano mais contratado e o que a maioria das equipes acaba usando: 15 usuários, 5.000 contatos, 15 pipelines, três agentes de IA, analytics avançado e acesso à API pública. O Business custa R$ 397/mês e é onde entram os 50 usuários, os contatos ilimitados, o WhatsApp pela API oficial da Meta, o round-robin de leads e o SSO com audit log. Acima disso existe o Enterprise, que não tem preço de tabela porque é limite customizado com SLA e onboarding assistido — esse se fecha conversando. Todo plano pago tem garantia de 7 dias com devolução integral, e a troca de plano para cima ou para baixo é proporcional, feita a qualquer momento.',
    secoes: [
      {
        titulo: 'O que você está comprando',
        paragrafos: [
          'O Sirius CRM é um CRM de vendas construído em volta de um pipeline Kanban: cada negócio é um cartão, cada etapa é uma coluna, e o vendedor arrasta o cartão conforme a conversa avança. Essa parte não é novidade e não deveria ser o motivo da compra — praticamente todo CRM do mercado faz isso. O que diferencia o Sirius é o que acontece em volta do cartão quando ninguém está olhando.',
          'A camada de IA do produto se chama Sofia, e ela não é um chat que responde perguntas sobre os seus dados. São agentes autônomos que operam o CRM: qualificam lead que entrou, fazem o follow-up que o vendedor esqueceu, agendam reunião e movem o negócio de coluna. Cada ação fica registrada num painel próprio, onde você supervisiona e aprova o que foi feito. O limite é contado em ações autônomas por mês — 200 no Starter, 1.000 no Pro, 3.000 no Business — e é esse número, não a contagem de usuários, que costuma decidir a faixa certa.',
          'A prospecção funciona por créditos, também mensais: 75 no Starter, 300 no Pro, 1.500 no Business. É o combustível de encontrar e enriquecer contato novo, e vale checar o consumo antes de assinar, porque um time que prospecta ativamente queima crédito muito mais rápido do que um time que só atende demanda que chega.',
          'O WhatsApp merece um parágrafo separado porque é onde a leitura apressada erra. Conversar com cliente pelo WhatsApp é possível desde os planos menores, mas a integração pela API oficial da Meta — a que dá número verificado, disparo em escala dentro das regras e nenhum risco de bloqueio por automação não autorizada — só existe no Business, de R$ 397/mês. Se o WhatsApp oficial é requisito do seu processo, o preço da sua operação é R$ 397, não R$ 147, e é melhor descobrir isso agora do que no segundo mês.',
        ],
      },
      {
        titulo: 'Qual plano serve a quem',
        paragrafos: [
          'O Gratuito não é trial disfarçado: ele não expira e é 100% funcional dentro dos limites. Para um vendedor sozinho ou uma dupla organizando as primeiras centenas de contatos, ele resolve, e a recomendação honesta é começar por ele. O teto que costuma aparecer primeiro não é o de contatos, é o de 1 pipeline — no momento em que você precisa separar, por exemplo, "vendas novas" de "renovações", o Gratuito acabou.',
          'O Starter, a R$ 67/mês, é a faixa de quem já tem um time pequeno e quer o primeiro agente de IA rodando. Cinco usuários e 500 negócios ativos cobrem bem uma operação enxuta. As 200 ações autônomas por mês, no entanto, são pouco se você espera que a IA faça follow-up de tudo: dá cerca de 7 ações por dia. Serve para automatizar um recorte — o follow-up de lead frio, por exemplo — e não a operação inteira.',
          'O Pro, a R$ 147/mês, é o plano marcado como mais popular e é onde a maioria das equipes em crescimento estaciona. Ele multiplica por cinco os limites do Starter e adiciona três coisas que mudam o dia a dia: analytics avançado, webhooks e API pública, e suporte prioritário. A API é o item subestimado da lista — é ela que permite plugar o CRM no resto do que você já usa em vez de manter planilha de cola no meio.',
          'O Business, a R$ 397/mês, é operação grande de verdade: 50 usuários, contatos e negócios ilimitados, round-robin distribuindo lead automaticamente entre vendedores, relatórios personalizados, SSO com audit log e um gerente de conta dedicado. SSO e audit log raramente são desejo do time comercial — normalmente são exigência de quem cuida de segurança da informação, e quando essa exigência aparece ela não é negociável.',
          'Se nenhuma das quatro faixas encaixa, existe o Enterprise, sem preço público. Não é falta de transparência: é que limite customizado, SLA dedicado e onboarding assistido são escopo, e escopo não cabe em tabela.',
        ],
      },
      {
        titulo: 'Quando o Sirius não é a escolha certa',
        paragrafos: [
          'Se a sua venda é balcão puro, sem funil e sem follow-up — o cliente chega, compra e vai embora — um CRM não vai te dar retorno, nem este nem outro. O ganho de um CRM mora no intervalo entre o primeiro contato e o fechamento, e onde não existe intervalo não existe ganho.',
          'Se o seu processo depende de um ERP específico como fonte da verdade e você precisa de integração bidirecional pronta, a pergunta a fazer antes de assinar é se essa integração existe ou se vai ter de ser construída sobre a API pública — que, lembrando, só aparece a partir do Pro. Contar com uma integração que ainda não existe é o jeito mais comum de um CRM virar planilha cara.',
          'E se o seu time tem menos de três pessoas e o volume de contatos ainda cabe na cabeça de todo mundo, o plano Gratuito é a resposta certa por bastante tempo. Pagar R$ 147 por mês para organizar 80 contatos é gastar antes de precisar.',
        ],
      },
      {
        titulo: 'O que a ROI Labs faz nesta cadeira',
        paragrafos: [
          'O Sirius ocupa a cadeira de CRM na carteira da ROI Labs, e essa cadeira é da casa — o produto é nosso, e dizemos isso abertamente em vez de apresentá-lo como parceiro. É a mesma regra que aplicamos ao contrário: quando a cadeira é de um parceiro externo, a página diz o nome dele.',
          'Na prática isso muda uma coisa para quem compra: o pagamento é processado no ambiente de checkout do próprio Sirius, e a ROI Labs não recebe os dados do seu cartão em momento nenhum. O que a ROI Labs faz é operar a cadeira — construir e manter a venda online do produto, medir o que converte e responder por ela.',
          'Uma cadeira por nicho é a regra do modelo, e ela vale aqui como vale no polo de Goiânia: enquanto o Sirius ocupa a cadeira de CRM, não existe uma segunda solução de CRM sendo empurrada em paralelo dentro da carteira.',
        ],
      },
    ],
    faq: [
      {
        pergunta: 'Quanto custa o Sirius CRM por mês?',
        resposta:
          'O plano Gratuito custa R$ 0 e não expira. O Starter custa R$ 67/mês, o Pro custa R$ 147/mês e o Business custa R$ 397/mês. Acima disso existe o Enterprise, que é orçado caso a caso porque envolve limites customizados e SLA dedicado. Todos os valores são mensais e sem fidelidade.',
      },
      {
        pergunta: 'Preciso de cartão de crédito para começar?',
        resposta:
          'Não. O plano Gratuito é permanente e não pede cartão. O cartão só entra quando você decide fazer upgrade para um plano pago. Existe ainda um período de 7 dias com acesso completo ao Pro para quem quer testar os recursos das faixas pagas antes de assinar.',
      },
      {
        pergunta: 'Posso trocar de plano depois de assinar?',
        resposta:
          'Sim, para cima ou para baixo, a qualquer momento. O valor é ajustado proporcionalmente ao tempo já usado, então você não paga duas vezes pelo mesmo período nem perde o que já pagou ao subir de faixa no meio do mês.',
      },
      {
        pergunta: 'Como funciona a garantia de 7 dias?',
        resposta:
          'Qualquer plano pago pode ser testado por 7 dias com devolução integral do valor. Se você desistir dentro desse prazo, o dinheiro volta 100%, sem exigência de justificativa. Depois desse prazo o cancelamento continua livre, mas passa a valer até o fim do período já pago em vez de gerar reembolso.',
      },
      {
        pergunta: 'Posso cancelar quando quiser?',
        resposta:
          'Sim, e sem multa ou taxa de saída. Ao cancelar você mantém o acesso até o fim do período que já foi pago, e depois disso a conta deixa de ser cobrada. Não há contrato de permanência mínima em nenhuma das faixas.',
      },
      {
        pergunta: 'O que os agentes de IA (Sofia) fazem de verdade?',
        resposta:
          'Eles operam o CRM de forma autônoma: qualificam leads que entram, fazem follow-up, agendam reuniões e movem negócios entre as etapas do pipeline. Cada ação executada fica registrada num painel onde você supervisiona e aprova. O recurso começa no plano Starter, com 1 agente e 200 ações autônomas por mês, e escala até 5 agentes e 3.000 ações no Business.',
      },
      {
        pergunta: 'O WhatsApp oficial está incluso em qualquer plano?',
        resposta:
          'Não. A integração pela API oficial da Meta — a que dá número verificado e envio em escala dentro das regras da plataforma — está disponível apenas no plano Business, de R$ 397/mês. Se o WhatsApp oficial é requisito do seu processo comercial, o custo real da sua operação é R$ 397/mês, e não a faixa de R$ 147.',
      },
      {
        pergunta: 'Quantos usuários cada plano aceita?',
        resposta:
          'O Gratuito aceita até 2 usuários, o Starter até 5, o Pro até 15 e o Business até 50. Se a sua equipe passa de 50 pessoas, a faixa correta é o Enterprise, que trabalha com limites customizados em vez de teto de tabela.',
      },
      {
        pergunta: 'Quem processa o pagamento — a ROI Labs ou o Sirius?',
        resposta:
          'O pagamento é processado no ambiente de checkout do próprio Sirius CRM. A ROI Labs opera a cadeira de CRM da carteira e não recebe nem armazena os dados do seu cartão em nenhum momento do processo.',
      },
    ],
    publicado: false,
  },
];

/** FR-009 — só cadeira publicada gera URL pública indexável e entra no sitemap. */
export const cadeirasPublicadas = (): Cadeira[] => cadeiras.filter((c) => c.publicado);

export const cadeiraPorSlug = (slug: string): Cadeira | undefined =>
  cadeiras.find((c) => c.slug === slug);
