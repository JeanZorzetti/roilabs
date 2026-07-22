# Feature Specification: Success fee com duas taxas (aquisição vs recorrência)

**Feature Branch**: `010-success-fee-duas-taxas`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Success fee com duas taxas por parceiro (aquisição vs recorrência). 15% na primeira compra que a ROI Labs origina para aquele cliente, 10% nas recorrentes (cuidado de carteira). Hoje o modelo tem um único Parceiro.comissaoPct e a fatura calcula valor = base × comissaoPct (taxa única). É caminho de dinheiro — precisa ser explícito e auditável."

## Contexto

Estende a **camada 007 (parceiro)**: um `NegocioOriginado` é um Pedido pago repassado a um parceiro; a `FaturaSuccessFee` mensal cobra `base × comissaoPct` (taxa única) por parceiro. A regra comercial evoluiu: a comissão que a ROI Labs cobra é **maior na conquista de um cliente novo** e **menor na manutenção** (cuidado de carteira). A cadeira de fitas adesivas (Tapepro, ativada 2026-07-22) tornou a regra explícita — mas ela vale para **qualquer parceiro** da plataforma, não só o Tapepro.

## Clarifications

### Session 2026-07-22

- Q: A captura de CPF/CNPJ do comprador deve ser obrigatória em quais fluxos? → A: Obrigatório só no fluxo B2B/orçamento (fitas); opcional no checkout B2C (porcelanato). Não-informado → aquisição.
- Q: Quando a taxa e a classificação de um negócio são congeladas? → A: Na criação do negócio (venda/repasse), como o snapshot do ItemPedido na 007; mudar a taxa do parceiro depois só afeta negócios futuros.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Definir as duas taxas por parceiro (Priority: P1)

Como operador da ROI Labs (dono da carteira), quero definir **duas taxas de success fee** por parceiro — uma de **aquisição** (primeira compra de um cliente) e uma de **recorrência** — para cobrar a conquista mais caro que a manutenção, conforme o contrato de cada cadeira.

**Why this priority**: Sem os dois campos, é impossível representar a regra comercial vigente; hoje um único campo força uma taxa errada para metade dos negócios. É o alicerce das demais histórias.

**Independent Test**: Abrir a tela do parceiro, definir aquisição 15% e recorrência 10%, salvar, reabrir e ver os dois valores persistidos e exibidos.

**Acceptance Scenarios**:

1. **Given** um parceiro ativo, **When** o operador define taxa de aquisição 15% e recorrência 10% e salva, **Then** ambas ficam persistidas e visíveis na tela do parceiro.
2. **Given** um parceiro sem taxa de recorrência preenchida, **When** o operador tenta ativar/salvar para faturar, **Then** o sistema exige as duas taxas (não fatura com taxa faltando), coerente com a regra atual "ativa exige comissão".
3. **Given** taxas informadas fora de [0,1], **When** o operador salva, **Then** o sistema recusa com mensagem clara (caminho de dinheiro: sem valor ambíguo como 1 = 100%).

---

### User Story 2 - Faturar aplicando a taxa correta por negócio (Priority: P1)

Como operador, quero que a fatura mensal aplique **15% ao negócio de aquisição** (primeira compra daquele cliente com aquele parceiro) e **10% aos negócios de recorrência**, somando negócio a negócio — não uma taxa única sobre o total — para que a cobrança reflita a regra e seja auditável pedido a pedido.

**Why this priority**: É o coração da feature e o ponto de risco financeiro. Sem isso, definir duas taxas não muda a cobrança.

**Independent Test**: Criar dois negócios do mesmo cliente para o mesmo parceiro na mesma competência; gerar a fatura; verificar que o 1º negócio é cobrado a 15% e o 2º a 10%, e que o total da fatura é a soma por negócio.

**Acceptance Scenarios**:

1. **Given** um cliente sem histórico com o parceiro, **When** seu primeiro Pedido pago vira negócio faturado, **Then** aplica a taxa de **aquisição**.
2. **Given** um cliente que já teve um negócio anterior faturado com o parceiro, **When** um novo negócio dele é faturado, **Then** aplica a taxa de **recorrência**.
3. **Given** dois negócios do mesmo cliente novo na mesma fatura, **When** a fatura é gerada, **Then** exatamente **um** é aquisição (o mais antigo) e o restante é recorrência.
4. **Given** a fatura gerada, **When** o operador abre o demonstrativo, **Then** cada negócio mostra a taxa aplicada (aquisição/recorrência) e o valor, e a soma bate com o total da fatura (zero discrepância).

---

### User Story 3 - Compatibilidade com parceiros e faturas existentes (Priority: P2)

