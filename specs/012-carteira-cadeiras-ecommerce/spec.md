# Feature Specification: A carteira inteira como cadeiras vendáveis no e-commerce

**Feature Branch**: `012-carteira-cadeiras-ecommerce`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "Os 35 projetos serão cadeiras ocupadas na ROI Labs (institucional com foco no ICP B2B, com objetivo de conquistar mais cadeiras ocupadas), consequentemente os 35 projetos devem estar na goiania (e-commerce de todos os projetos que ocupam a carteira da ROI Labs) também. Decisões travadas (Jean, 2026-08-07): página de produto + preço + checkout por cadeira; todos os 35 entram no fim, mas a fase 1 é só quem tem produto vendável; a goiania é reposicionada porque deixa de ser geográfica."

## Contexto

O modelo comercial da ROI Labs é uma **carteira de cadeiras**: cada cadeira é um nicho,
um parceiro a ocupa, e a ROI Labs cobra success fee sobre o que origina (**15% aquisição /
10% recorrência**, spec 010). Hoje existem **8 cadeiras** em `app/src/lib/seats.ts` e
**2 ocupadas** — Tapepro (fitas, 2026-07-22) e Atma Aligner (ortodontia, 2026-07-31).

Esta feature reposiciona os dois sites em papéis explícitos:

| | Papel | Público |
|---|---|---|
| `roilabs.com.br` | **Institucional** — vende a cadeira vaga | ICP B2B (o futuro parceiro) |
| e-commerce (hoje `goiania.roilabs.com.br`) | **Carteira** — vende o produto de quem já ocupa | Cliente final de cada cadeira |

O institucional prova o modelo mostrando cadeiras ocupadas faturando; o e-commerce é onde elas
faturam. **Uma alimenta a outra**: sem cadeira ocupada visível, o institucional não tem
argumento; sem e-commerce, a cadeira ocupada não tem onde cobrar.

### O estado medido, não lembrado

Apuração de 2026-08-07 (`roihub/scripts/gateways.mjs`, 35 projetos × 10 caminhos, zero LLM,
HTTP contra produção — idêntica à de 01/08):

| balde | n | projetos |
|---|---|---|
| Gateway **ligado**, régua lendo | 1 | `atma` |
| Gateway servido, **nenhuma régua** | 1 | `orcaobra` (Kiwify, link externo) |
| **Serve preço, sem gateway** | 6 | `sirius`, `polarisia`, `estetiacrm`, `context`, `orion`, `vertice` |
| Sem caminho de cobrança | 27 | o resto |

**A leitura é "faltam 2", não "faltam 34"**: seis cadeiras já publicam preço e só falta ligar
o dinheiro. E **nem a única ligada faturou** — os 20 pagamentos da Atma são teste (payer
`test_user_…@testuser.com`). **Receita provada da carteira hoje: R$ 0,00.**

### Por que vitrine não é o produto

Medição de acesso de 2026-08-07 (`Docs/Obsidian/80-dev/atma-diferencial-de-acesso-2026-08-07.md`):
o portfólio tem **duas doenças com remédios opostos**.

- **(A) Não há demanda** — `sirius` (`crm solar` = 54 impressões/mês), `polarisia`,
  `estetiacrm`, `goiania`, `context`. Mesmo em posição #1 seriam dezenas de cliques.
- **(B) Há demanda e não há ranking** — `aftercare` (107 queries, 1.973 impressões,
  **zero clique**, posição mediana 79,5), `nimblabs` (90,7). Gargalo é autoridade de domínio.

**Uma listagem de 35 cards não conserta nenhuma das duas.** O que a consolidação num domínio
só conserta é a **(B)**: 35 domínios com zero autoridade viram um domínio acumulando. Por isso
a decisão travada é **página de produto com conteúdo, preço e checkout** — não card com link de
saída. Card de diretório não ranqueia e não cobra; é o pior dos dois mundos.

