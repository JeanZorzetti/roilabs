# Feature Specification: Cobrança recorrente de assinatura

**Feature Branch**: `014-cobranca-recorrente`

**Created**: 2026-08-08

**Status**: Draft

**Input**: User description: "Ligar a renovação automática sobre o modelo de assinatura que a 013 deixa pronto: cobrar do 2º ciclo em diante, tratar falha de cobrança e cancelamento. A 013 cobra apenas o 1º ciclo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cobrança automática dos ciclos seguintes (Priority: P1)

Um comprador assina um plano recorrente e paga o primeiro ciclo. Quando chega a data de
renovação, o sistema cobra o ciclo seguinte automaticamente, sem exigir que o comprador volte ao
checkout ou informe o pagamento de novo.

**Why this priority**: É o motivo da feature existir. Sem isto, toda assinatura vale por um
ciclo só e o comprador precisa comprar de novo manualmente — o que não é uma assinatura, é uma
compra avulsa disfarçada.

**Independent Test**: Assinar um plano de teste, aguardar (ou simular) a chegada da data de
renovação, e conferir que uma nova cobrança do mesmo valor foi registrada sem nenhuma ação do
comprador.

**Acceptance Scenarios**:

1. **Given** uma assinatura ativa com o 1º ciclo pago, **When** chega a data de renovação,
   **Then** o sistema cobra o valor do ciclo automaticamente e registra o resultado.
2. **Given** uma cobrança de renovação bem-sucedida, **When** o comprador consulta seu histórico,
   **Then** o novo ciclo aparece como pago, com a mesma clareza que o 1º ciclo.

---

### User Story 2 - Falha de cobrança não cancela a assinatura sozinha (Priority: P1)

A cobrança de um ciclo falha (cartão recusado, saldo insuficiente, etc.). O sistema não trata
isso como cancelamento imediato: tenta de novo dentro de uma janela definida e avisa o
comprador, para dar chance de ele resolver (trocar cartão, garantir saldo) antes de perder o
acesso.

**Why this priority**: Cancelar no primeiro erro perde assinantes por motivos recuperáveis (cartão
vencido, saldo baixo por um dia). É o comportamento que qualquer cobrança recorrente real precisa
ter para não sangrar receita por atrito evitável.

**Independent Test**: Forçar a falha de uma cobrança de renovação e conferir que (a) uma nova
tentativa acontece depois, (b) o comprador é avisado, e (c) a assinatura continua "ativa" (não
"cancelada") enquanto a janela de novas tentativas não se esgota.

**Acceptance Scenarios**:

1. **Given** uma cobrança de renovação que falha, **When** o sistema processa a falha, **Then** a
   assinatura muda para um estado de "inadimplente" (não "cancelada") e uma nova tentativa é
   agendada.
2. **Given** uma assinatura inadimplente, **When** uma tentativa de nova cobrança tem sucesso,
   **Then** a assinatura volta a "ativa" e a próxima renovação segue o calendário normal.
3. **Given** uma assinatura inadimplente que esgota as tentativas permitidas, **When** a última
   tentativa falha, **Then** a assinatura muda para "cancelada" automaticamente — sem exigir
   ação de ninguém do time.

---

### User Story 3 - Cancelamento pelo próprio comprador (Priority: P2)

O comprador decide encerrar a assinatura sozinho, sem precisar falar com ninguém do time —
autoatendimento. A partir do cancelamento, nenhuma cobrança nova acontece, mas o ciclo já pago
continua dando acesso até o fim do período contratado.

**Why this priority**: Cobrar depois do pedido de cancelamento é o tipo de falha que gera
contestação de cartão (chargeback) e reclamação — mais caro que a receita que protege. Exigir
que o comprador fale com o time só para cancelar aumenta esse risco (ele pode simplesmente
contestar a cobrança em vez de esperar resposta).

**Independent Test**: Sem falar com ninguém do time, encontrar e usar o caminho de cancelamento
de uma assinatura ativa como comprador, e conferir que a data de próxima cobrança deixa de
existir e que a renovação seguinte não é cobrada — enquanto o acesso ao que já foi pago
continua até o fim do ciclo corrente.

