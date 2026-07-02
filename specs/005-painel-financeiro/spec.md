# Feature Specification: Painel Administrativo e Financeiro

**Feature Branch**: `005-painel-financeiro`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Painel administrativo + Financeiro para o admin da ROI Labs. (1) Painel inicial 'cockpit' diário agregando candidaturas, leads, pedidos e cadeiras; (2) Financeiro por período/mês com líquido real por modalidade (Intermediação × White Label) reusando os snapshots do pedido, com export CSV pro contador."

## Clarifications

### Session 2026-06-30

- Q: O modelo de cadeira só tem "aberta" vs "em estudo" (sem estado ocupada/vendida) — como o painel deve mostrar? → A: Abertas × em estudo por polo (reflete o flag `open`); ocupação real de parceiro fica fora desta feature (vai pra Camada Parceiro).
- Q: Em qual mês um pedido pago entra no financeiro? → A: Data de criação do pedido (`createdAt`); sem novo carimbo "pago em".
- Q: Como calcular a conversão lead→pedido? → A: Razão de período aproximada (pedidos pagos ÷ leads de consumidor no período), rotulada como aproximada; sem atribuição por lead.
- Q: Granularidade do CSV pro contador? → A: Uma linha por pedido pago (detalhado), reconciliando com a tela.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Painel inicial "estado do negócio hoje" (Priority: P1)

O operador (admin) abre a home do `/admin` e, sem precisar entrar em cada lista, vê de relance a saúde atual do negócio: quantas candidaturas de parceiro e leads de consumidor chegaram (24h / 7 dias), quanto foi vendido e pago no mês corrente, quais pedidos pagos estão parados esperando confirmação do fornecedor, quantas cadeiras do marketplace estão com curadoria aberta × em estudo (por polo) e uma conversão lead→pedido aproximada. Cada cartão de resumo linka para a tela de detalhe correspondente.

**Why this priority**: É a tela aberta todo dia; transforma 5 listas separadas em uma única superfície de decisão. É pura agregação de dados que já existem — nenhuma captura nova — então entrega valor imediato e isolado.

**Independent Test**: Com os registros existentes, abrir a home e conferir que cada métrica bate com uma contagem manual dos registros nas janelas indicadas, e que cada cartão navega para a lista certa.

**Acceptance Scenarios**:

1. **Given** há candidaturas e leads criados nas últimas 24h e 7 dias, **When** o operador abre o painel, **Then** cada contador bate com os registros dessas janelas.
2. **Given** existem pedidos pagos no mês corrente, **When** o painel carrega, **Then** "GMV pago do mês" e "nº de pedidos pagos" refletem apenas os pedidos pagos do mês corrente.
3. **Given** há pedidos pagos aguardando fulfillment, **When** o painel carrega, **Then** o indicador "precisa de ação" conta apenas pedidos com pagamento=pago e fulfillment=aguardando.
4. **Given** há cadeiras cadastradas por polo, **When** o painel carrega, **Then** a contagem de curadoria aberta (`open=true`) × em estudo (`open=false`) por polo bate com os registros de cadeira.
5. **Given** um cartão de resumo, **When** o operador clica nele, **Then** ele cai na tela de detalhe correspondente (candidaturas / leads / pedidos / cadeiras).
6. **Given** não há registros em uma janela, **When** o painel carrega, **Then** as métricas mostram zero sem erro.

---

### User Story 2 - Financeiro real por mês (Priority: P2)

O operador abre uma visão financeira e vê, mês a mês, o resultado **real** da operação: GMV pago, líquido por modalidade de centro de custo (Intermediação × White Label) e número de pedidos — calculado a partir do snapshot congelado de cada pedido, de modo que meses passados não mudam quando os parâmetros vigentes são alterados.

**Why this priority**: Responde "quanto entrou e quanto sobrou", separado da modelagem hipotética dos centros de custo. É insumo de direção e o que o contador precisa.

