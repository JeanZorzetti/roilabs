---
status: decided
data: 2026-09-29
depends_on:
  - "[[gtm]]"
  - "[[oferta]]"
  - "[[modelo]]"
---

# Artigo 01 — "Agência que cobra por resultado"

> **Pergunta que este nó responde:** como deve ser o primeiro artigo do blog feito para o SEO ser o único canal
> de captação da ROI Labs — tema, texto, imagens, dados estruturados, sitemap e medição.

## Resumo

- **Tema:** agência que cobra por resultado (marketing por comissão / success fee), escrito para o **dono da empresa**,
  não para agências.
- **Por quê:** é a busca de quem já quer pagar só quando vender, ou seja, o cliente da ROI Labs no momento em que
  compara fornecedores. Hoje o Google mostra para essa busca textos curtos de agências pequenas e guias escritos
  para agências (RD Station, Neil Patel, iClips), e ninguém faz a conta do lado de quem paga.
- **Tamanho:** 1.900 a 2.100 palavras no corpo + cerca de 300 no FAQ (total 2.200 a 2.400).
- **Imagens:** 7 fotos do Pexels (grátis para uso comercial) + 1 desenho próprio opcional.
- **Antes de escrever:** 4 decisões dela (fim deste arquivo) e o volume de busca no Keyword Planner.

## 1. Palavra-chave e intenção

| Papel | Busca | Onde entra |
| :-- | :-- | :-- |
| Principal | agência que cobra por resultado | slug, título, H1, 1º parágrafo, alt da capa |
| Secundária | marketing por comissão | H2 dos modelos, FAQ |
| Secundária | success fee | definição, FAQ |
| Secundária | pagar só quando vender | descrição, H2 da conta |
| Variações | agência de marketing por comissão, marketing por performance preço, comissão sobre vendas agência | texto corrido, sem forçar |

**Volume: não medido.** Antes de escrever, abrir o Google Keyword Planner (a mesma ferramenta citada na home, com
dados de ago/2026) e comparar as 4 primeiras linhas. A de maior volume vira título e H1; as outras viram H2 ou FAQ.
Não inventar número de volume no texto.

**Intenção:** investigação comercial. A pessoa já sabe que o modelo existe e quer saber como funciona, quanto custa,
quais os riscos e em quem confiar. Por isso a tabela comparativa entra cedo (antes de 30% do texto).

**Para não brigar com o post que já existe:** `growth-partner-vs-agencia-revestimentos` já faz a conta "agência de
mensalidade × Growth Partner". O artigo novo compara **os modelos de cobrança por resultado entre si**, explica **quem
atende o cliente** e **o que exigir no contrato**. A conta aparece, mas curta, e manda para o post antigo e para o
/simulador/.

## 2. Ficha do artigo

| Campo | Valor |
| :-- | :-- |
| URL | `https://roilabs.com.br/blog/agencia-que-cobra-por-resultado/` |
| Arquivo | `site/src/content/blog/agencia-que-cobra-por-resultado.md` |
| Título da aba (title) | Agência que cobra por resultado: como funciona e quanto custa (61 caracteres) |
| H1 | Agência que cobra por resultado: como funciona, quanto custa e quando vale a pena |
| Descrição (meta e linha fina) | Pagar só quando vender existe, mas tem letra miúda. Veja os modelos de cobrança por resultado, a conta com números e o que exigir no contrato. (143 caracteres) |
| Eyebrow | Guia · Modelo de cobrança |
| Autor | pessoa real com página de autor (decisão 1) |
| Datas | `pubDate` no dia da publicação; `updatedDate` a cada revisão real |
| Tom | direto, frases curtas, "você", sem jargão sem explicação; cada número com fonte e data |

O layout hoje põe " — ROI Labs" depois do título, o que daria 92 caracteres e o Google cortaria. Por isso entra
um campo opcional `seoTitle` (seção 8).

## 3. Esqueleto do texto

Cada seção abre com **uma ou duas frases que respondem sozinhas ao título dela** (é o que o Google e as IAs
recortam). Depois vêm o detalhe, o exemplo e o link.

### Abertura — "Resposta curta" (cerca de 60 palavras, logo abaixo da linha fina)

> Agência que cobra por resultado é a que recebe uma parte do que você vende, no lugar de uma mensalidade fixa ou
> junto com ela. O formato mais comum soma um fixo menor a um percentual da venda, o success fee. Vale a pena quando
> a sua margem comporta o percentual e quando o contrato diz com clareza o que conta como venda.

Logo abaixo: sumário com links para cada H2 (gerado automaticamente, seção 8).

### H2 1 — O que é uma agência que cobra por resultado? (cerca de 200 palavras)

- Primeira frase: "É uma empresa de marketing ou de vendas que amarra o próprio pagamento ao resultado do cliente (venda,
  pedido ou contato) e não só às horas trabalhadas."
- Parágrafo-definição de **success fee** em 40 a 50 palavras (formato de trecho em destaque no Google).
- "Resultado" pode ser 4 coisas diferentes: contato (lead), reunião, pedido, venda paga. A diferença entre elas é
  onde mora a letra miúda.