**Acceptance Scenarios**:

1. **Given** uma assinatura ativa, **When** o comprador solicita o cancelamento por
   autoatendimento (sem envolver o time), **Then** a assinatura muda para o estado "cancelada" e
   nenhuma cobrança futura é agendada.
2. **Given** uma assinatura cancelada no meio de um ciclo já pago, **When** o comprador tenta
   usar o que contratou, **Then** o acesso continua disponível até o fim do período já pago —
   cancelar só impede a próxima cobrança, não corta o acesso corrente. Não há reembolso do ciclo
   em nenhum caso (ver Assumptions).
3. **Given** um comprador que não é o dono da assinatura, **When** ele tenta cancelá-la,
   **Then** o sistema recusa — o cancelamento por autoatendimento só pode agir sobre a própria
   assinatura de quem está pedindo.

---

### User Story 4 - Visibilidade do estado de cada assinatura (Priority: P3)

Alguém do time consegue ver, para qualquer assinatura, o estado atual (ativa, inadimplente,
cancelada), quando foi a última cobrança e quando é a próxima prevista — sem precisar cruzar
informação manualmente.

**Why this priority**: É o que permite responder "por que esse cliente não foi cobrado" ou
"quantos assinantes estão inadimplentes agora" sem investigação manual — importante, mas a
feature já entrega valor sem isso (P1/P2 cobrem o caminho automático).

**Independent Test**: Consultar uma assinatura qualquer e obter estado atual, data da última
cobrança (sucesso ou falha) e data da próxima cobrança prevista, em um único lugar.

**Acceptance Scenarios**:

1. **Given** qualquer assinatura (ativa, inadimplente ou cancelada), **When** alguém do time
   consulta seu estado, **Then** vê o estado atual, a data da última tentativa de cobrança e o
   resultado dela.

---

### Edge Cases

- O que acontece se o cancelamento for pedido no mesmo dia em que a cobrança de renovação já
  disparou (corrida entre os dois eventos)?
- O comprador tenta assinar de novo depois de ter cancelado — é uma assinatura nova (novo
  1º ciclo) ou existe alguma restrição?
- A forma de pagamento associada à assinatura muda ou expira entre um ciclo e outro (troca de
  cartão) — como o comprador atualiza isso?
- Duas tentativas de cobrança do mesmo ciclo disparam ao mesmo tempo (reprocessamento, retry
  duplicado) — a assinatura não pode ser cobrada duas vezes pelo mesmo ciclo.
- A data de renovação cai em um dia em que o processamento de cobrança falha por motivo alheio ao
  comprador (instabilidade do lado de quem processa o pagamento) — isso conta como falha do
  comprador para efeito de tentativas?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE cobrar automaticamente cada ciclo de uma assinatura ativa a partir
  do 2º ciclo, na data prevista pela recorrência contratada, sem exigir novo checkout do
  comprador.
- **FR-002**: O sistema DEVE registrar o resultado de cada tentativa de cobrança de renovação
  (sucesso ou falha, com motivo quando disponível), associado à assinatura e ao ciclo específico.
- **FR-003**: Quando uma cobrança de renovação falhar, o sistema DEVE tentar novamente dentro de
  uma janela definida antes de considerar a assinatura definitivamente inadimplente — nunca
  cancelar no primeiro erro.
- **FR-004**: O sistema DEVE avisar o comprador quando uma cobrança de renovação falhar, para que
  ele possa agir (trocar forma de pagamento, garantir saldo) antes de perder o acesso.
- **FR-005**: O sistema DEVE permitir o cancelamento de uma assinatura, interrompendo
  permanentemente as cobranças futuras dela.
- **FR-006**: O sistema DEVE impedir que o mesmo ciclo de uma assinatura seja cobrado mais de uma
  vez (nenhuma cobrança duplicada, mesmo em caso de reprocessamento).
- **FR-007**: O sistema DEVE manter, para cada assinatura, o histórico de todos os ciclos já
  cobrados (sucesso ou falha) mesmo depois de a assinatura ser cancelada — é o registro financeiro
  da relação com aquele comprador.