**Independent Test**: Com pedidos pagos em ≥2 meses, conferir que GMV, líquido por modalidade e contagem de cada mês batem com um cálculo manual a partir dos snapshots; e que alterar os parâmetros vigentes NÃO muda os meses passados.

**Acceptance Scenarios**:

1. **Given** pedidos pagos em vários meses, **When** o operador abre o financeiro, **Then** cada linha de mês mostra GMV pago, líquido Intermediação, líquido White Label e nº de pedidos.
2. **Given** um pedido com snapshot congelado, **When** os parâmetros vigentes são alterados depois, **Then** os números daquele mês permanecem inalterados (estabilidade de snapshot).
3. **Given** um pedido sem snapshot (anterior à feature de snapshot), **When** o mês é calculado, **Then** ele cai nos parâmetros vigentes e é contabilizado/sinalizado como "sem snapshot".
4. **Given** a divisão por modalidade, **Then** cada pedido é atribuído à sua modalidade oficial (snapshot, ou alvo vigente quando ausente).

---

### User Story 3 - Export CSV pro contador (Priority: P3)

A partir da visão financeira, o operador baixa um CSV do período selecionado para entregar à contabilidade.

**Why this priority**: Conveniência/handoff que se apoia na US2; não é necessária para ler os números na tela.

**Independent Test**: Baixar o CSV e conferir que as linhas/colunas batem com os números exibidos na tela para o período.

**Acceptance Scenarios**:

1. **Given** um período na visão financeira, **When** o operador clica em "baixar CSV", **Then** baixa um CSV com uma linha por pedido pago do período, cujos valores somam exatamente os totais da tela.
2. **Given** o destinatário é um contador brasileiro, **Then** números e datas estão em formato pt-BR legível.

---

### Edge Cases

