# Feature Specification: Camada Parceiro

**Feature Branch**: `007-camada-parceiro`

**Created**: 2026-07-01

**Status**: Draft — clarify concluído (sem markers abertos); pronto para `/speckit-plan`.

**Input**: User description: "Camada que liga cadeira → empresa parceira ocupante → negócios originados (pedidos pagos repassados) → success fee (% do valor fechado) → cobrança automática (Asaas). Estágio atual: nenhum parceiro contratado; a ROI usa o e-commerce de porcelanato como 'moeda de troca' — repassa reservas pagas a lojas candidatas para provar valor antes do contrato."

## Contexto de negócio

ROI Labs Growth Partner = intermediação local estilo BNI: **1 cadeira por nicho por polo, pago-pelo-sucesso**. Polo 1 = Goiânia, nicho-âncora = porcelanato. Hoje a ROI opera o porcelanato como própria (e-commerce + centros de custo Intermediação × White Label — feature 004/005) e **ainda não tem nenhum parceiro externo contratado**.

**Tática de aquisição (o "porquê" desta feature):** a ROI usa as reservas pagas do e-commerce de porcelanato como *moeda de troca* — ela entrega **a venda** a uma loja de porcelanato, provando na prática que o modelo gera receita. **Isso não significa isentar a comissão**: antes de repassar, a ROI faz uma **sondagem** com a loja (ela topa pagar a comissão e firmar a parceria?). Loja que recusa os dois é **riscada** e não recebe o repasse. O cenário ideal é a loja **pagar já no primeiro repasse e firmar a parceria**. A única "graça" é uma exceção pontual: uma loja que se compromete a firmar, mas não paga *esse primeiro* repasse — só aquele fica isento. A partir daí, todo negócio originado gera **success fee** (% negociado com aquela loja, sobre o valor do pedido), cobrado automaticamente via Asaas.

Esta camada registra parceiros, atribui negócios originados a eles, calcula a comissão e a cobra — **sem substituir** os centros de custo (que continuam sendo como a ROI contabiliza a própria operação).

## Clarifications

### Session 2026-07-01

- Q: O que conta como "negócio originado"? → A: Um **Pedido pago** (reserva do e-commerce) é a unidade de negócio; o operador o repassa/atribui a um parceiro.
- Q: Base do success fee? → A: **% sobre o total do Pedido pago à ROI** (valor da reserva; dado que o sistema já tem, sem depender de reporte da loja).
- Q: Já existe parceiro externo hoje? → A: **Não** — a camada estrutura o modelo; os repasses atuais são a "moeda de troca" para converter lojas.
- Q: Cobrança da comissão na v1? → A: **Cobrança automática via Asaas** (emite boleto/PIX e concilia pagamento).
- Q: (FR-011) De onde vem o %? → A: **Negociado por parceiro** — cada `Parceiro` tem seu percentual, guardado no cadastro/contrato dele.
- Q: (FR-008) Agrupamento das cobranças? → A: **Fatura mensal por parceiro**.
- Q: (FR-012) Quando a cobrança passa a valer? → A: **Desde o 1º repasse, por padrão** (todo negócio é faturável). NÃO há fase de demonstração grátis geral. Antes do repasse há **sondagem**: loja que recusa pagar comissão + firmar é **riscada** (não recebe repasse). Exceção pontual: o *primeiro* repasse a uma loja que se compromete a firmar mas não paga por ainda não ser parceira formal pode ser marcado **isento**. O primeiro repasse é **registro manual**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar parceiros e ligá-los a cadeiras (Priority: P1)

O operador registra uma empresa parceira ligada a um nicho/cadeira e a um polo. O parceiro tem um estágio que reflete a sondagem e o ciclo de vida: **sondagem** (sendo avaliada) → **ativa** (topou pagar comissão e firmar; recebe repasses e é cobrada) → **pausada**; ou **riscada** (recusou pagar/firmar — não recebe repasse). Origem opcional em `Candidatura` aprovada. Um parceiro ativo com contrato assinado **ocupa** a cadeira do nicho (1 por nicho/polo). O parceiro guarda o **percentual de comissão negociado** com ele.

**Why this priority**: é a entidade-âncora — sem parceiro registrado (e seu %) não há a quem repassar negócios nem cobrar. Entrega valor sozinha: dá visibilidade do funil de cada cadeira e o resultado da sondagem.

**Independent Test**: registrar 2 lojas de porcelanato na cadeira "Porcelanato" (uma ativa com %, uma em sondagem), riscar uma terceira que recusou, marcar contrato assinado na ativa; ver os estados refletidos.