- **FR-008**: O sistema DEVE expor o estado atual de qualquer assinatura (ativa, inadimplente,
  cancelada), a data da última cobrança e a data da próxima cobrança prevista, consultável pelo
  time interno sem cruzar dados manualmente.
- **FR-009**: Depois de esgotar as tentativas de cobrança de um ciclo em falha, o sistema DEVE
  cancelar a assinatura automaticamente, sem exigir decisão de ninguém do time.
- **FR-010**: O sistema DEVE permitir que o próprio comprador cancele sua assinatura sem precisar
  falar com o time (autoatendimento) — hoje essa é uma superfície nova, pois não existe nenhuma
  área logada para compradores.
- **FR-011**: O sistema DEVE garantir que um comprador só consiga cancelar a própria assinatura,
  nunca a de outro comprador — o caminho de cancelamento precisa identificar de forma confiável
  quem está pedindo antes de agir.
- **FR-012**: Cancelar uma assinatura no meio de um ciclo já pago NÃO DEVE encerrar o acesso
  imediatamente — o acesso contratado continua valendo até o fim do período já pago; só a
  próxima cobrança é que não acontece.

### Key Entities

- **Assinatura**: representa o vínculo recorrente entre um comprador e um plano. Tem um estado
  (ativa, inadimplente, cancelada), uma recorrência (ex.: mensal), uma próxima data de cobrança
  prevista (quando aplicável) e está ligada ao 1º ciclo já cobrado pela 013.
- **Ciclo de cobrança**: uma tentativa de cobrar um período da assinatura. Tem uma assinatura-mãe,
  uma data, um resultado (sucesso/falha) e, se falhou, um motivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos ciclos de assinaturas ativas são cobrados na data prevista sem intervenção
  manual de ninguém do time.
- **SC-002**: Toda cobrança de renovação que falha gera pelo menos uma nova tentativa antes de a
  assinatura sair do estado "ativa/inadimplente" para um estado final.
- **SC-003**: Uma assinatura cancelada nunca gera uma cobrança nova depois do cancelamento —
  medido como zero ocorrências ao longo da operação.
- **SC-004**: O time interno encontra o estado de qualquer assinatura (ativa, inadimplente,
  cancelada) e a data da próxima cobrança em uma única consulta, sem precisar cruzar tabelas ou
  pedir para alguém verificar manualmente.
- **SC-005**: Zero ciclos cobrados em duplicidade, medido ao longo da operação.
- **SC-006**: O comprador cancela a própria assinatura sozinho, sem precisar contatar o time, e
  sem que uma assinatura de outro comprador possa ser afetada por engano.
- **SC-007**: Nenhum comprador perde acesso ao que já pagou antes do fim do período — cancelar
  nunca corta acesso corrente, medido como zero ocorrências ao longo da operação.

## Assumptions

- A 013 já cobre o 1º ciclo e grava `recorrencia`, `assinaturaEstado='ativa'` e `assinaturaRef`
  (hoje nulo de propósito) no item do pedido — a 014 parte desse ponto, não recria o 1º ciclo.
- Reembolso do ciclo já pago no cancelamento está **fora de escopo** desta feature: cancelar impede
  cobranças futuras, mas não devolve dinheiro de ciclo já cobrado.
- Trocar a forma de pagamento associada a uma assinatura ativa (ex.: cartão vencido) está fora de
  escopo desta feature. A User Story 3 exige autoatendimento, mas só para **cancelar** — a
  superfície nova que essa decisão cria (um jeito de o comprador se identificar e agir sobre a
  própria assinatura sem login completo) nasce do menor tamanho possível para cancelar, não para
  qualquer outra ação de conta.
- O aviso de falha de cobrança (FR-004) segue o mesmo canal já usado hoje para comunicar o
  comprador (o que for usado pela 012/013 — WhatsApp e/ou e-mail); esta spec não define o canal,
  só exige que o aviso exista.
- Hoje não existe nenhuma cadeira real de unidade `assinatura` em produção — a cadeira de teste da
  013 foi removida (T024). Esta feature é infraestrutura que passa a valer assim que a primeira
  cadeira de assinatura real for publicada.