Como operador, quero que os parceiros e faturas já existentes (com taxa única) continuem funcionando sem mudança de valor até eu definir a taxa de recorrência, para migrar sem quebrar cobranças em curso.

**Why this priority**: Já existem parceiros da camada 007 com `comissaoPct` único e faturas emitidas; uma migração que altere valores retroativos é inaceitável no caminho de dinheiro.

**Independent Test**: Um parceiro pré-existente com taxa única segue emitindo fatura com o mesmo valor de antes até que a segunda taxa seja explicitamente definida.

**Acceptance Scenarios**:

1. **Given** um parceiro migrado com apenas a taxa antiga, **When** nada é alterado, **Then** aquisição e recorrência assumem o mesmo valor da taxa antiga e o valor da fatura não muda.
2. **Given** faturas já emitidas antes desta feature, **When** a feature entra no ar, **Then** seus valores permanecem inalterados (a taxa aplicada é congelada por negócio — snapshot).

---

### User Story 4 - Rastreabilidade da taxa por negócio (Priority: P2)

Como operador, quero que a taxa aplicada e a classificação (aquisição/recorrência) fiquem **congeladas por negócio** no momento em que o negócio é criado (venda/repasse), para que mudar as taxas do parceiro depois não altere negócios já criados nem faturas passadas.

**Why this priority**: Auditoria e disputa: a fatura tem que ser reconstituível exatamente como foi cobrada.

**Independent Test**: Faturar um negócio a 15%; depois alterar a taxa de aquisição do parceiro; reabrir a fatura e ver que o negócio continua a 15%.

**Acceptance Scenarios**:

1. **Given** um negócio faturado a uma taxa, **When** as taxas do parceiro mudam, **Then** o negócio já faturado mantém a taxa e a classificação originais.

### Edge Cases

- **Pedido sem CPF/CNPJ** (checkout B2C onde é opcional, ou Pedido legado): não casa com histórico → classificado como **aquisição** (FR-003b). Aceitável porque os parceiros B2C (porcelanato) estão migrados com as duas taxas iguais (FR-006), então a classificação não muda o valor faturado; onde as taxas diferem (B2B/fitas) o documento é obrigatório.
- **Mesmo CPF/CNPJ, formatação diferente** (pontos/traços/maiúsculas): DEVE normalizar (só dígitos) antes de comparar, senão o mesmo cliente conta duas vezes.
- **Primeiro negócio perdido/estornado**: não consome a aquisição — o próximo negócio ganho do cliente volta a ser aquisição (FR-008).
- **Negócio isento (não-faturável)** (`faturavel=false` na camada 007) porém ganho: **consome** a aquisição — o cliente foi conquistado; a isenção afeta só a cobrança, não a classificação.
- **Dois negócios do mesmo cliente na mesma competência**: qual é a aquisição — desempate pelo mais antigo (`createdAt`).
- **Parceiro com só uma taxa preenchida**: bloquear faturamento (como a regra atual "ativa exige comissão") em vez de assumir a outra silenciosamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada parceiro DEVE ter **duas taxas de success fee** — aquisição e recorrência — cada uma uma fração em [0,1], substituindo o campo de taxa única.
- **FR-002**: Ao **criar o negócio** (Pedido pago repassado ao parceiro), o sistema DEVE classificá-lo como **aquisição** (nenhum negócio ganho anterior daquele cliente com aquele parceiro) ou **recorrência**, e congelar a taxa correspondente do parceiro vigente naquele momento. A fatura mensal apenas **soma** os valores já congelados por negócio.
- **FR-003**: A classificação aquisição/recorrência DEVE identificar o "cliente" pelo **CPF/CNPJ do comprador** do Pedido (normalizado — só dígitos). Clientes com o mesmo CPF/CNPJ são o mesmo cliente para efeito de aquisição vs recorrência.
- **FR-003a**: Como o Pedido **não captura CPF/CNPJ do comprador hoje**, o campo DEVE ser adicionado ao Pedido e coletado nos fluxos. A coleta é **obrigatória no fluxo B2B/orçamento** (fitas) e **opcional no checkout B2C** (porcelanato), para não adicionar fricção ao consumidor. Pedido sem o documento é classificado como aquisição (FR-003b).
- **FR-003b**: O documento DEVE ser validado no formato (CPF ou CNPJ) e normalizado antes de comparar. Um negócio só é **recorrência** se existir um negócio ganho anterior com o **mesmo** CPF/CNPJ; sem correspondência (inclusive Pedidos legados sem documento), é **aquisição**. Consequência direta da regra de match, não um caso especial.
- **FR-004**: O valor da fatura DEVE ser a **soma, negócio a negócio**, de `base_do_negócio × taxa_aplicada` — nunca uma taxa única sobre o total.
- **FR-005**: A taxa aplicada e a classificação DEVEM ser **congeladas por negócio** (snapshot) **no momento da criação do negócio** (venda/repasse), seguindo o padrão de snapshot do `ItemPedido` da camada 007; alterações posteriores nas taxas do parceiro só afetam negócios futuros, nunca os já criados.
- **FR-006**: Parceiros existentes com taxa única DEVEM migrar sem mudança de comportamento: até a taxa de recorrência ser definida, ambas as taxas assumem o valor da taxa antiga e o valor faturado não muda.
- **FR-007**: O demonstrativo/relatório da fatura DEVE mostrar, por negócio, a classificação (aquisição/recorrência) e a taxa aplicada, e o total DEVE bater com a soma dos negócios.
- **FR-008**: A determinação de "cliente já adquirido" DEVE considerar apenas negócios anteriores **efetivamente ganhos** (não perdidos, não estornados) daquele cliente com aquele parceiro. Se o negócio inaugural de um cliente foi perdido/estornado, ele **não** consome a aquisição — o próximo negócio ganho dele volta a ser aquisição (15%).
- **FR-009**: O padrão para um novo contrato/parceiro DEVE ser **aquisição 15% / recorrência 10%** (a regra declarada), editável por parceiro.
- **FR-010**: O sistema DEVE recusar taxa fora de [0,1] com mensagem clara, evitando o erro de digitar `1` querendo dizer 1% (que hoje grava 100%).

