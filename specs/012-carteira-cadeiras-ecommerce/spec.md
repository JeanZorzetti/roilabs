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

### 🚩 O teto da spec 011 foi atingido — e ela previu isto

A spec 011 (fitas Tapepro) travou "vertical paralelo" e registrou o teto em antecipação:

> *"Duplicação deliberada entre os dois verticais: o teto é que **uma terceira unidade de venda
> torna a duplicação insustentável**. O caminho de upgrade — generalizar o item de pedido —
> fica registrado para quando isso acontecer (Constituição III)."*

**Este é o momento.** Das 8 cadeiras vendáveis da fase 1, **seis são SaaS de assinatura
recorrente** (`sirius`, `polarisia`, `estetiacrm`, `context`, `orion`, `vertice`). Assinatura
é a terceira unidade — e é pior que a terceira, porque é a primeira **recorrente**:
`porcelanato` vende m², `fitas` vende rolo, ambos uma vez. Um terceiro `ItemPedidoX` copiado
viraria 35 tabelas.

**Esta spec executa o caminho de upgrade que a 011 registrou.** Não é reabertura da decisão da
011 — é o gatilho dela disparando, na condição que ela mesma nomeou.

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

### Pendentes (bloqueiam `plan`)

- **[NEEDS CLARIFICATION: qual o domínio/subdomínio de destino do e-commerce reposicionado?]**
  Decide os redirects, os certificados e o que acontece com as 41 páginas pSEO + 5 guias hoje
  indexadas em `goiania.roilabs.com.br`. ⚠️ Cert Universal da Cloudflare cobre apex + **um**
  label — subdomínio de segundo nível quebra no handshake.
- **[NEEDS CLARIFICATION: quem processa o pagamento da cadeira SaaS — a ROI Labs (marketplace
  cobra e repassa) ou o parceiro (checkout dele, ROI Labs fatura o fee depois)?]** Muda tudo:
  a primeira exige split/repasse e responsabilidade fiscal; a segunda mantém o modelo atual de
  `NegocioOriginado` + `FaturaSuccessFee` e é muito mais barata.
- **[NEEDS CLARIFICATION: cadeira ocupada por projeto DA PRÓPRIA CASA conta como parceiro?]**
  `sirius`, `polarisia` e `estetiacrm` são da ROI Labs. Cobrar success fee de si mesmo infla
  faturamento com dinheiro que não existe — o mesmo defeito dos 20 pagamentos de teste da Atma.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Um item de pedido que serve qualquer unidade (Priority: P1)

Como operador da carteira, quero um caminho de dinheiro que aceite **qualquer unidade de venda**
— m², rolo, assinatura mensal, licença — para que ocupar uma cadeira nova não exija uma tabela
nova, um cálculo novo e uma tela nova a cada vez.

**Why this priority**: é o teto registrado na 011 disparando. Sem isso, cada uma das 33 cadeiras
restantes custa uma duplicação do caminho de dinheiro. É o alicerce de todas as outras histórias
e o único item desta spec que é irreversível se feito errado.

**Independent Test**: criar um pedido com um item em unidade "assinatura mensal" e outro em
"rolo" no mesmo schema, fechar os dois, e conferir que o snapshot de preço, o subtotal e a
auditoria funcionam para ambos sem código específico de vertical.

**Acceptance Scenarios**:

1. **Given** o caminho de dinheiro generalizado, **When** um pedido é fechado com item em
   unidade arbitrária, **Then** `quantidade`, `precoUnitario` e `subtotal` ficam persistidos
   como snapshot e o subtotal é recalculado no servidor.
2. **Given** os pedidos de porcelanato e de fitas já existentes, **When** a generalização entra,
   **Then** **nenhum pedido histórico muda de valor** e a auditoria de faixa das fitas continua
   reconstruível.
3. **Given** um preço vindo do cliente, **When** o servidor monta o item, **Then** o preço do
   cliente é **ignorado** e a autoridade de preço é do servidor.

---

### User Story 2 - Uma cadeira ocupada vira produto com checkout (Priority: P1)

Como cliente final, quero abrir a página de uma cadeira ocupada, ver o que é, quanto custa e
comprar ali — para que a ROI Labs origine o negócio e o parceiro receba o cliente.

**Why this priority**: é o objetivo declarado da feature. Sem isso, a carteira continua com
**receita provada de R$ 0,00** e seis cadeiras que publicam preço e não cobram.

**Independent Test**: publicar **uma** cadeira (a de menor risco entre as 6 que já servem preço),
completar uma compra de ponta a ponta em produção com cartão real, e ver o `NegocioOriginado`
nascer com a taxa de aquisição correta.

**Acceptance Scenarios**:

1. **Given** uma cadeira ocupada com preço publicado, **When** o cliente completa o checkout,
   **Then** nasce um `NegocioOriginado` classificado como **aquisição** com a taxa congelada na
   criação (spec 010).
2. **Given** um segundo pedido do **mesmo** cliente com o mesmo parceiro, **When** o checkout
   fecha, **Then** o negócio é classificado como **recorrência** e cobra a taxa menor.
3. **Given** um pagamento aprovado em `live_mode` cujo payer é conta de teste, **When** a régua
   apura receita, **Then** ele **NÃO** é contado como venda (`lib/vendas.mjs`, motivo do descarte
   na saída).
4. **Given** uma cadeira sem gateway ligado, **When** alguém abre a página, **Then** ela **não**
   oferece checkout — nunca um botão que leva a lugar nenhum.

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