- Sem imagem (a capa já está em cima).

### H2 2 — Quais são os modelos de cobrança por resultado? (cerca de 300 palavras)

- Primeira frase: "São cinco, e mudam em dois pontos: quanto você paga no mês em que nada vende e quem banca o
  tráfego."
- **Tabela em HTML de texto, nunca em imagem:**

| Modelo | Você paga sem vender? | A comissão incide sobre | Quem paga o tráfego | Onde costuma dar errado |
| :-- | :-- | :-- | :-- | :-- |
| Só comissão | Não | Venda | A agência | Ela escolhe só o que vende fácil e some quando não vende |
| Fixo + comissão | Sim, um fixo menor | Venda ou meta | Em geral você (verba de anúncio à parte) | O risco do anúncio volta para você |
| Por contato (lead) | Por contato entregue | Contato | A agência | Contato ruim custa igual a contato bom |
| Por reunião | Por reunião feita | Reunião | A agência | Reunião não é venda |
| Anuidade + comissão (a cadeira da ROI Labs) | Só a anuidade: R$ 3.960/ano, em 12x de R$ 330 | Venda concretizada | A ROI Labs | Exige margem, estoque e despacho no prazo |

- Link: "a fórmula completa está no [modelo](/modelo/)".
- **Imagem 2** (acordo com calculadora).

### H2 3 — Se a agência só ganha quando você vende, de onde vem o cliente? (cerca de 250 palavras)

- Primeira frase: "Vem da busca no Google. Quem cobra por resultado e paga cada clique do próprio bolso só aguenta
  nichos de margem muito alta, por isso esse modelo combina com a busca orgânica, em que não se paga por clique."
- Dado próprio: no Google Keyword Planner (Brasil, ago/2026), anunciantes pagam até **R$ 32,95 por clique** em
  "fitas adesivas personalizadas" (o mesmo dado da home).
- Anúncio é aluguel (parou de pagar, sumiu); página orgânica é imóvel (continua trazendo gente). Link para
  [SEO programático](/blog/o-que-e-seo-programatico-pseo-revestimentos/).
- **Quadro "Na prática"** (cerca de 100 palavras, experiência real): Search Console de usealigner.com, set/2025 a
  set/2026: **369 mil** aparições nas buscas, **4.900** visitas vindas do Google sem anúncio, posição média **4,8**.
  O site começou do zero, com tráfego 100% orgânico. Escrever "visitas", **nunca "vendas"** (regra do código da home).
- **Imagem 3** (Google no celular).

### H2 4 — Quanto custa, na prática? (cerca de 300 palavras)

- Primeira frase: "A conta tem duas linhas, a parte fixa e o percentual sobre a venda, e o que sobra é seu."
- Usar **o mesmo exemplo público do /modelo** para o site inteiro dar o mesmo número: ticket R$ 450 × 40 pedidos =
  R$ 18.000; success fee de 10% = R$ 1.800; anuidade de R$ 3.960/ano em 12x de R$ 330; fica com você R$ 15.870
  (88%). No mês sem venda o custo é R$ 330.
- Métrica que ninguém mostra: **custo por venda** = (330 + 1.800) ÷ 40 = **R$ 53,25**.
- ✅ Em 29/09/2026 o site (home, /modelo, /simulador, blog, llms.txt) e o painel passaram de R$ 2.640/ano
  (R$ 220/mês) para R$ 3.960/ano (R$ 330/mês). O site e o artigo dão o mesmo preço.
- Comparação marcada como hipótese: se 1 em cada 50 cliques comprar (2%, troque pela sua taxa), a R$ 32,95 o clique
  cada venda custaria R$ 1.647,50 só em anúncio.
- Aviso igual ao do /modelo: "Exemplo ilustrativo, não é proposta. O percentual é definido em contrato."
- **Chamada no meio do texto:** "Faça a conta com os seus números no [simulador](/simulador/)."
- Link para a conta completa agência × Growth Partner:
  [este comparativo](/blog/growth-partner-vs-agencia-revestimentos/).
- **Imagem 4** (notas de 100 reais).

### H2 5 — Quem atende o cliente e fecha a venda? (cerca de 220 palavras)

- Primeira frase: "É o ponto que mais separa um modelo do outro: a maioria das agências por resultado entrega o contato
  e para aí; quem responde, negocia e fecha é a sua equipe."
- Dado externo (conferir antes de publicar): Harvard Business Review, "The Short Life of Online Sales Leads" (2011).
  Empresas que tentavam contato em até 1 hora tinham quase 7 vezes mais chance de qualificar o contato do que as que
  esperavam mais.
- Na ROI Labs, a equipe de vendas atende todo cliente que chega pelo site, fecha a venda e entrega a venda pronta
  para a empresa (mesma versão do /modelo e da home, publicada em 29/09/2026).
- **Imagem 5** (atendente com fone). Legenda genérica e "foto ilustrativa": **nunca** legendar foto de banco como
  "nossa equipe".