E o corolário desagradável: **para as cadeiras da doença (A), esta feature liga o dinheiro mas
não traz cliente.** Isso é aceito de propósito — ligar a cobrança é pré-requisito de faturar,
não substituto de demanda. Ver "Out of scope".

### 🚩 O teto da spec 011 NÃO disparou — e a decisão de pagamento é o motivo

A spec 011 (fitas Tapepro) travou "vertical paralelo" e registrou o teto em antecipação:

> *"Duplicação deliberada entre os dois verticais: o teto é que **uma terceira unidade de venda
> torna a duplicação insustentável**. O caminho de upgrade — generalizar o item de pedido —
> fica registrado para quando isso acontecer (Constituição III)."*

A primeira leitura desta spec foi que o teto tinha sido atingido: seis das oito cadeiras da
fase 1 são **SaaS de assinatura recorrente**, e assinatura seria a terceira unidade. **A decisão
de pagamento por tipo de cadeira (2026-08-07) desarma isso**, e vale registrar por quê — porque
o raciocínio se repete a cada cadeira nova.

**São dois eixos independentes, e só um deles é o `ItemPedido`:**

| eixo | o que decide | quem toca |
|---|---|---|
| **Unidade de venda** | m² · rolo · assinatura | `ItemPedido` — só existe se houver pedido interno |
| **Quem processa** | carrinho da ROI Labs × gateway do parceiro | fluxo de checkout |

Com "físico → ROI Labs cobra, SaaS → parceiro cobra", o carrinho da ROI Labs serve **exatamente
porcelanato (m²) e fitas (rolo)** — as duas unidades que já existem. As cadeiras SaaS **nunca
criam pedido interno**: o cliente compra no gateway do parceiro e o que nasce aqui é um
`NegocioOriginado`, que já é agnóstico de unidade (specs 007/010).

**Logo: nenhuma terceira unidade entra no `ItemPedido`, e o atalho da 011 continua válido.**
Generalizar o caminho de dinheiro agora seria construir para uma necessidade que a decisão
comercial acabou de tornar hipotética — exatamente o que a Constituição III proíbe.

**O gatilho fica registrado, redefinido com precisão:** generalizar o item de pedido quando
**uma terceira unidade entrar no carrinho da própria ROI Labs** — isto é, quando surgir uma
cadeira de produto físico/único cuja unidade não seja m² nem rolo. Cadeira SaaS nova **não**
dispara isso, por mais que se somem.

⚠️ **O preço desta escolha, declarado:** para 6 das 8 cadeiras da fase 1, a ROI Labs **não vê o
dinheiro passar**. A apuração de receita e de success fee passa a depender de webhook do gateway
do parceiro ou de informe dele — e "o parceiro informa" é uma fonte que esta casa já sabe que
apodrece. Ver FR-005 e o risco em Success Criteria.

## Clarifications

### Session 2026-08-07 (decisões do Jean, não reabrir)

- Q: O que "o projeto está no e-commerce" significa por projeto? → A: **Página de produto +
  preço + checkout.** Uma URL por cadeira, com preço servido e checkout real. Não é vitrine com
  link de saída, e não é replicar a vertical completa do 011 (catálogo/filtros/SKUs) para
  cadeira de produto único.
- Q: Escopo — quais dos 35 entram? → A: **Todos os 35 no fim; a fase 1 é só quem tem produto
  vendável.** Os demais precisam ser *transformados em vendáveis*, e isso é trabalho de produto,
  não desta feature — mas o modelo de dados já nasce comportando os 35.
- Q: A goiania hoje é site de material de construção em Goiânia; 35 nichos diluem a coerência
  tópica. → A: **Reposicionar o domínio.** Deixa de ter recorte geográfico; porcelanato vira uma
  vertical entre outras.

### Session 2026-08-07 — segunda rodada (decisões do Jean, não reabrir)