- **FR-001**: O sistema DEVE representar item de pedido em **unidade arbitrária**
  (`unidade`, `quantidade`, `precoUnitario`, `subtotal`), executando o caminho de upgrade
  registrado na spec 011.
- **FR-002**: A migração DEVE preservar **valor e auditoria** de todo pedido histórico de
  porcelanato e de fitas — incluindo a faixa aplicada das fitas.
- **FR-003**: O `precoUnitario` DEVE ser **snapshot** no fechamento; mudança de tabela posterior
  não altera pedido fechado.
- **FR-004**: A autoridade de preço DEVE ser do **servidor**; valor vindo do cliente é ignorado.
- **FR-005**: O sistema DEVE suportar unidade **recorrente** (assinatura), distinguindo-a de
  unidade de compra única — é o que separa aquisição de recorrência na spec 010.
- **FR-006**: Receita apurada DEVE excluir pagamento cujo payer é conta de teste, mesmo com
  `approved` + `live_mode: true`, registrando o motivo do descarte.

**Cadeira e catálogo (P1/P3)**

- **FR-007**: O modelo de cadeira DEVE comportar os 35 projetos, com estado explícito que
  distinga ao menos: vaga · em preparação · ocupada sem produto publicado · ocupada e vendável.
- **FR-008**: Cadeira sem gateway ligado NÃO DEVE oferecer checkout.
- **FR-009**: Cadeira em estado não-vendável NÃO DEVE gerar URL pública indexável.
- **FR-010**: Cadeira ocupada por projeto **da própria casa** DEVE ser distinguível de cadeira
  ocupada por parceiro externo, em dado e na exibição.
- **FR-011**: O sistema DEVE impedir que o mesmo repositório seja contado como duas cadeiras.

**Página pública (P1)**

- **FR-012**: A página de cadeira DEVE servir conteúdo substantivo no **HTML inicial**.
- **FR-013**: A página DEVE trazer `Product`/`Offer` com preço e `FAQPage` dentro do `@graph`
  único do site.
- **FR-014**: A página DEVE ter conteúdo rico e design premium (Constituição IV) —
  **[NEEDS CLARIFICATION: qual o piso objetivo? a Atma venceu com ~870 linhas de conteúdo denso;
  a spec precisa de um critério que não seja "parece bom"]**.

**Domínio (P2)**

- **FR-015**: Toda URL indexada hoje em `goiania.roilabs.com.br` DEVE responder **301** para a
  equivalente no destino — nunca 404, nunca 302.
- **FR-016**: O sitemap do destino DEVE ser submetido e baixado com `errors: 0`.
- **FR-017**: O host de destino DEVE completar handshake TLS antes do corte.
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
- **Produto de cadeira**: o que se vende naquela cadeira. Atributos: unidade de venda, preço,
  recorrência, gateway. **Zero ou um por cadeira na fase 1** (produto único; catálogo com
  múltiplos SKUs continua exclusivo de porcelanato e fitas).
- **ItemPedido generalizado**: `unidade` + `quantidade` + `precoUnitario` + `subtotal` + snapshot
  de auditoria. Substitui a duplicação `ItemPedido` (m²) × `ItemPedidoFita` (rolo).
- **NegocioOriginado / FaturaSuccessFee**: já existem (specs 007/010). Esta feature **não**
  redefine a regra de comissão — só passa a alimentá-la a partir de mais cadeiras.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **Receita provada da carteira sai de R$ 0,00** — ao menos uma venda real
  (payer não-teste) originada pelo e-commerce, com `NegocioOriginado` e fee apurado.
- **SC-002**: Das 6 cadeiras que hoje servem preço sem gateway, **ao menos 3 passam a cobrar**
  medidas por `roihub/scripts/gateways.mjs` no balde "gateway ligado".
- **SC-003**: **Zero regressão de valor** em pedido histórico após a generalização do item de
  pedido, conferida pedido a pedido antes e depois.
- **SC-004**: Após o reposicionamento de domínio, **zero URL antes indexada respondendo 404**, e
  as impressões da malha de porcelanato voltam ao patamar pré-corte em 30 dias.
- **SC-005**: Ocupar uma cadeira nova com produto de unidade já suportada **não exige migração de
  schema** — verificado ocupando a segunda cadeira depois da primeira.
- **SC-006**: Nenhuma página de cadeira publicada serve **zero palavra** no HTML inicial.

**Baseline para comparar (GSC, 28d fechando 2026-08-04):** carteira inteira = 11.696
impressões / 186 cliques; `goiania` = 329 impressões, 2 cliques, posição mediana 59.
**Receita provada = R$ 0,00.**

## Assumptions

- O gateway das cadeiras SaaS será Mercado Pago ou Stripe conforme o que cada projeto já tem no
  `package.json` — 10 dos 35 já têm SDK escrito e nunca ligado; esta feature **liga**, não
  escolhe stack nova.
- A regra de success fee (15%/10%, spec 010) e a camada de parceiro (spec 007) **não mudam**.
- A spec 011 (fitas) fecha antes ou é migrada junto — não se generaliza um item de pedido cuja
  segunda metade ainda está sendo escrita.
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
- Reabrir a decisão de vertical paralelo da spec 011 — esta spec **executa o caminho de upgrade
  que ela registrou**, na condição que ela nomeou.
- Renomear a marca ROI Labs. Só o posicionamento do host do e-commerce está em jogo.

## Próximo passo

`clarify` — há **4 `NEEDS CLARIFICATION`** e três deles (domínio de destino, quem processa o
pagamento, cadeira da própria casa) mudam o plano inteiro. Não seguir para `plan` antes.