### H2 6 — Depois da venda: quem fatura, entrega e fica com o cliente? (cerca de 180 palavras)

- Primeira frase: "A sua empresa, e isso precisa estar escrito: a venda sai no seu nome, você fatura e despacha, e o
  cadastro do comprador é seu."
- ROI Labs: não acompanha a entrega; a equipe trabalha a recompra desse cliente para a empresa. Fórmula já usada no
  site: "a venda sai no nome do fornecedor; o cliente compra dele; a equipe da ROI Labs trabalha a recompra".
- **Imagem 6** (pedido sendo embalado).

### H2 7 — Quando vale a pena e quando não vale? (cerca de 220 palavras)

Duas listas curtas:

- **Vale** se: a margem bruta comporta o percentual com folga para frete, imposto e devolução; o produto já vende e é
  procurado no Google; dá para manter estoque e despachar no prazo; o ticket paga o esforço de atender.
- **Não vale** se: margem muito fina; produto novo que ninguém procura ainda; precisa de resultado em 30 dias (a busca
  orgânica leva de 3 a 6 meses para estabilizar); a empresa não quer mostrar as vendas (o modelo exige relatório
  pedido a pedido).
- Lugar certo para o **desenho próprio** opcional (seção 5).

### H2 8 — O que exigir no contrato antes de assinar? (cerca de 220 palavras)

Lista numerada (formato de trecho em destaque):

1. O que conta como venda: pedido, venda paga ou venda sem devolução.
2. Até quando a venda conta depois do primeiro contato (janela de atribuição).
3. Relatório pedido a pedido e acesso aos dados (Search Console, analytics).
4. Percentual da recompra, se for diferente da primeira compra.
5. Prazo e forma de pagamento da comissão.
6. Exclusividade: a agência pode atender o seu concorrente?
7. De quem são o site, o domínio e a lista de clientes se você sair (**decisão 2**: a ROI Labs precisa ter a
   própria resposta pública antes de publicar este item).
8. Saída: aviso prévio, multa e renovação.

- **Imagem 7** (planilha de resultados).

### Fecho (cerca de 80 palavras)