- Q: Quem processa o pagamento da cadeira SaaS? → A: **Depende do tipo de cadeira.** Produto
  físico → carrinho da ROI Labs (porcelanato, fitas). SaaS → **gateway do parceiro**; a ROI Labs
  registra o negócio e fatura o success fee depois. Consequência de engenharia registrada acima:
  isto **desarma** a generalização do `ItemPedido`.
- Q: Cadeira ocupada por projeto da própria casa conta como parceiro? → A: **Marcada como "da
  casa" SEMPRE no dado interno** (nunca gera success fee de si mesma). **No site público, exibida
  como parceiro**, com **três exceções que aparecem como "da casa" também publicamente:
  `sirius`, `meridian` e `orion`.**
- Q: Para onde vai o e-commerce reposicionado? → A: **Subdomínio novo em `roilabs.com.br`**
  (um label, coberto pelo cert Universal da Cloudflare). A malha de porcelanato vem junto por
  301, sob pasta própria.

### Session 2026-08-07 — terceira rodada

- Q: Como a venda do parceiro chega até aqui? → A: **Webhook por gateway.** Nada de informe
  manual. Consequência medida: **são 3 integrações, não 8** — as 8 cadeiras da fase 1 usam
  Mercado Pago (5), Stripe (3) e Kiwify (1). *Webhook por gateway ≠ webhook por cadeira.*

### Pendentes

- **[NEEDS CLARIFICATION: qual o label do subdomínio?]** Não bloqueia o `plan` — assumido
  `loja.roilabs.com.br` (ver Assumptions); trocar o label é uma linha de config enquanto o corte
  não aconteceu.

### ⚠️ Risco registrado na decisão da cadeira da casa

Exibir publicamente como parceiro uma cadeira que é da casa é **decisão de posicionamento do
Jean**, tomada com o risco declarado: o institucional usa cadeira ocupada como **prova social**
para o ICP B2B, e 5 das 8 cadeiras da fase 1 seriam da casa exibidas como externas. O limite
que esta spec impõe é objetivo e não negociável: **nenhum número de faturamento, fee ou
"receita da carteira" pode somar cadeira da casa** (FR-010). Posicionamento é escolha; número
inflado é o mesmo defeito dos 20 pagamentos de teste da Atma.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A venda da cadeira SaaS chega até a carteira (Priority: P1)

Como operador da carteira, quero que uma compra feita no **gateway do parceiro** vire um
`NegocioOriginado` aqui — sem pedido interno e sem eu digitar nada — para que o success fee seja
apurável por máquina em vez de declarado.

**Why this priority**: é o que a decisão de pagamento por tipo de cadeira criou. Seis das oito
cadeiras da fase 1 vendem fora do carrinho da ROI Labs; se a venda não chega até aqui
automaticamente, **a receita da carteira vira um número escrito à mão** — e esta casa já mediu o
que acontece com número escrito à mão (quatro contagens defasadas do mesmo fato no corpus).
Sem esta história, `SC-001` não é verificável.

**Independent Test**: completar uma compra real no gateway de **uma** cadeira SaaS e ver o
`NegocioOriginado` nascer sozinho, classificado e com a taxa congelada — sem intervenção manual.

**Acceptance Scenarios**:

1. **Given** uma cadeira SaaS ligada, **When** um cliente completa a compra no gateway do
   parceiro, **Then** nasce um `NegocioOriginado` com taxa congelada na criação (spec 010), sem
   `Pedido` interno.
2. **Given** o mesmo evento entregue duas vezes (retry do gateway), **When** processado,
   **Then** o negócio **não** duplica — caminho de dinheiro é idempotente por id do evento.
3. **Given** um pagamento aprovado em `live_mode` cujo payer é conta de teste, **When** a régua
   apura receita, **Then** ele **NÃO** conta como venda (`lib/vendas.mjs`), com o motivo do
   descarte na saída.
4. **Given** um evento que a ROI Labs não consegue atribuir a nenhuma cadeira, **When**
   recebido, **Then** ele é registrado como não-atribuído e **falha fechada** — nunca somado a
   uma cadeira por aproximação.
