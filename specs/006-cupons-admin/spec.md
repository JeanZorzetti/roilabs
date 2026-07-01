# Feature Specification: Cupons no admin

**Feature Branch**: `006-cupons-admin`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Cupons no admin da ROI Labs. Migrar os cupons hoje hard-coded em lib/cupons.ts para uma tabela Cupom no Postgres + CRUD no admin, para criar/editar/expirar cupons sem deploy. validarCupom passa a ler do DB, mantendo servidor como autoridade única e código fora do bundle do front; ajustar os dois call sites (validar route + checkout) sem quebrar o snapshot Pedido.cupomCodigo/desconto."

## Clarifications

### Session 2026-07-01

- Q: Um cupom deve ter limite de uso (nº máximo de resgates)? → A: Sem limite — resgates ilimitados enquanto ativo/dentro da validade (espelha o comportamento atual); rastrear resgates e caps de uso ficam fora de escopo.
- Q: O operador pode apagar um cupom ou só desativar? → A: Apagar (hard delete) e desativar; o snapshot no Pedido preserva o histórico, então a remoção real da linha é segura.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operador gerencia cupons sem deploy (Priority: P1)

Hoje o único cupom (`OBRA10`) está fixo no código; criar, alterar ou expirar um cupom exige um deploy. O operador da ROI Labs precisa criar, editar, ativar/desativar e expirar cupons promocionais por conta própria, a partir do admin, sem depender de um desenvolvedor nem de um novo deploy.

**Why this priority**: É o objetivo da feature e o único item que entrega valor novo. Sem isso, nada muda em relação ao estado atual.

**Independent Test**: Logar no admin, criar um cupom novo (ex.: `OBRA15`, 15%, mínimo R$ 800), e validá-lo no fluxo do site/checkout sem ter feito deploy. Editar o percentual e ver a mudança refletir na próxima validação. Desativar e ver o cupom passar a ser recusado.

**Acceptance Scenarios**:

1. **Given** o operador autenticado na página de cupons, **When** cria um cupom com código, tipo (percentual/fixo), valor e (opcional) validade e mínimo, **Then** o cupom passa a existir e a valer imediatamente, sem deploy.
2. **Given** um cupom existente, **When** o operador edita o valor ou as datas de validade, **Then** validações subsequentes usam os novos parâmetros.
3. **Given** um cupom ativo, **When** o operador o desativa, **Then** ele passa a ser recusado na validação (motivo "inativo").
4. **Given** um cupom que não deve mais valer, **When** o operador define a data-fim de validade no passado (ou remove o cupom), **Then** ele deixa de ser aceito.

---

### User Story 2 - Validação de cupom continua funcionando nos dois pontos de uso (Priority: P1)

A migração da fonte de dados (código → banco) não pode quebrar nenhum dos dois lugares onde um cupom é validado: a validação de exibição que o site estático consome (cross-origin) e a re-validação no fechamento do pedido (checkout). O cliente final aplica o cupom no carrinho do site e o vê novamente confirmado no momento da compra, com o desconto gravado no pedido.

**Why this priority**: É um requisito de continuidade — uma regressão aqui derruba a aplicação de desconto em produção. Tão crítico quanto o P1 de gestão.

**Independent Test**: Com um cupom válido no banco, exercitar a validação de exibição (site) e a criação de um pedido com cupom; conferir que o pedido grava código e desconto corretos e que o desconto bate com a regra do cupom.

**Acceptance Scenarios**:

1. **Given** um cupom válido no banco, **When** o site valida o cupom para exibir o desconto, **Then** retorna o mesmo resultado (código, tipo, valor do desconto) que retornava com o cupom em código.
2. **Given** um cupom válido, **When** um pedido é fechado com esse cupom, **Then** o desconto é recalculado pelo servidor e o pedido grava código e valor do desconto aplicados.
3. **Given** o cupom `OBRA10` existente em produção, **When** a migração entra no ar, **Then** ele continua válido com os mesmos parâmetros (10%, mínimo R$ 500, ativo) sem interrupção.

---

### User Story 3 - Operador é impedido de cadastrar cupons inválidos (Priority: P2)

Ao criar ou editar um cupom, o operador recebe mensagens claras quando informa dados incoerentes (código duplicado, percentual fora de 0–100, valor negativo, datas invertidas), antes de o cupom ser salvo.

**Why this priority**: Protege a integridade dos dados de desconto (dinheiro), mas é secundário ao caminho feliz de gestão e continuidade.

**Independent Test**: Tentar salvar cada caso inválido (código repetido, 120%, valor -10, data-início depois da data-fim) e confirmar que o salvamento é recusado com mensagem específica.

**Acceptance Scenarios**:

1. **Given** um código já existente, **When** o operador tenta criar outro cupom com o mesmo código, **Then** o salvamento é recusado por código duplicado.
2. **Given** um cupom percentual, **When** o operador informa valor > 100 ou < 0, **Then** o salvamento é recusado.
3. **Given** datas de validade, **When** a data-início é posterior à data-fim, **Then** o salvamento é recusado.

---

### Edge Cases