**Acceptance Scenarios**:

1. **Given** uma `Candidatura` aprovada, **When** o operador a converte em parceiro, **Then** um `Parceiro` é criado ligado ao nicho/cadeira, no estágio "sondagem".
2. **Given** um parceiro em sondagem que topou pagar comissão e firmar, **When** o operador o ativa e informa o % negociado, **Then** ele passa a "ativa" e fica elegível a receber repasses e ser cobrado.
3. **Given** um parceiro que recusou pagar/firmar, **When** o operador o marca "riscada", **Then** ele não aparece como destino de repasse.
4. **Given** um parceiro ativo, **When** o contrato é assinado (data registrada), **Then** ele passa a **ocupar** a cadeira do nicho.
5. **Given** um parceiro ativo, **When** o operador o pausa, **Then** ele deixa de receber novos repasses sem perder o histórico.

---

### User Story 2 - Repassar um pedido pago a um parceiro (negócio originado) (Priority: P1)

Quando um `Pedido` de porcelanato é pago, ele fica disponível como um **negócio originado**. O operador o **repassa** a um parceiro ativo (a loja que vai atender), registrando o vínculo, o valor (valor de produto = total − frete) e o estágio (repassado → aceito → ganho → perdido). O negócio é **faturável por padrão** desde o primeiro repasse. O operador pode marcar um repasse específico como **isento** (com motivo) — o caso pontual do primeiro repasse a uma loja que se compromete a firmar mas ainda não paga. **O primeiro repasse a um parceiro é registrado manualmente.**

**Why this priority**: é o coração do modelo pago-pelo-sucesso e da "moeda de troca". Sem registrar o repasse (e se é faturável ou isento), não há base para comissão.

**Independent Test**: com um `Pedido` pago, repassá-lo manualmente a um parceiro ativo (faturável); repassar outro marcando isento (primeiro repasse pré-pagamento); acompanhar estágios até ganho/perdido.

**Acceptance Scenarios**:

1. **Given** um `Pedido` com pagamento confirmado e um parceiro **ativo**, **When** o operador registra o repasse, **Then** um negócio originado é criado vinculando `Pedido` ↔ `Parceiro` com o valor de produto (total − frete), estágio "repassado" e faturável = verdadeiro.
2. **Given** o primeiro repasse a um parceiro que firmará mas não paga esse, **When** o operador o marca **isento** com motivo, **Then** o negócio fica não-faturável (fora da cobrança).
3. **Given** um repasse faturável, **When** o negócio é concluído como "ganho", **Then** ele fica elegível para a fatura do parceiro (US3).
4. **Given** um repasse registrado, **When** o operador atualiza o estágio (aceito/ganho/perdido), **Then** o histórico do negócio reflete a mudança.
5. **Given** um parceiro **riscado ou pausado**, **When** o operador tenta repassar, **Then** ele não é oferecido como destino.

---

### User Story 3 - Calcular e cobrar o success fee via Asaas (Priority: P2)

Para cada parceiro ativo, o sistema agrega os negócios **ganhos e faturáveis** (não isentos, sem pedido reembolsado) do mês, calcula a comissão (% do parceiro × total dos pedidos), **emite a cobrança mensal automaticamente via Asaas** (boleto/PIX) e acompanha o status (emitida → paga), conciliando o pagamento quando confirmado.

**Why this priority**: é a monetização; depende de US1+US2 e de haver parceiro ativo. Entrega quando a primeira loja topa pagar.

**Independent Test**: para um parceiro ativo com negócios ganhos no mês, gerar a fatura, ver a cobrança criada no Asaas e o status atualizar para "paga" após confirmação; conferir que um negócio isento e um de pedido reembolsado ficaram de fora.

**Acceptance Scenarios**:

1. **Given** um parceiro ativo com negócios ganhos faturáveis no mês, **When** a fatura mensal é gerada, **Then** o valor = soma(% do parceiro × valor de produto (total − frete) de cada negócio) e uma cobrança é emitida via Asaas.
2. **Given** uma cobrança emitida, **When** o pagamento é confirmado, **Then** a fatura passa a "paga" e os negócios são marcados como faturados (evitando recobrança).
3. **Given** negócios **isentos** ou de `Pedido` **reembolsado**, **When** a fatura é gerada, **Then** eles são **excluídos** da cobrança.

---

### User Story 4 - Refletir a ocupação real das cadeiras no Painel (Priority: P3)