- Mês/janela sem registros → mostra zero, sem quebrar.
- Pedido pago sem itens → contribui 0 e ainda é contado.
- Pedido legado sem snapshot → fallback nos parâmetros vigentes, sinalizado.
- Cadeira → contabilizada só pelo flag `open` (aberta × em estudo); o rótulo livre de `status` é informativo, não entra na contagem.
- Limite de mês / fuso horário → qual data coloca o pedido em qual mês (ver Assumptions).
- Conversão lead→pedido sem atribuição por lead → métrica direcional, não exata (ver Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O painel MUST exibir a contagem de candidaturas novas e leads de consumidor novos nas últimas 24h e nos últimos 7 dias.
- **FR-002**: O painel MUST exibir a contagem de candidaturas por status (funil de parceiros) e de leads por status.
- **FR-003**: O painel MUST exibir o GMV pago e o número de pedidos pagos do mês corrente.
- **FR-004**: O painel MUST exibir, como fila de ação, a contagem de pedidos com pagamento=pago e fulfillment=aguardando.
- **FR-005**: O painel MUST exibir cadeiras com curadoria aberta (`open=true`) × em estudo (`open=false`) agrupadas por polo. (Não há estado "ocupada/vendida" no modelo; ocupação real de parceiro está fora desta feature.)
- **FR-006**: O painel MUST exibir uma conversão lead→pedido aproximada dos **últimos 7 dias** (pedidos pagos ÷ leads de consumidor na janela), rotulada explicitamente como "7d, aproximada".
- **FR-007**: Cada cartão do painel MUST linkar para a tela de detalhe correspondente.
- **FR-008**: O painel MUST renderizar sem erro quando não há dados (zeros).
- **FR-009**: O financeiro MUST apresentar resultados agrupados por mês (todos os meses com pedido pago, mais recente primeiro, sem filtro de período na tela): GMV pago, líquido por modalidade (Intermediação, White Label) e nº de pedidos.
- **FR-010**: O financeiro MUST calcular cada pedido a partir do seu snapshot congelado quando presente, com fallback nos parâmetros vigentes quando ausente, e MUST manter meses passados estáveis quando os parâmetros vigentes mudam.
- **FR-011**: O financeiro MUST usar a mesma fonte de cálculo dos centros de custo (sem reimplementar/duplicar a fórmula de líquido por modalidade).
- **FR-012**: O financeiro MUST permitir exportar o período selecionado como CSV com uma linha por pedido pago (data, GMV, modalidade, líquido), cujos valores reconciliam com a tela.
- **FR-013**: Painel e financeiro MUST ser acessíveis apenas a usuários admin autenticados.
- **FR-014**: Todos os valores monetários MUST ser exibidos em BRL com formatação pt-BR.

### Key Entities *(dados já existentes — nível de negócio)*

- **Candidatura (parceiro)**: status, data de criação, categoria/nicho, cidade/polo. Funil de captação de parceiros.
- **Lead de consumidor**: status, data de criação, produto/página. Demanda do consumidor (porcelanato).
- **Pedido**: status de pagamento, status de fulfillment, total/GMV, data de criação, snapshot de custo congelado, itens.
- **Cadeira**: nicho, polo, flag de curadoria aberta (`open`) e rótulo livre de status. Mapa do marketplace. (Sem estado de ocupação por parceiro nesta feature.)
- **Parâmetros de centro de custo**: parâmetros de modalidade vigentes; fonte do fallback de cálculo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir da home do admin, o operador consegue ler o estado do dia (candidaturas/leads novos, GMV pago do mês, pedidos que precisam de ação, cadeiras abertas × em estudo) em menos de 10 segundos, sem abrir nenhuma lista.
- **SC-002**: Toda métrica do painel bate com a contagem manual dos registros subjacentes (100% de acerto) para qualquer janela escolhida.
- **SC-003**: O financeiro mostra o resultado mensal correto para pelo menos os últimos 12 meses, e meses passados não mudam quando os parâmetros vigentes são editados.
- **SC-004**: O operador exporta um período em CSV e os totais reconciliam exatamente com os números da tela.
- **SC-005**: Painel e financeiro montam o quadro completo em uma única tela cada (sem navegação em vários passos para juntar a informação).

## Assumptions

- **Cadeira: contagem por `open`** — curadoria aberta (`open=true`) × em estudo (`open=false`), por polo. O modelo NÃO tem estado "ocupada/vendida" nem vínculo com ocupante; ocupação real de parceiro é escopo da futura feature "Camada Parceiro", não desta.
- **Conversão lead→pedido é uma razão dos últimos 7 dias, aproximada** (pedidos pagos ÷ leads de consumidor na janela de 7d); não há atribuição por lead, então é direcional, não exata, e é rotulada como tal.
- **Financeiro lista todos os meses com pedido pago** (mais recente primeiro), sem filtro de período na tela; o CSV exporta todos por padrão, com `de`/`ate` (`YYYY-MM`) opcionais via URL para recortes manuais.
- **O mês de um pedido usa a data de criação (`createdAt`)** — não existe carimbo dedicado de "pago em"; a receita é atribuída ao mês de criação do pedido. Adicionar um `paidAt` no webhook fica como evolução futura se a defasagem pedido→pagamento cruzando mês virar material.
- **As janelas "novo" (24h, 7d)** são relativas ao momento em que o painel é carregado.
- **Líquido por modalidade** atribui cada pedido pago à sua modalidade oficial (snapshot, ou alvo de modalidade vigente quando sem snapshot), espelhando a agregação já feita na tela de centros de custo.
- **Autenticação reusa o admin existente**; sem novos papéis/permissões.
- **Polo único (Goiânia) hoje**, mas o agrupamento por polo já é suportado pelos dados de cadeira e não deve assumir exatamente um polo.
- **CSV destinado a contador brasileiro** (formatação numérica/data pt-BR; delimitador documentado na implementação).
- **Nenhuma dependência nova** é necessária; construído sobre dados e padrões já existentes.