- **Cupom apagado depois de usado num pedido**: pedidos antigos já guardam o código e o desconto aplicados (snapshot); apagar o cupom da tabela não pode alterar nem invalidar pedidos passados.
- **Desconto maior que o subtotal**: o desconto aplicado nunca pode ser menor que zero nem maior que o subtotal do produto (já garantido pela regra de validação atual; deve permanecer).
- **Código com espaços/caixa diferente**: a validação normaliza o código (trim + maiúsculas); cadastro e consulta tratam `obra10` e `OBRA10` como o mesmo cupom.
- **Cupom sem validade**: validade-início e validade-fim são opcionais; ausência significa "sem limite" naquela ponta.
- **Mínimo não atingido**: subtotal abaixo do mínimo do cupom é recusado com motivo "mínimo".
- **Desconto sempre sobre o subtotal do produto, nunca sobre frete** (regra de negócio já decidida, não re-litigar).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O operador autenticado MUST poder criar um cupom informando: código, tipo (percentual ou fixo), valor, e opcionalmente data-início de validade, data-fim de validade, valor mínimo de subtotal, e estado ativo/inativo.
- **FR-002**: O operador MUST poder editar todos os campos de um cupom existente e ativar/desativar um cupom.
- **FR-003**: O operador MUST poder apagar um cupom (remoção real da linha, hard delete), além de desativá-lo (FR-002); apagar MUST NOT alterar nem invalidar pedidos passados que já o aplicaram (garantido pelo snapshot).
- **FR-004**: O operador MUST poder visualizar a lista de cupons existentes com seus parâmetros e estado atual.
- **FR-005**: O sistema MUST persistir os cupons de forma durável, substituindo a lista fixa em código como fonte de verdade.
- **FR-006**: A validação de cupom MUST passar a ler os cupons da fonte persistida, mantendo exatamente as mesmas regras de hoje (normalização de código, ativo, janelas de validade, mínimo, cálculo de desconto limitado a [0, subtotal]).
- **FR-007**: A validação MUST permanecer como autoridade única no servidor; o código do cupom e seus parâmetros MUST NOT ser expostos no bundle do front-end.
- **FR-008**: A validação de exibição consumida pelo site estático (cross-origin) MUST continuar funcionando após a migração, com o mesmo contrato de resposta.
- **FR-009**: A re-validação no fechamento do pedido MUST continuar recalculando o desconto no servidor e gravando código e desconto aplicados no pedido (snapshot).
- **FR-010**: O cupom `OBRA10` existente em produção MUST ser preservado com seus parâmetros atuais (percentual 10, mínimo 500, ativo) na nova fonte de dados.
- **FR-011**: O código do cupom MUST ser único (após normalização para maiúsculas) na nova fonte de dados.
- **FR-012**: O sistema MUST recusar o salvamento de um cupom inválido com mensagem específica, validando: código único, percentual em [0,100], valor fixo ≥ 0, mínimo ≥ 0, e data-início ≤ data-fim quando ambas presentes.
- **FR-013**: O acesso à gestão de cupons (página e operações de escrita) MUST exigir autenticação de operador, no mesmo padrão das demais telas administrativas.

### Key Entities *(include if feature involves data)*

- **Cupom**: regra de desconto promocional aplicável ao subtotal de produto de um pedido. Atributos: código (único, normalizado em maiúsculas), tipo (percentual ou fixo), valor, data-início de validade (opcional), data-fim de validade (opcional), valor mínimo de subtotal (opcional), estado ativo/inativo, e datas de criação/atualização. Substitui a lista fixa em código como fonte de verdade.
- **Pedido** (existente, não alterado em forma): guarda o snapshot do cupom aplicado (código + valor do desconto) no momento da compra; independe da existência futura do cupom na tabela.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O operador consegue criar um cupom novo e vê-lo aceito numa validação real sem que nenhum deploy tenha ocorrido entre o cadastro e a validação.
- **SC-002**: 100% dos cupons válidos retornam, na validação de exibição e na de checkout, o mesmo resultado (código, tipo, desconto) que retornavam com a lista em código — zero regressão funcional medida nos dois pontos de uso.
- **SC-003**: O cupom `OBRA10` permanece válido sem interrupção durante e após a migração.
- **SC-004**: Toda tentativa de salvar um cupom inválido (código duplicado, percentual fora de 0–100, valor negativo, mínimo negativo, datas invertidas) é recusada com mensagem específica — nenhum cupom inválido é persistido.
- **SC-005**: Pedidos criados antes da remoção de um cupom mantêm intactos o código e o desconto gravados, comprovando que a remoção não afeta o histórico.

## Assumptions

- O cupom `OBRA10` é migrado (seed) para a nova fonte com seus parâmetros atuais, garantindo continuidade.
- O operador pode tanto desativar quanto remover cupons; o snapshot no pedido torna a remoção segura para o histórico.
- As validades continuam com granularidade de data (sem hora), como hoje.
- O desconto continua incidindo somente sobre o subtotal do produto, nunca sobre o frete (decisão de negócio já tomada).
- A autenticação de operador e o padrão visual das telas administrativas existentes são reutilizados; nenhuma nova dependência externa é necessária.
- O escopo é apenas a entidade Cupom e seu CRUD; nenhuma outra alteração de modelo de dados está incluída.
- Cupons não têm limite de resgates: valem enquanto ativos e dentro da validade, com uso ilimitado (espelha o comportamento atual). Rastreamento de resgates, cap total de usos e limite por cliente estão **fora de escopo** desta feature (exigiriam contador/relação além da tabela Cupom).