O Painel (feature 005) e o mapa de cadeiras passam a mostrar o estado **real** de cada cadeira — ocupada por parceiro contratado, em prospecção (parceiros em sondagem/ativos sem contrato), ou aberta — em vez de apenas o booleano `open` atual.

**Why this priority**: melhora a leitura do negócio, mas é cosmético frente ao núcleo (US1–US3).

**Independent Test**: com uma cadeira ocupada por parceiro contratado e outra só com parceiros em prospecção, ver o Painel refletir os dois estados distintos.

**Acceptance Scenarios**:

1. **Given** uma cadeira com parceiro contratado (contrato assinado), **When** o Painel carrega, **Then** ela aparece como "ocupada" com o nome do parceiro.
2. **Given** uma cadeira só com parceiros em sondagem/ativos sem contrato, **When** o Painel carrega, **Then** ela aparece como "em prospecção" com a contagem de parceiros.

---

### Edge Cases

- **Sondagem recusada**: loja que não topa pagar comissão nem firmar é **riscada** e nunca aparece como destino de repasse. (A loja pode mentir na sondagem — risco aceito; não há verificação automática.)
- **Primeiro repasse isento**: exceção pontual (loja que firmará mas não paga o primeiro) — marcado com motivo e excluído da cobrança; registro manual.
- **Repassar um pedido já repassado**: recusado enquanto houver um negócio ativo (≠ `perdido`) para aquele pedido (FR-004a); se o negócio anterior foi `perdido`, o pedido pode ser repassado a outro parceiro. (Prospecção com vários candidatos = repasses de **pedidos diferentes**, não do mesmo.)
- **Pedido reembolsado após repasse**: o negócio sai da base de comissão (não faturar sobre venda desfeita).
- **Parceiro pausado/riscado com histórico**: negócios e faturas do parceiro são preservados (não somem ao mudar de estágio).
- **Negócio ganho mas ainda não faturado**: elegível para a próxima fatura mensal; não pode ser faturado duas vezes.
- **Nicho da `Candidatura`/`Cadeira` é texto livre**: precisa de normalização/mapeamento para ligar candidatura → cadeira → parceiro de forma consistente.
- **Falha na criação da cobrança no Asaas**: a fatura fica em estado pendente/erro, sem marcar como paga; operação retentável.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir registrar um `Parceiro` (empresa) ligado a um nicho/cadeira e polo, com estágio (sondagem | ativa | riscada | pausada), dados de contato, **documento (CPF/CNPJ)**, **percentual de comissão negociado** e data de contrato (quando assinado). O documento é opcional na sondagem, mas **obrigatório para faturar** (necessário para criar a cobrança).
- **FR-002**: O sistema MUST permitir originar um `Parceiro` a partir de uma `Candidatura` aprovada, sem re-digitar os dados.
- **FR-003**: O operador MUST poder transicionar o estágio do parceiro (sondagem → ativa → pausada; ou → riscada) preservando o histórico; apenas parceiros **ativos** recebem repasses.
- **FR-004**: O sistema MUST registrar um **negócio originado** vinculando um `Pedido` pago a um `Parceiro` **ativo**, com o valor (**valor de produto do pedido** = total pago menos o frete) e um estágio (repassado | aceito | ganho | perdido). O primeiro repasse a um parceiro MUST poder ser registrado manualmente.
- **FR-004a**: Um `Pedido` MUST ter no máximo **um negócio ativo** (estágio ≠ `perdido`); repassar um pedido que já tem negócio ativo é recusado. Um novo repasse do mesmo pedido só é permitido se o negócio anterior foi marcado `perdido`.
- **FR-005**: Todo negócio originado MUST ser **faturável por padrão**; o operador MUST poder marcar um negócio como **isento** (com motivo), excluindo-o da cobrança — destinado ao caso pontual do primeiro repasse a parceiro que firmará mas não paga esse.
- **FR-006**: O sistema MUST permitir atualizar o estágio de um negócio originado e MUST preservar o histórico.
- **FR-007**: O sistema MUST calcular a comissão de um negócio ganho e faturável como **percentual (do parceiro) sobre o valor de produto do `Pedido`** (total pago menos o frete) — **nunca sobre o frete** (espelha a regra do desconto de cupom).
- **FR-008**: O sistema MUST agregar os negócios ganhos faturáveis de um parceiro em uma **fatura mensal por parceiro** e **emitir a cobrança automaticamente via Asaas**, acompanhando o status (emitida → paga). Faturar exige o parceiro ter **documento (CPF/CNPJ)** e **percentual** definidos.
- **FR-009**: O sistema MUST conciliar o pagamento da cobrança (via retorno do Asaas) e marcar a fatura como paga e os negócios como faturados (evitando recobrança).
- **FR-010**: O sistema MUST excluir da cobrança negócios **isentos** e negócios cujo `Pedido` foi **reembolsado**.
- **FR-011**: O percentual do success fee MUST ser **negociado por parceiro** e guardado no cadastro/contrato do `Parceiro` (cada parceiro pode ter um % distinto).
- **FR-012**: A cobrança MUST valer **desde o primeiro repasse** (todo negócio faturável por padrão); NÃO há fase de demonstração grátis geral. A única isenção é a marcação pontual de FR-005.
- **FR-013**: O Painel e o mapa de cadeiras MUST refletir o estado real da cadeira (ocupada por contratado | em prospecção | aberta), além do booleano `open` atual.
- **FR-014**: A camada Parceiro MUST coexistir com os centros de custo do porcelanato (operação própria da ROI) sem alterá-los.
- **FR-015**: Toda escrita MUST exigir autenticação de operador (padrão do admin).