5. **Given** uma cadeira **da casa**, **When** uma venda dela é registrada, **Then** ela entra
   como receita direta e **não** gera success fee (FR-010).

---

### User Story 2 - Uma cadeira ocupada vira produto comprável (Priority: P1)

Como cliente final, quero abrir a página de uma cadeira ocupada, ver o que é, quanto custa e
comprar — sem descobrir no meio do caminho que ali não se compra nada.

**Why this priority**: é o objetivo declarado da feature. Sem isso, a carteira continua com
**receita provada de R$ 0,00** e seis cadeiras que publicam preço e não cobram.

**Independent Test**: publicar **uma** cadeira entre as 6 que já servem preço, completar uma
compra de ponta a ponta em produção com cartão real, e ver o `NegocioOriginado` nascer com a
taxa de aquisição correta.

**Acceptance Scenarios**:

1. **Given** uma cadeira de **produto físico**, **When** o cliente compra, **Then** o fluxo é o
   carrinho da ROI Labs e nasce um `Pedido` — sem mudança no caminho de dinheiro existente.
2. **Given** uma cadeira **SaaS**, **When** o cliente clica em comprar, **Then** ele é levado ao
   gateway do parceiro com atribuição que permita ligar a venda de volta à cadeira (US1).
3. **Given** um segundo negócio do **mesmo** cliente com o mesmo parceiro, **When** ele fecha,
   **Then** é classificado como **recorrência** e cobra a taxa menor (spec 010).
4. **Given** uma cadeira **sem** gateway ligado, **When** alguém abre a página, **Then** ela
   **não** oferece checkout — nunca um botão que leva a lugar nenhum.
5. **Given** o cliente sai para o gateway do parceiro, **When** a transição acontece, **Then**
   fica explícito de quem é a página de pagamento — comprador que não sabe a quem está pagando
   é chargeback.

---

### User Story 3 - A página da cadeira é conteúdo, não card (Priority: P1)

Como visitante vindo da busca, quero uma página que responda a pergunta que me trouxe —
tipicamente **quanto custa** — para que ela ranqueie e converta em vez de me despachar para
outro domínio.

**Why this priority**: é a única alavanca de SEO desta feature e a lição direta da medição da
Atma: **86% do tráfego dela vem de uma página que responde uma pergunta de preço inteira**, e o
esforço por artigo não prediz nada (o vencedor é o 6º maior de 22). Página fina replicada 35×
produz 35 páginas finas.

**Independent Test**: publicar a página de uma cadeira, submeter à indexação, e conferir em
30 dias que ela recebe impressões para queries **não-branded** — não só para o nome do produto.

**Acceptance Scenarios**:

1. **Given** a página de uma cadeira, **When** o Googlebot a busca, **Then** ela serve conteúdo
   substantivo **no HTML inicial** — não shell de SPA (3 projetos da casa servem zero palavra).
2. **Given** a página publicada, **When** validada, **Then** traz `Product`/`Offer` com preço e
   `FAQPage` no `@graph` único do site.
3. **Given** uma cadeira cujo produto não tem demanda de busca medível, **When** a página é
   escrita, **Then** ela existe para **converter**, e nenhuma meta de tráfego é prometida
   para ela.

---

### User Story 4 - O domínio deixa de ser geográfico sem perder o que já ranqueia (Priority: P2)

Como dono da carteira, quero reposicionar o e-commerce para que ele comporte 35 nichos — sem
descartar as 41 páginas pSEO + 5 guias de porcelanato que já têm histórico no GSC.

**Why this priority**: é pré-requisito de coerência para as cadeiras não-construção, mas **é a
história de maior risco de regressão** da spec. Depende do domínio de destino, ainda não
decidido.

**Independent Test**: após o corte, cada URL antiga responde 301 para a nova, o sitemap novo é
baixado com `errors: 0`, e as impressões da malha de porcelanato voltam ao patamar anterior.