### Key Entities *(include if feature involves data)*

- **Parceiro**: passa a ter **taxa de aquisição** e **taxa de recorrência** (hoje: uma taxa única `comissaoPct`). Demais campos da camada 007 inalterados.
- **NegócioOriginado**: um Pedido pago repassado a um parceiro. Ganha **classificação** (aquisição/recorrência) e **taxa aplicada** congeladas quando faturado; precisa expor a **identidade do cliente** (comprador do Pedido) para o agrupamento.
- **FaturaSuccessFee**: seu valor passa a ser a soma por negócio (base × taxa daquele negócio) em vez de `base × taxa única`; mantém a competência mensal e o meio de cobrança (Asaas) da camada 007.
- **Cliente** (conceitual): o comprador dos Pedidos de um parceiro, identificado pelo **CPF/CNPJ** normalizado (FR-003); é a unidade sobre a qual "primeira compra" é medida.
- **Pedido**: ganha o campo **CPF/CNPJ do comprador**, coletado no checkout/orçamento (FR-003a); é a origem da identidade do cliente propagada ao negócio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O operador consegue definir as duas taxas de um parceiro e salvá-las em menos de 1 minuto, com ambas visíveis ao reabrir.
- **SC-002**: Em qualquer fatura, **100% dos negócios** exibem a taxa aplicada e a classificação, e o total confere exatamente com a soma por negócio (zero discrepância de centavos).
- **SC-003**: Num cenário de dois pedidos do mesmo cliente novo, o primeiro é cobrado à taxa de aquisição e o segundo à de recorrência — verificável de ponta a ponta.
- **SC-004**: Após o deploy, **nenhuma fatura de parceiro existente muda de valor** enquanto a taxa de recorrência não for definida (compatibilidade retroativa).
- **SC-005**: É impossível gravar uma taxa fora de [0,1]; a tentativa de gravar `1` como "1%" é barrada ou clara sobre significar 100%.

## Assumptions

- A regra padrão **15% aquisição / 10% recorrência** é o default, mas as taxas são **por parceiro** (variam por contrato de cadeira).
- "Primeira compra" é **lifetime** — a primeira vez que aquele cliente compra via ROI Labs com aquele parceiro — não uma janela temporal.
- O success fee continua sendo **por negócio originado** (Pedido pago repassado), consistente com a camada 007; esta feature muda o **cálculo**, não o meio de cobrança (Asaas) nem a competência mensal.
- O Pedido atual **não tem CPF/CNPJ do comprador** — capturá-lo no checkout/orçamento **entra no escopo** desta feature (FR-003a), pois é a chave de identidade escolhida. O documento aceita CPF (pessoa física) e CNPJ (B2B), normalizado (só dígitos).
- Reusa a infraestrutura de fatura mensal e o demonstrativo da camada 007; o snapshot de taxa por negócio segue o padrão de snapshots já usado em `ItemPedido` (piso/comissão/alíquotas).
- A cadeira de fitas adesivas (Tapepro) ainda **não gera negócios** (o e-commerce de fitas é futuro), então não há cobrança em risco imediato; a feature deve estar pronta antes do primeiro negócio originado do Tapepro.