### Key Entities *(include if feature involves data)*

- **Parceiro**: empresa que ocupa (ou disputa) uma cadeira de um nicho/polo. Origem opcional em `Candidatura`. Atributos: identificação/contato, **documento (CPF/CNPJ — obrigatório para faturar)**, nicho/cadeira, polo, estágio (sondagem|ativa|riscada|pausada), **percentual de comissão negociado**, data de contrato (quando assinado; determina "ocupação" da cadeira), timestamps.
- **NegócioOriginado**: vínculo entre um `Pedido` pago e um `Parceiro`. Atributos: valor (**valor de produto do pedido** = total − frete), estágio (repassado|aceito|ganho|perdido), **faturável** (padrão verdadeiro) com **motivo de isenção** opcional, referência ao `Pedido`, referência à `Fatura` quando faturado, timestamps. Um `Pedido` tem no máximo um negócio ativo (FR-004a).
- **Fatura (SuccessFee)**: cobrança mensal de comissão de um parceiro. Atributos: parceiro, mês/período, base de cálculo, valor, status (emitida|paga|erro), identificador da cobrança no Asaas, timestamps.
- **Cadeira** (existente): estado de ocupação derivado do `Parceiro` contratado (hoje só `open`).
- **Candidatura** / **Pedido** (existentes): origem do parceiro e do negócio, respectivamente — referenciados, não alterados em forma.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O operador consegue converter uma `Candidatura` aprovada em `Parceiro` (com % e estágio) e ligá-la a uma cadeira em menos de 1 minuto, sem re-digitar dados.
- **SC-002**: 100% dos `Pedidos` pagos podem ser repassados a um parceiro ativo e ter o estágio do negócio acompanhado até ganho/perdido.
- **SC-003**: Para um parceiro ativo, a fatura mensal soma corretamente % × valor de produto (total − frete) de cada negócio ganho faturável e emite a cobrança no Asaas em uma ação, sem cálculo manual.
- **SC-004**: Nenhum negócio **isento** nem negócio de `Pedido` **reembolsado** entra em cobrança.
- **SC-005**: O Painel distingue, para cada cadeira, os três estados (ocupada | em prospecção | aberta), substituindo a leitura binária `open`.
- **SC-006**: Um negócio já faturado nunca é cobrado uma segunda vez.
- **SC-007**: Um parceiro **riscado** ou **pausado** nunca é oferecido como destino de novos repasses.

## Assumptions

- A camada Parceiro é **aditiva**: os centros de custo do porcelanato (operação própria) permanecem intactos (FR-014).
- No estágio atual não há parceiro contratado; US1 e US2 têm valor imediato (estruturar sondagem/prospecção e registrar os repasses), US3 entrega quando a primeira loja topa pagar.
- A atribuição de um `Pedido` a um parceiro é **feita pelo operador** (a ROI escolhe a loja e sonda antes); o primeiro repasse é manual. Atribuição automática por nicho pode vir depois, quando uma cadeira tiver um único contratado.
- A sondagem (loja topa pagar + firmar?) é um julgamento do operador registrado no estágio do parceiro; **não há verificação automática** (a loja pode mentir — risco aceito).
- A cobrança usa **Asaas** (boleto/PIX) — dependência de integração externa a ser configurada (chaves/webhook), separada do Mercado Pago do checkout.
- Nicho de `Candidatura`/`Cadeira` (texto livre) exigirá normalização/mapeamento para vincular consistentemente candidatura → cadeira → parceiro.