**Acceptance Scenarios**:

1. **Given** as URLs indexadas hoje, **When** o reposicionamento entra, **Then** **toda** URL
   antiga responde **301** para a equivalente nova — nunca 404, nunca 302.
2. **Given** o site reposicionado, **When** o GSC é consultado 30 dias depois, **Then** a
   propriedade nova acumula as impressões da malha antiga.
3. **Given** o corte, **When** o certificado é emitido, **Then** o host de destino completa o
   handshake TLS (⚠️ cert Universal cobre apex + **um** label).

---

### User Story 5 - Cadeira vaga é vendida ao ICP B2B no institucional (Priority: P2)

Como futuro parceiro chegando ao institucional, quero ver quais cadeiras estão ocupadas
(**com prova**) e quais estão vagas, para decidir ocupar uma.

**Why this priority**: é o objetivo declarado do institucional ("conquistar mais cadeiras
ocupadas"). Depende de haver cadeira ocupada faturando — por isso vem depois de P1.

**Independent Test**: abrir o institucional deslogado, ver a lista de cadeiras com estado real
vindo de `/api/cadeiras`, e completar uma candidatura.

**Acceptance Scenarios**:

1. **Given** o mapa de cadeiras no banco, **When** o institucional carrega, **Then** o estado
   exibido vem da API ao vivo e o skeleton estático é só fallback sem JS.
2. **Given** uma cadeira **ocupada**, **When** exibida, **Then** ela não é oferecida para
   candidatura.
3. **Given** uma cadeira ocupada por projeto **da própria casa**, **When** exibida como prova,
   **Then** ela é rotulada como tal — prova social falsa é a mesma classe de defeito que somar
   pagamento de teste como receita.

---

### User Story 6 - As 27 cadeiras sem produto entram sem virar página fina (Priority: P3)

Como dono da carteira, quero que os 27 projetos sem caminho de cobrança tenham um estado
explícito na carteira — para que "todos os 35 estão lá" seja verdade sem publicar 27 páginas
vazias que derrubam a qualidade média do domínio.

**Why this priority**: é o "depois transformar os outros em vendáveis" da decisão travada. O
modelo de dados precisa comportá-los **agora**; a publicação de cada um é trabalho de produto,
um a um.

**Independent Test**: cadastrar um dos 27 como cadeira em estado "em preparação" e conferir que
ele aparece no admin, **não** gera URL pública indexável e **não** oferece checkout.

**Acceptance Scenarios**:

1. **Given** uma cadeira sem produto vendável, **When** cadastrada, **Then** ela existe no
   modelo com estado próprio e **não** produz página pública indexável.
2. **Given** essa cadeira, **When** um produto com preço é publicado para ela, **Then** a
   transição para "ocupada/vendável" não exige mudança de schema.
3. **Given** 4 projetos cujo host serve **tudo em 200** (`tapevision`, `potencialarquitetado`,
   `pathfinder` — shell de SPA), **When** o estado deles é apurado, **Then** o "200" daquele host
   **não** é lido como caminho de cobrança existente.

### Edge Cases

- Cadeira cujo parceiro sai: o que acontece com pedidos abertos, com a URL indexada e com o
  estado da cadeira? (URL que vira 404 depois de ranquear é destruição de ativo.)
- Duas cadeiras no **mesmo** nicho (ex.: `sirius` e `estetiacrm` são ambos CRM; `estetiacrm` é
  fork do `sirius`): o mapa de cadeiras hoje é 1 nicho = 1 cadeira, e canibalização é o risco
  clássico dessa colisão.
- `goiania` e `roilabs` são **o mesmo repositório** — card ≠ repositório. Contá-los como duas
  cadeiras infla a carteira.
- Cliente compra de **duas** cadeiras diferentes: é aquisição nas duas (a classificação é por
  cliente × parceiro, não por cliente).
- Projeto que já cobra fora do site (`sirius` fatura por tier no próprio banco): entra como
  cadeira ocupada com checkout no e-commerce, ou como ocupada sem produto publicado?

## Requirements *(mandatory)*

### Functional Requirements

**Caminho de dinheiro (P1)**

- **FR-001**: O caminho de dinheiro de porcelanato e de fitas **NÃO muda**. `ItemPedido` (m²) e
  `ItemPedidoFita` (rolo) permanecem como estão — o gatilho de generalização da spec 011 não
  disparou (ver Contexto) e generalizar agora seria construir para necessidade hipotética.
- **FR-002**: Cadeira **SaaS** NÃO DEVE criar `Pedido` interno. A venda vira `NegocioOriginado`
  diretamente, que já é agnóstico de unidade (specs 007/010).
- **FR-003**: A venda do parceiro DEVE chegar por **webhook do gateway**, sem digitação manual.
  São **3 adaptadores** (Mercado Pago, Stripe, Kiwify) cobrindo as 8 cadeiras da fase 1.
- **FR-003a**: A assinatura do webhook DEVE ser verificada **antes de tocar qualquer estado**, com
  o segredo **daquela conta de parceiro** — não um segredo global. Assinatura inválida → 401 e log.
- **FR-003b**: O status da venda DEVE ser lido **do gateway**, nunca do corpo da notificação —
  o corpo é entrada não-confiável no caminho de dinheiro.
- **FR-004**: O registro DEVE ser **idempotente por (gateway, id do evento)** — retry de gateway
  não pode duplicar negócio.
- **FR-005**: Evento não atribuível a nenhuma cadeira DEVE **falhar fechada**: registrado como
  não-atribuído com o payload preservado, nunca somado a uma cadeira por aproximação.
- **FR-005a**: O webhook existente `/api/pagamentos/webhook` (porcelanato/fitas, conta da própria
  ROI Labs) **NÃO DEVE ser alterado** — é o caminho que fatura hoje.
- **FR-006**: Receita apurada DEVE excluir pagamento cujo payer é conta de teste, mesmo com
  `approved` + `live_mode: true`, registrando o motivo do descarte (`lib/vendas.mjs`).
- **FR-006a**: A taxa aplicada DEVE ser congelada na **criação** do negócio (spec 010); mudar a
  taxa do parceiro depois só afeta negócios futuros.

**Cadeira e catálogo (P1/P3)**

- **FR-007**: O modelo de cadeira DEVE comportar os 35 projetos, com estado explícito que
  distinga ao menos: vaga · em preparação · ocupada sem produto publicado · ocupada e vendável.
- **FR-008**: Cadeira sem gateway ligado NÃO DEVE oferecer checkout.
- **FR-009**: Cadeira em estado não-vendável NÃO DEVE gerar URL pública indexável.
- **FR-010**: Cadeira da casa DEVE ser marcada como tal **no dado, sempre**, e **nunca gerar
  success fee de si mesma** — a receita dela entra como receita direta. **Nenhum agregado de
  faturamento, fee ou "receita da carteira" pode somar cadeira da casa.**
- **FR-010a**: A exibição pública é **independente** da marcação interna: cadeira da casa é
  exibida como parceiro, **exceto `sirius`, `meridian` e `orion`**, que aparecem como "da casa"
  também publicamente. A lista de exceções é dado, não condição no código.
- **FR-011**: O sistema DEVE impedir que o mesmo repositório seja contado como duas cadeiras
  (`goiania` e `roilabs` são o mesmo repo).

**Página pública (P1)**

- **FR-012**: A página de cadeira DEVE servir conteúdo substantivo no **HTML inicial**.
- **FR-013**: A página DEVE trazer `Product`/`Offer` com preço e `FAQPage` dentro do `@graph`
  único do site.
- **FR-014**: A página DEVE ter conteúdo rico e design premium (Constituição IV), com **piso
  objetivo**: ≥ 800 palavras no HTML inicial, a pergunta de preço respondida **explicitamente**
  no corpo (não só no `Offer`), e ≥ 6 pares de FAQ. É **piso contra página fina, não promessa de
  ranking** — a medição da Atma provou que esforço por artigo não prediz tráfego (o vencedor é o
  6º maior de 22). Contar palavra **não** se faz com `sed 's/<script[^>]*>.*<\/script>//g'`: em
  HTML minificado o `.*` guloso come até o último `</script>` e devolve 0 palavra em página com
  `<h1>`.

**Domínio (P2)**

- **FR-015**: Toda URL indexada hoje em `goiania.roilabs.com.br` DEVE responder **301** para a
  equivalente no subdomínio de destino — nunca 404, nunca 302.
- **FR-016**: O sitemap do destino DEVE ser submetido e baixado com `errors: 0`. ⚠️ Status 200 no
  sitemap **não** prova deploy: validar o corpo (`<?xml`), nunca o status.
- **FR-017**: O host de destino DEVE completar handshake TLS **antes** do corte, verificado sem
  `curl -k` — a flag esconde exatamente o erro de cert que derruba o browser.
- **FR-017a**: O destino DEVE ser um subdomínio de **um label** sob `roilabs.com.br` (cert
  Universal da Cloudflare cobre apex + um label; um segundo nível quebra no handshake, como já
  acontece com `www.sirius` e `www.goiania`).
- **FR-018**: A malha pSEO de porcelanato (41 páginas + 5 guias) DEVE permanecer intacta em
  conteúdo — ela é a moeda de troca que vende a cadeira vaga (spec 011).

**Institucional (P2)**

- **FR-019**: O institucional DEVE exibir o estado das cadeiras a partir de `/api/cadeiras` ao
  vivo, com o skeleton estático como fallback sem JS.
- **FR-020**: Cadeira ocupada NÃO DEVE ser oferecida para candidatura.

### Key Entities

- **Cadeira**: um nicho da carteira. Atributos: nicho, estado, projeto/parceiro que a ocupa,
  origem (casa × externo), produto vendável associado. Hoje vive em `app/src/lib/seats.ts`
  (SEED) + banco (fonte de verdade).
- **Produto de cadeira**: o que se vende naquela cadeira. Atributos: preço, recorrência, **modo
  de cobrança** (carrinho da ROI Labs × gateway do parceiro) e destino do checkout. **Zero ou um
  por cadeira na fase 1**; catálogo com múltiplos SKUs continua exclusivo de porcelanato e fitas.
- **`ItemPedido` / `ItemPedidoFita`**: **inalterados**. Continuam servindo só as cadeiras de
  produto físico com carrinho próprio.
- **NegocioOriginado / FaturaSuccessFee**: já existem (specs 007/010). Esta feature **não**
  redefine a regra de comissão — passa a alimentá-la a partir de mais cadeiras, e a **excluir**
  cadeira da casa dela (FR-010).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **Receita provada da carteira sai de R$ 0,00** — ao menos uma venda real (payer
  não-teste, cadeira **não** da casa) com `NegocioOriginado` e fee apurado, **nascida de webhook
  sem intervenção manual**.
- **SC-001a**: ⚠️ **O webhook prova que a venda ocorreu, NUNCA que todas ocorreram.** O parceiro
  controla a conta do gateway, e o incentivo dele é **sub-reportar** (o fee incide sobre o que
  chega). Completude não é verificável por esta feature; qualquer número publicado DEVE dizer
  "vendas reportadas por webhook", nunca "vendas do parceiro".
- **SC-002**: Das 6 cadeiras que hoje servem preço sem gateway, **ao menos 3 passam a cobrar**,
  medidas por `roihub/scripts/gateways.mjs` — mas **o balde muda**: cadeira SaaS com checkout no
  parceiro sai como "gateway servido", não "ligado". O critério é o balde correto para o modo de
  cobrança, não o balde "ligado" para todas.
- **SC-003**: **Zero regressão** nos caminhos de dinheiro existentes: nenhum pedido de porcelanato
  ou de fitas muda de valor, conferido pedido a pedido antes e depois.
- **SC-004**: Após o reposicionamento, **zero URL antes indexada respondendo 404**, e as
  impressões da malha de porcelanato voltam ao patamar pré-corte em 30 dias.
- **SC-005**: Ocupar a **segunda** cadeira SaaS depois da primeira **não exige migração de
  schema** nem código específico daquela cadeira.
- **SC-006**: Nenhuma página de cadeira publicada serve menos que o piso de FR-014 no HTML
  inicial, medido com contador que não seja o `sed` guloso.
- **SC-007**: Evento de venda entregue duas vezes produz **um** negócio (FR-004), verificado
  reenviando o mesmo evento em produção.

**Baseline para comparar (GSC, 28d fechando 2026-08-04):** carteira inteira = 11.696
impressões / 186 cliques; `goiania` = 329 impressões, 2 cliques, posição mediana 59.
**Receita provada = R$ 0,00.**

## Assumptions

- **Subdomínio de destino assumido: `loja.roilabs.com.br`.** Um label, coberto pelo cert
  Universal. Trocar o label é config enquanto o corte não aconteceu.
- O gateway das cadeiras SaaS será Mercado Pago ou Stripe conforme o que cada projeto já tem no
  `package.json` — 10 dos 35 já têm SDK escrito e nunca ligado; esta feature **liga**, não
  escolhe stack nova.
- A regra de success fee (15%/10%, spec 010) e a camada de parceiro (spec 007) **não mudam**.
- A spec 011 (fitas) segue independente: como `ItemPedido` não é mais tocado, esta spec **não
  bloqueia nem é bloqueada** por ela.
- Os 27 projetos sem caminho de cobrança **não ganham página pública** nesta feature.
- Ligar cobrança **não cria demanda de busca**: para as cadeiras da doença (A), o resultado
  esperado é conversão do tráfego que já existe, não crescimento de tráfego.
- `prisma db push` é **manual**, de uma máquina que alcança o host (Constituição).

## Out of scope

- **Criar demanda para as cadeiras sem busca.** Diagnóstico de produto/mercado, não de conteúdo.
- **Resolver autoridade de domínio de `aftercare` e `nimblabs`** (doença B, posição mediana 79,5
  e 90,7). A consolidação ajuda no longo prazo; nada nesta feature move isso em 90 dias.
- **Transformar os 27 em vendáveis.** É o "depois" da decisão travada — um projeto por vez.
- Catálogo com múltiplos SKUs, filtros e comparador para cadeira nova (continua exclusivo de
  porcelanato e fitas).
- **Generalizar `ItemPedido` para unidade arbitrária.** Adiado com gatilho explícito: fazer
  quando **uma terceira unidade entrar no carrinho da própria ROI Labs** — cadeira de produto
  físico cuja unidade não seja m² nem rolo. Cadeira SaaS nova **não** dispara, por mais que se
  somem *(Constituição III: atalho deliberado, teto e caminho de upgrade registrados)*.
- Split payment, repasse e responsabilidade fiscal sobre o total transacionado — consequência do
  modelo "ROI Labs cobra e repassa", que **não** foi escolhido.
- Renomear a marca ROI Labs. Só o posicionamento do host do e-commerce está em jogo.

## Próximo passo

`tasks` — **zero `NEEDS CLARIFICATION` bloqueante** após três rodadas em 2026-08-07; o único
restante (label do subdomínio) é config e não trava nada. Plano em [plan.md](./plan.md).

Duas das três respostas **reduziram o escopo** em vez de aumentá-lo: pagamento por tipo de
cadeira tirou a generalização do `ItemPedido` do caminho crítico, e webhook por gateway virou
**3 adaptadores em vez de 8**. Começar pela **Fase 0** do plano — ela pode eliminar um adaptador
inteiro antes da primeira linha de código.