Três frases de resumo + o bloco de chamada que o layout já coloca ("A próxima cadeira pode ser a do seu nicho" →
/#candidatar).

### Aviso de transparência (1 frase, perto do fim)

"A ROI Labs trabalha com um desses modelos, o de anuidade + comissão. Por isso este guia mostra também quando ele não
vale a pena."

## 4. FAQ (vira bloco visível + dado estruturado FAQPage)

Respostas prontas, de 40 a 60 palavras, primeira frase curta o bastante para busca por voz.

1. **Agência que cobra só por resultado existe?** Existe, mas é rara na forma pura. A maioria cobra um fixo menor
   mais uma comissão sobre a venda, porque alguém precisa pagar a tecnologia e o tráfego até a primeira venda.
   Desconfie de quem promete custo zero sem dizer de onde vai vir o cliente.
2. **O que é success fee?** É a taxa de sucesso: um percentual pago só sobre o resultado combinado, em geral a venda
   concretizada. Sem venda, ele é zero. Na prática costuma vir somado a uma parte fixa menor, que paga o custo de
   manter a operação no ar.
3. **Qual a comissão normal de uma agência por resultado?** Não existe tabela oficial. O percentual depende da margem
   do produto, do ticket e de quem paga o tráfego e o atendimento. A regra que protege você: a comissão precisa caber
   na margem bruta com folga para frete, imposto e devolução. Na ROI Labs, o percentual é definido em contrato.
4. **Vale mais a pena pagar comissão ou mensalidade?** Comissão vale mais quando a margem comporta o percentual e
   você não tem caixa para bancar meses de anúncio sem retorno. Mensalidade vale mais quando as vendas já são altas e
   previsíveis, porque aí um valor fixo sai mais barato do que um percentual sobre tudo.
5. **Quem fica com o cliente depois da venda?** Deveria ser sempre a sua empresa: a venda sai no seu nome e o cadastro
   do comprador é seu. Pergunte isso antes de assinar. No modelo da ROI Labs, o cliente compra do fornecedor, e a
   equipe da ROI Labs trabalha a recompra dele para a empresa.
6. **Em quanto tempo a busca orgânica começa a trazer venda?** Em geral de 3 a 6 meses até o volume estabilizar,
   porque o Google indexa e testa as páginas aos poucos. Por isso quem cobra por resultado e vive de busca orgânica
   costuma trabalhar com contrato anual: é o tempo de a conta fechar para os dois lados.

## 5. Imagens

Banco: **Pexels**. Licença: uso comercial grátis, crédito não obrigatório (vamos dar, porque ajuda a confiança e o
dado estruturado). A licença proíbe sugerir que a pessoa da foto endossa a marca, então **foto de banco nunca é
legendada como a equipe da ROI Labs**. Todas conferidas uma a uma. Descartadas: `6694916` (notas de dólar) e
`31043129` (armazém com caixas em japonês).

### Regras de alt (texto alternativo)

- Descrever o que está na foto, como se contasse para alguém que não vê. Até cerca de 125 caracteres.
- Nunca começar com "imagem de" ou "foto de".
- A palavra-chave principal aparece em **um** alt só (o da capa) e só se ficar natural. Nada de repetir busca.
- Legenda é outra coisa: fica visível, dá o contexto no texto e leva o crédito.
- Nome do arquivo em português, minúsculo, com hífen, descrevendo a foto.

### Tratamento (igual para todas)

1. Baixar do Pexels em 1600 px de largura.
2. Cortar: capa em 16:9 (1600 × 900); as do corpo em 3:2 (1600 × 1067). As duas verticais (2 e 7) cortam pelo
   centro, conferido na folha de contato.
3. Salvar como `.jpg` em `site/src/content/blog/img/agencia-que-cobra-por-resultado/`. O Astro gera WebP, largura e
   altura sozinho, o que evita a página pular enquanto carrega.
4. A capa carrega na hora (é o maior elemento da tela); as outras carregam quando a pessoa rola.

### As 7 fotos

**1 · Capa, no topo** — `empresario-analisando-custo-agencia-por-resultado.jpg`

![Empresário revisando documentos](https://images.pexels.com/photos/6694475/pexels-photo-6694475.jpeg?auto=compress&cs=tinysrgb&w=480)

- Alt: "Empresário revisa documentos financeiros sobre a mesa ao lado de um tablet, avaliando uma agência que cobra por resultado"
- Legenda: "Antes de assinar, refaça a conta da margem." Crédito: Tima Miroshnichenko / Pexels
- Página: https://www.pexels.com/photo/businessman-man-woman-desk-6694475/ (5950 × 3967)
- Reserva: `5439139` (reunião com documentos e notebook)

**2 · H2 2, modelos de cobrança** — `acordo-comissao-sobre-vendas-calculadora.jpg`

![Aperto de mão sobre mesa com calculadora](https://images.pexels.com/photos/8297625/pexels-photo-8297625.jpeg?auto=compress&cs=tinysrgb&w=480)

- Alt: "Duas pessoas apertam as mãos sobre uma mesa com calculadora e papéis"
- Legenda: "No contrato por resultado, o que conta como venda precisa estar escrito." Crédito: Mikhail Nilov / Pexels
- Página: https://www.pexels.com/photo/business-people-making-agreement-8297625/ (vertical 4000 × 6000, cortar 3:2)
- Reserva: `8069428` (aperto de mão)

**3 · H2 3, de onde vem o cliente** — `busca-no-google-pelo-celular.jpg`

![Celular com o Google aberto sobre fundo laranja](https://images.pexels.com/photos/18530501/pexels-photo-18530501.jpeg?auto=compress&cs=tinysrgb&w=480)

- Alt: "Celular sobre fundo laranja com a página de busca do Google aberta e uma lista de pesquisas"
- Legenda: "Quem procura o seu produto no Google já está com a compra na cabeça." Crédito: Click Jeth / Pexels
- Página: https://www.pexels.com/photo/google-in-smartphone-18530501/ (6000 × 4000). O laranja conversa com a cor da marca.

**4 · H2 4, a conta** — `notas-de-100-reais.jpg`

![Notas de 100 reais](https://images.pexels.com/photos/7542641/pexels-photo-7542641.jpeg?auto=compress&cs=tinysrgb&w=480)

- Alt: "Notas de 100 reais espalhadas, vistas de perto"
- Legenda: "No mês sem venda, o modelo de anuidade + comissão custa R$ 330." Crédito: Daniel Dan / Pexels
- Página: https://www.pexels.com/photo/brazilian-real-banknotes-in-closeup-7542641/ (5184 × 3456)

**5 · H2 5, quem atende** — `atendente-de-vendas-com-fone.jpg`

![Atendente com fone no escritório](https://images.pexels.com/photos/8867434/pexels-photo-8867434.jpeg?auto=compress&cs=tinysrgb&w=480)

- Alt: "Atendente com fone de ouvido sorri enquanto digita no computador, com colegas atendendo ao fundo"
- Legenda: "Quem responde o cliente rápido decide se o contato vira venda. (Foto ilustrativa.)" Crédito: Yan Krukau / Pexels
- Página: https://www.pexels.com/photo/a-smiling-woman-working-in-a-call-center-while-looking-at-camera-8867434/
- Reservas: `8691834` (atendente ao telefone), `8867630`. Alternativa sem foto de modelo: reaproveitar o desenho
  Humaaans do /modelo, que ela já escolheu (decisão 4).

**6 · H2 6, depois da venda** — `pedido-sendo-embalado-para-envio.jpg`

![Mãos embalando pedido em caixa](https://images.pexels.com/photos/7857523/pexels-photo-7857523.jpeg?auto=compress&cs=tinysrgb&w=480)

- Alt: "Mãos embalam um pedido em papel dentro de uma caixa de papelão"
- Legenda: "A venda sai no nome da empresa, que fatura e despacha." Crédito: Kampus Production / Pexels
- Página: https://www.pexels.com/photo/close-up-of-person-packing-an-order-into-a-cardboard-box-7857523/ (6016 × 4016)
- Reserva: `4487361` (dois funcionários carregando caixas no estoque)

**7 · H2 8, contrato** — `planilha-de-resultados-de-vendas.jpg`

![Notebook com planilha](https://images.pexels.com/photos/34639577/pexels-photo-34639577.jpeg?auto=compress&cs=tinysrgb&w=480)

- Alt: "Notebook aberto com uma planilha de resultados, visto por cima do ombro de quem analisa"
- Legenda: "Peça relatório pedido a pedido: é ele que prova a comissão." Crédito: Wolf Art / Pexels
- Página: https://www.pexels.com/photo/person-analyzing-data-on-laptop-screen-34639577/ (vertical 2430 × 3645, cortar 3:2)

### Imagem própria (opcional, recomendada)

Um desenho em SVG com as cores do site: **busca no Google → site da cadeira → equipe da ROI Labs atende e fecha →
empresa fatura e despacha → recompra**. Imagem que só a ROI Labs tem pesa mais para o Google Imagens e para as IAs do
que qualquer foto de banco. Alt: "Caminho da venda: da busca no Google ao pedido faturado pela empresa e à recompra".

## 6. Dados estruturados (schema)

O site já monta um `@graph` único por página (Organization + WebSite no `Base.astro`; Article + BreadcrumbList +
FAQPage no `Article.astro`). Para este artigo, e para os próximos, o grafo fica assim (só os nós da página):

```json
[
  {
    "@type": "WebPage",
    "@id": "https://roilabs.com.br/blog/agencia-que-cobra-por-resultado/#webpage",
    "url": "https://roilabs.com.br/blog/agencia-que-cobra-por-resultado/",
    "isPartOf": { "@id": "https://roilabs.com.br/#website" },
    "primaryImageOfPage": { "@id": "https://roilabs.com.br/blog/agencia-que-cobra-por-resultado/#capa" },
    "breadcrumb": { "@id": "https://roilabs.com.br/blog/agencia-que-cobra-por-resultado/#breadcrumb" }
  },
  {
    "@type": "BlogPosting",
    "@id": "https://roilabs.com.br/blog/agencia-que-cobra-por-resultado/#article",
    "headline": "Agência que cobra por resultado: como funciona, quanto custa e quando vale a pena",
    "description": "Pagar só quando vender existe, mas tem letra miúda. Veja os modelos de cobrança por resultado, a conta com números e o que exigir no contrato.",
    "image": { "@id": "https://roilabs.com.br/blog/agencia-que-cobra-por-resultado/#capa" },
    "datePublished": "AAAA-MM-DD",
    "dateModified": "AAAA-MM-DD",
    "inLanguage": "pt-BR",
    "articleSection": "Modelo de cobrança",
    "wordCount": 2300,
    "author": { "@id": "https://roilabs.com.br/autor/SLUG/#person" },
    "publisher": { "@id": "https://roilabs.com.br/#org" },
    "mainEntityOfPage": { "@id": "https://roilabs.com.br/blog/agencia-que-cobra-por-resultado/#webpage" },
    "about": [{ "@type": "Thing", "name": "Success fee" }, { "@type": "Thing", "name": "Marketing de performance" }],
    "mentions": [{ "@type": "Organization", "name": "Use Aligner", "url": "https://usealigner.com/" }]
  },
  {
    "@type": "ImageObject",
    "@id": "https://roilabs.com.br/blog/agencia-que-cobra-por-resultado/#capa",
    "contentUrl": "https://roilabs.com.br/_astro/ARQUIVO-GERADO.webp",
    "width": 1600,
    "height": 900,
    "caption": "Antes de assinar, refaça a conta da margem.",
    "creditText": "Tima Miroshnichenko / Pexels",
    "creator": { "@type": "Person", "name": "Tima Miroshnichenko" },
    "license": "https://www.pexels.com/license/",
    "acquireLicensePage": "https://www.pexels.com/photo/businessman-man-woman-desk-6694475/"
  },
  {
    "@type": "Person",
    "@id": "https://roilabs.com.br/autor/SLUG/#person",
    "name": "NOME REAL",
    "url": "https://roilabs.com.br/autor/SLUG/",
    "jobTitle": "CARGO REAL",
    "worksFor": { "@id": "https://roilabs.com.br/#org" },
    "sameAs": ["LINKEDIN DA PESSOA"]
  }
]
```

BreadcrumbList e FAQPage continuam como já são gerados. O `wordCount` e a URL da capa saem do build, não à mão.
**Não usar:** HowTo (o Google aposentou em 2023), Review e AggregateRating (avaliação da própria empresa não aparece).
Os campos `about` só ganham `sameAs` se existir uma página na Wikipédia ou no Wikidata para o termo (conferir antes).

## 7. Resultados enriquecidos: o que dá e o que não dá

| Resultado | Dá? | O que faz acontecer |
| :-- | :-- | :-- |
| Trilha (Home › Blog › Artigo) no lugar da URL | Sim | BreadcrumbList (já existe) |
| Miniatura grande e data no resultado e no Discover | Sim | capa de 1200 px ou mais + `max-image-preview:large` (falta no site) + BlogPosting com `image` |
| Selo "Licenciável" no Google Imagens | Sim | `license` e `acquireLicensePage` em cada ImageObject |
| Perguntas abertas (FAQ) no resultado do Google | **Não** | desde ago/2023 o Google só mostra para sites de governo e de saúde. O FAQPage fica porque Bing e IAs leem |
| Passo a passo (HowTo) | **Não** | aposentado em 2023 |
| Trecho em destaque (posição zero) | Talvez | parágrafo-definição, tabela e lista numerada logo abaixo de H2 em forma de pergunta |

Conferir no [Teste de pesquisa aprimorada do Google](https://search.google.com/test/rich-results) e no
[validador do schema.org](https://validator.schema.org/) antes e depois de publicar.

## 8. Mudanças no site (uma vez, servem para todos os artigos)

| # | Arquivo | Mudança |
| :-- | :-- | :-- |
| 1 | `site/src/content.config.ts` | schema vira função `({ image }) => …` com `cover: image().optional()`, `coverAlt`, `coverCredit`, `seoTitle` opcionais |
| 2 | `site/src/layouts/Article.astro` | capa com `<Image>` (carrega na hora, `fetchpriority="high"`, larguras 480/800/1200/1600); sumário a partir dos `headings` que o `render()` devolve; tempo de leitura; "Leia também" com 3 posts; nós WebPage, BlogPosting e ImageObject do item 6; autor como Person com página |
| 3 | `site/src/layouts/Base.astro` | `<meta name="robots" content="max-image-preview:large">` quando a página não é noindex; aceitar `seoTitle` sem o sufixo |
| 4 | `site/src/styles/article.css` | estilo de imagem e legenda dentro de `.prose` (largura total, cantos, legenda menor em cinza) |
| 5 | `site/src/pages/sitemap.xml.ts` | imagem da capa no sitemap (item 9) |
| 6 | `site/src/pages/autor/[slug].astro` + `site/src/data/autores.ts` | página de autor com foto real, bio, LinkedIn e dado estruturado ProfilePage + Person |
| 7 | `site/src/scripts/seo-check.mjs` | falhar o build se um post publicado tiver imagem sem alt ou capa sem crédito |

Imagem no corpo do texto em markdown: `![alt](./img/agencia-que-cobra-por-resultado/arquivo.jpg)` e, na linha
de baixo, a legenda em itálico. Caminho relativo é o que faz o Astro otimizar; HTML cru (`<img>`) não é otimizado.

## 9. Sitemap dinâmico

**Já existe e já é dinâmico:** `site/src/pages/sitemap.xml.ts` lê a coleção do blog a cada build, põe `lastmod` a
partir de `updatedDate`/`pubDate`, deixa rascunho e /obrigado/ de fora, e o `seo-check` barra URL sem barra final.
O `postbuild` já avisa Bing e Yandex pelo IndexNow, e o `llms.txt` e o RSS se atualizam sozinhos com o artigo novo.

**O que muda:** a capa de cada post entra no sitemap como imagem.

```ts
import { getImage } from 'astro:assets';
// ...
const imgs = p.data.cover ? [(await getImage({ src: p.data.cover, width: 1600 })).src] : [];
// cabeçalho: <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
//                   xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
// por URL:   <image:image><image:loc>https://roilabs.com.br${src}</image:loc></image:image>
```

Só `image:loc`: o Google deixou de ler legenda, título e licença dentro do sitemap em 2022. `lastmod` só muda quando
o texto muda de verdade (mudar a data sem mudar o texto faz o Google parar de confiar nela). As imagens do corpo o
Google acha pelo HTML.

## 10. E-E-A-T (experiência, especialidade, autoridade, confiança)

- **Quem assina:** uma pessoa real, com página de autor (foto real, bio de 80 a 120 palavras, LinkedIn, o que faz na
  ROI Labs). "Equipe ROI Labs" hoje vira só a empresa no dado estruturado, e isso é o sinal mais fraco. (decisão 1)
- **Experiência:** os números são da própria operação, com fonte e data na frase (Search Console da Use Aligner;
  Keyword Planner de ago/2026). Se o cliente autorizar, um print real do Search Console vale mais do que qualquer
  foto de banco.
- **Transparência:** a frase de aviso de que a ROI Labs vende um dos modelos comparados, e a seção "quando não vale".
- **Fontes externas:** 2 ou 3 links para fontes sólidas (HBR 2011; documentação do Google), abrindo em nova aba.
- **Falta no site (fora deste artigo, mas pesa):** não há página **/sobre/** nem **/privacidade/**, e o formulário
  coleta dados (LGPD). O dado estruturado da empresa pode ganhar endereço (Goiânia, GO), fundação e fundador, só
  com dado real.
- **Revisão:** reler a cada 3 meses; se algo mudar, atualizar texto e `updatedDate` (a data aparece como "Atualizado em").

## 11. GEO, AEO e AIO (ser citado por IA e virar resposta)

O Google diz que não há truque especial para as respostas de IA dele: vale o mesmo SEO bem feito. O que aumenta a
chance de ser citado é o texto ser fácil de recortar e de confiar. Um estudo de Princeton e da IIT Delhi (GEO,
2023) mediu até cerca de 40% mais visibilidade em respostas de IA quando o texto traz fontes, números e citações.

**Regras de escrita:**

1. Toda seção começa respondendo o próprio título em 1 ou 2 frases (máx. ~30 palavras na primeira).
2. Cada seção se entende sozinha, sem "como dito acima": a IA recorta pedaços, não lê o texto inteiro.
3. Número sempre com fonte e data na mesma frase.
4. Nomes iguais em todo o site: "ROI Labs", "Growth Partner", "cadeira", "success fee" com a mesma definição do
   /modelo e do llms.txt.
5. Definição curta (40 a 50 palavras), tabela e lista numerada: os três formatos que o Google e as IAs mais recortam.
6. Os H2 cobrem as perguntas em sequência que uma pessoa faria à IA (o que é → modelos → de onde vem o cliente →
   quanto custa → quem atende → depois da venda → quando vale → contrato). É isso que o Modo IA do Google busca
   quando desdobra uma pergunta.

**Já pronto no site:** robots.txt libera GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot e Google-Extended;
`llms.txt` gerado da coleção; IndexNow (o Bing alimenta o Copilot e parte das buscas do ChatGPT).

**Menções fora do site (o que faz a IA confiar na marca):** transformar o artigo em 1 post de LinkedIn, 1 carrossel
de Instagram e 1 vídeo curto no YouTube da ROI Labs, cada um com link para o artigo. Pedir aos sites das cadeiras um
"feito pela ROI Labs" no rodapé, com link.

## 12. SXO (a experiência de quem chega)

- **Intenção:** tabela comparativa antes de 30% do texto; resposta curta no topo.
- **Página:** sumário clicável, tempo de leitura, parágrafos de até 3 linhas no celular, imagens com largura e
  altura (a página não pula), capa rápida (meta: carregar em menos de 2,5 s no celular; as outras páginas do site
  já ficam perto de 1 s).
- **Conversão (CRO):** 3 chamadas. Depois da conta → /simulador/; depois de "quem atende" → /modelo/; no fim →
  /#candidatar (já existe). O clique no simulador vira evento no himetrica (`artigo_simulador_click`).
- **Engajamento:** "Leia também" com 3 posts, RSS, e a origem do visitante já fica gravada no formulário de
  candidatura (campo `origem`), então dá para saber qual lead veio deste artigo.

## 13. Links internos

**Do artigo para:** /modelo/, /simulador/, /#candidatar,
/blog/growth-partner-vs-agencia-revestimentos/, /blog/o-que-e-seo-programatico-pseo-revestimentos/,
/blog/exclusividade-de-cadeira-uma-loja-por-nicho-goiania/.

**Para o artigo, a partir de:** growth-partner-vs-agencia-revestimentos (na seção "Quanto custa"),
quanto-custa-loja-materiais-construcao-google-goiania, ecommerce-proprio-vs-polo-pronto, e a FAQ do /modelo "Como o
percentual do success fee é definido?". Textos de link variados e descritivos ("agência que cobra por resultado",
"o que exigir no contrato de comissão"), nunca "clique aqui".

**Achado no caminho:** o post growth-partner-vs-agencia diz "uma cadeira por nicho, por polo (cidade)", mas o site e
o llms.txt dizem "uma por nicho no Brasil inteiro". Duas versões confundem o Google e as IAs; vale alinhar.

## 14. Depois de publicar

| Quando | O quê |
| :-- | :-- |
| Dia 0 | Conferir no ar (o push em main às vezes não dispara o deploy; commit vazio resolve); Search Console → Inspeção de URL → pedir indexação; teste de pesquisa aprimorada; PageSpeed no celular |
| Semana 1 | Links internos nos posts antigos; post de LinkedIn, carrossel e vídeo curto |
| Dia 30 | Search Console: para quais buscas o artigo apareceu. Pergunta nova que aparece lá vira FAQ ou H2 |
| Dias 60 a 90 | Posição até 10 com CTR abaixo de 2% → reescrever título e descrição. Posição 8 a 20 → reforçar a seção e os links internos |
| Todo mês | Fazer as 5 perguntas do FAQ no ChatGPT, Perplexity, Gemini e Copilot e anotar se a ROI Labs é citada; no GA4, olhar visitas vindas de chatgpt.com, perplexity.ai, gemini.google.com e copilot.microsoft.com |
| A cada 3 meses | Revisar números e fontes; atualizar `updatedDate` só se o texto mudou |

Meta de resultado só depois de 2 meses de dados, sem número inventado. O Search Console não separa o clique que veio
da resposta de IA do Google; ele entra no total.

## 15. Os 25 itens do mapa "Modern SEO Cluster"

| Pilar | Item | Onde está neste plano |
| :-- | :-- | :-- |
| SEO | Technical SEO | 8, 9 |
| SEO | On-Page SEO | 2, 3, 5 |
| SEO | Topical Authority | 1, 13 (liga ao grupo "como vender pela internet sem mídia" do blog) |
| SEO | Entity & Semantic SEO | 6 (`about`, `mentions`), 11 regra 4 |
| SEO | Off-Page SEO | 11 (menções fora do site) |
| AEO | Featured Snippets | 3 (definição, tabela, lista), 7 |
| AEO | Question-Based Content | 3 (H2 em pergunta), 4 |
| AEO | Voice Search SEO | 4 (primeira frase curta), 11 regra 1 |
| AEO | FAQ Optimization | 4, 7 |
| AEO | AI Overview Optimization | 11 |
| GEO | AI Citations | 11 regras 2 e 3 |
| GEO | LLM Visibility | 11 (robots, llms.txt, IndexNow) |
| GEO | Brand Mentions | 11 (menções fora do site) |
| GEO | Entity Signals | 6, 10, 11 regra 4 |
| GEO | AI Recommendations | 14 (teste mensal nas IAs) |
| AIO | AI Search Visibility | 11 |
| AIO | AI Content Optimization | 3, 11 |
| AIO | AI Overview | 7, 11 |
| AIO | AI Mode Optimization | 11 regra 6 |
| AIO | AI Search Analytics | 14 |
| SXO | Search Intent | 1, 12 |
| SXO | UX & Page Experience | 5 (tratamento), 12 |
| SXO | CRO | 12 (3 chamadas) |
| SXO | Content Experience | 3 (resposta curta, tabela, quadro) |
| SXO | Engagement & Retention | 12, 14 |

## Decisões em aberto (dela)

- [ ] **1. Quem assina o artigo?** Precisa ser pessoa real com página de autor.
- [ ] **2. De quem são o site e o domínio se o fornecedor sair?** O artigo manda o leitor perguntar isso; a ROI Labs
  precisa ter a resposta pública. Hoje o painel (`app/src/lib/entregaveis.ts`, linha "Propriedade") diz: domínio,
  páginas, calculadoras e feed são da ROI Labs; catálogo, marca e clientes são do parceiro. Se essa é a regra, o
  artigo a diz com todas as letras; se mudou (a anuidade já prevê domínio próprio do parceiro), o painel muda antes.
- [ ] **3. Título final:** confirmar no Keyword Planner qual das 4 buscas tem mais volume.
- [ ] **4. Seção "quem atende":** foto de banco (ilustrativa) ou o desenho Humaaans do /modelo?

## Registro

- **29/09/2026 — publicado** em https://roilabs.com.br/blog/agencia-que-cobra-por-resultado/ (1.926 palavras no
  corpo + 327 no FAQ; 7 fotos do Pexels em `site/src/content/blog/img/agencia-que-cobra-por-resultado/`).
  Feito junto: itens 1 a 5 e 7 da seção 8 (capa com crédito, sumário, tempo de leitura, "Leia também", WebPage +
  BlogPosting + ImageObject, `max-image-preview:large`, `seoTitle`, capa no sitemap, alt obrigatório no
  `seo-check`), data dos posts em UTC (saía um dia antes) e links para o artigo em growth-partner-vs-agencia e
  quanto-custa-loja. **Não feito:** página de autor (item 6) e `about`/`mentions` no schema.
- Decisões 1 a 4 ainda abertas; publicado com os padrões: assinatura "Equipe ROI Labs"; item 7 do contrato sem dizer
  de quem é o domínio na ROI Labs; título sem medir volume; foto de banco com legenda "Foto ilustrativa" em
  "quem atende". O preço segue a frase do site ("R$ 3.960/ano"), sem prometer 12x sem acréscimo.
- Próximo passo dela: Search Console → Inspeção de URL → pedir indexação (seção 14).

## Fontes consultadas (29/09/2026)

- Busca pelos termos do tema: resultados de assevam.com.br, b2bweb.com.br, bridd.com.br, envox.com.br (preço de
  agência); neilpatel.com/br, rdstation.com, iclips.com.br (success fee, escrito para agências); agendor.com.br,
  salestime.com.br (terceirização de vendas).
- Google Search Central: dados estruturados de Article, metadados de licença de imagem, sitemap de imagens, meta tag
  robots, mudanças em FAQ e HowTo (ago/2023), recursos de IA na Pesquisa.
- Aggarwal et al., "GEO: Generative Engine Optimization", arXiv 2311.09735 (2023).
- Oldroyd, McElheran e Elkington, "The Short Life of Online Sales Leads", Harvard Business Review, mar/2011.
- Licença do Pexels: https://www.pexels.com/license/
- Dados próprios: `site/src/pages/index.astro` (Keyword Planner ago/2026; Search Console da Use Aligner) e
  `site/src/pages/modelo.astro` (exemplo da conta e FAQ).
