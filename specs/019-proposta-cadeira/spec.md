# Feature Specification: Proposta de cadeira guardada, com link próprio da ROI Labs

**Feature Branch**: `019-proposta-cadeira`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Em 'https://app.roilabs.com.br/admin/propostas' diz 'Monte no simulador da Precificação e salve — ela aparece aqui com link próprio para mandar ao cliente.' e em 'https://app.roilabs.com.br/admin/precos' diz 'Para colar na proposta em slides. Nada é salvo aqui.'. O fluxo se contradiz, resolva a 'https://app.roilabs.com.br/admin/precos' para salvar"

## Contexto

`/admin/propostas` veio do admin da Vértice (commit `3bedb21`). A lista lê as propostas da Vértice, e o link de cada uma
abre no site da Vértice (`verticemarketing.roilabs.com.br/p/<slug>`), com a marca e as condições da Vértice. O
simulador que montava e guardava essas propostas ficava em `/admin/precos`.

Em 28/09/2026 (commit `3848e7a`), `/admin/precos` passou a mostrar o preço da **cadeira da ROI Labs**: anuidade, domínio
próprio e comissão pela faixa do nicho. O simulador novo só copia um resumo para os slides e não guarda nada. A tela de
Propostas continuou prometendo "monte no simulador e salve", e o link "Editar esta proposta" dos cartões da Vértice
passou a abrir o simulador da cadeira, que ignora o pedido.

O dono decidiu (28/09, pergunta direta): a proposta de cadeira é guardada no simulador de `/admin/precos` e abre numa
**página própria da ROI Labs**, em `app.roilabs.com.br`, e não no site da Vértice.

## Clarifications

### Session 2026-09-28

- Q: Onde o cliente abre o link da proposta de cadeira? → A: **Numa página pública da ROI Labs, no domínio do app**,
  com a marca da ROI Labs. Recusadas: link no site da Vértice (marca e condições erradas) e proposta só interna, sem
  link.
- Q: Como a página pública termina, e o que o cliente faz depois de ler? → A: **Responde pelo WhatsApp da ROI Labs**
  ((62) 99326-5713), com a mensagem já escrita citando a proposta. **Sem aceite online** na v1: nada consumiria o
  aceite, e o fechamento segue pelo contrato e pela cobrança da anuidade. Recusados: aceite com nome, e os dois juntos.
- Q (default, sem pergunta): a página pública mostra a estimativa de comissão no ritmo combinado? → A: **Sim, rotulada
  como estimativa**. É o número que o resumo do simulador já manda para os slides ("quanto eu pago no 1º ano?").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guardar a proposta e mandar o link (Priority: P1)

Numa reunião ou logo depois dela, o operador monta a proposta no simulador de `/admin/precos`: nicho, ritmo de venda
esperado e, se vier da Projeção, o ritmo que ela calculou. Ele escreve para quem é a proposta e guarda. Depois, cai em
`/admin/propostas`, com a proposta nova no topo e o link pronto para copiar. O cliente abre o link no celular e lê,
com a marca da ROI Labs, o que paga pela cadeira: a entrada anual, a comissão do nicho, a estimativa no ritmo
combinado, as condições do contrato e a validade da proposta.

**Why this priority**: é o pedido. Sem isso, as duas telas continuam se contradizendo e a proposta segue só em
slides, sem registro.

**Independent Test**: guardar uma proposta de teste, abrir o link numa janela anônima e conferir cada número contra o
simulador no momento em que ela foi guardada.

**Acceptance Scenarios**:

1. **Given** o simulador com nicho e ritmo preenchidos, **When** o operador escreve "Para quem" e guarda, **Then**
   ele vai para `/admin/propostas`, e a proposta nova aparece no topo com o link e o botão de copiar.
2. **Given** o link de uma proposta guardada, **When** alguém sem login o abre, **Then** vê a proposta com a marca da
   ROI Labs e os mesmos números que o simulador mostrava ao guardar.
3. **Given** uma proposta guardada ontem, **When** a tabela de preços ou de comissão muda hoje, **Then** o link
   continua mostrando os números de ontem.
4. **Given** o simulador sem "Para quem", **When** o operador tenta guardar, **Then** a proposta não é guardada e o
   campo diz o que falta.
5. **Given** um endereço de proposta que não existe, **When** alguém o abre, **Then** vê uma página de "proposta não
   encontrada" que não revela nenhuma outra proposta.

---

### User Story 2 - As duas propostas convivem na lista sem ação quebrada (Priority: P2)

Em `/admin/propostas`, o operador vê as propostas de cadeira e as da Vértice. Cada cartão diz de que tipo é e só
oferece ação que funciona. A proposta de cadeira mostra para quem é, o nicho, a entrada, a comissão estimada por mês,
o total do 1º ano, o link e o botão de excluir. A proposta da Vértice continua com o link e as ações dela, mas sem
"Editar esta proposta", porque o simulador que a editava não existe mais.

**Why this priority**: sem isso, o cartão oferece "Editar" que não edita e mistura margem da Vértice com proposta de
cadeira. O incômodo é real, mas o fluxo principal funciona sem ele.

**Independent Test**: com uma proposta de cada tipo na lista, conferir que cada ação visível leva aonde promete e
que excluir a de cadeira faz o link dela parar de abrir.

**Acceptance Scenarios**:

1. **Given** uma proposta de cadeira na lista, **When** o operador a exclui, **Then** ela some da lista e o link
   passa a mostrar "proposta não encontrada".
2. **Given** uma proposta da Vértice na lista, **When** o operador olha o cartão, **Then** não há "Editar esta
   proposta", e o link continua abrindo no site da Vértice.
3. **Given** a lista sem nenhuma proposta, **When** o operador a abre, **Then** o texto indica o simulador de Preços
   como o lugar onde a proposta se monta e se guarda, sem contradizer o texto de `/admin/precos`.

---

### User Story 3 - O cliente responde pelo WhatsApp (Priority: P3)

Depois de ler, o cliente toca em "Falar com a ROI Labs no WhatsApp", e a conversa abre com uma mensagem já escrita
que cita a proposta. Não há aceite online: o fechamento segue pelo contrato e pela cobrança da anuidade.

**Why this priority**: sem um próximo passo, a página termina num beco. Com o WhatsApp, a dúvida volta para o
operador com o contexto da proposta, sem nada novo para guardar.

**Independent Test**: abrir o link no celular, tocar no botão e conferir que o WhatsApp abre no número da ROI Labs
com o título da proposta na mensagem.

**Acceptance Scenarios**:

1. **Given** uma proposta aberta no celular, **When** o cliente toca em "Falar com a ROI Labs no WhatsApp", **Then**
   o WhatsApp abre no número comercial da ROI Labs com uma mensagem que cita o título da proposta.

---

### Edge Cases

- **Ritmo zero ou vazio**: guarda do mesmo jeito. A proposta mostra a entrada e a regra de comissão, e a estimativa
  diz que depende do ritmo, em vez de mostrar "R$ 0,00 de comissão" como promessa.
- **Proposta vencida**: o link continua abrindo, com um aviso no topo de que ela venceu em tal data e de que os valores
  podem ter mudado.
- **Nicho que saiu da tabela depois de guardar**: a proposta abre igual, porque o que ela mostra foi congelado ao
  guardar.
- **Nicho por consulta (clínica)**: a proposta não mostra o aviso interno sobre as regras do CFO/CFM. Nenhum aviso
  dirigido ao operador aparece para o cliente.
- **Guardar duas vezes a mesma simulação** (clique duplo): no máximo uma proposta nova por clique. Uma segunda,
  idêntica, pode ser excluída pela lista.
- **Banco fora do ar ao guardar**: o operador vê o erro, e a simulação continua na tela para tentar de novo ou copiar
  o resumo.
- **Link aberto por buscador ou robô**: a página não é indexada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O simulador de `/admin/precos` MUST ter um campo "Para quem", obrigatório para guardar (de 2 a 120
  caracteres), e uma ação "Guardar proposta". "Copiar resumo" continua existindo.
- **FR-002**: Ao guardar, o sistema MUST refazer a conta a partir do nicho e do ritmo informados, sem aceitar os
  números vindos da tela, e congelar na proposta tudo o que o cliente vai ler: nicho, regra de comissão em texto,
  ritmo informado, entrada (anuidade, domínio, setup), comissão estimada por mês e em 12 meses, total do 1º ano,
  condições do contrato e do domínio, data e validade.
- **FR-003**: Depois de guardar, o operador MUST ir para `/admin/propostas`, com a proposta nova visível no topo, o
  link e a ação de copiá-lo.
- **FR-004**: Cada proposta de cadeira MUST ter um endereço público próprio em `app.roilabs.com.br`, que ninguém consiga
  adivinhar, aberto sem login e fora dos buscadores.
- **FR-005**: A página pública MUST mostrar só o que é para o cliente, com a marca da ROI Labs. Nada de margem, custo,
  aviso dirigido ao operador ou link do admin.
- **FR-006**: Mudar preço, comissão ou nicho no código depois de guardar MUST NOT mudar uma proposta já guardada.
- **FR-007**: A proposta MUST ter validade de 15 dias a partir da data em que foi guardada. Depois disso, a página
  continua abrindo, com o aviso de vencida.
- **FR-008**: `/admin/propostas` MUST listar as propostas de cadeira e as da Vértice juntas, da mais recente para a
  mais antiga, com o tipo visível em cada cartão.
- **FR-009**: O operador MUST poder excluir uma proposta de cadeira. Excluída, o link dela mostra "proposta não
  encontrada".
- **FR-010**: O cartão da proposta da Vértice MUST NOT oferecer "Editar esta proposta" enquanto não houver tela que a
  edite. O link e as demais ações continuam como estão.
- **FR-011**: A proposta de cadeira MUST abrir só no endereço da ROI Labs. O endereço público da Vértice não a mostra.
- **FR-012**: Os textos de `/admin/precos` e `/admin/propostas` MUST descrever o mesmo fluxo. Sai "Nada é salvo
  aqui", e a interface usa "Guardar" (glossário), nunca "salvar".
- **FR-013**: Guardar e excluir MUST exigir a sessão do admin, mesmo quando chamados fora da tela.
- **FR-014**: A página pública MUST terminar com "Falar com a ROI Labs no WhatsApp", que abre o número comercial da
  ROI Labs com uma mensagem já escrita que cita o título da proposta. A página não tem aceite online.

### Key Entities

- **Proposta de cadeira**: uma oferta de uma cadeira a um parceiro. Tem para quem, nicho (identificador e nome no dia),
  ritmo informado, números congelados (entrada, comissão por mês, comissão em 12 meses, total do 1º ano, % da venda
  quando houver), regra de comissão e condições em texto, endereço público, data em que foi guardada e validade.
- **Proposta da Vértice**: já existe e não muda de forma. Só perde a ação "Editar" enquanto não houver onde editar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Do simulador preenchido ao link copiado em até 3 ações (escrever "Para quem", guardar, copiar o link)
  e menos de 30 segundos.
- **SC-002**: Numa proposta guardada, 100% dos valores da página pública batem com os do simulador no momento em que
  ela foi guardada, conferidos valor a valor num caso de cada modelo de comissão (percentual, mensalidade, consulta).
- **SC-003**: Zero conteúdo interno na página pública (margem, custo, aviso ao operador, link do admin), conferido
  lendo a página renderizada em produção.
- **SC-004**: A página pública lê inteira em 390 px sem rolagem lateral, e o maior elemento aparece em até 2,5 s numa
  conexão móvel.
- **SC-005**: Nenhum texto das duas telas contradiz o fluxo: "Nada é salvo" não aparece em lugar nenhum de `/admin`, e
  toda ação visível num cartão de proposta funciona.

## Assumptions

- "Para quem" é texto livre, como na Projeção (glossário), e não um cadastro de cliente. Quem recebe a proposta ainda
  não é parceiro.
- Uma proposta cobre uma cadeira de um nicho. Proposta com várias cadeiras ou opções lado a lado fica fora da v1.
- Sem edição na v1: para corrigir, guarda-se outra e exclui-se a antiga. O link muda. Anotado como atalho, com o
  caminho de upgrade: editar mantendo o endereço, como a Vértice faz.
- Validade de 15 dias, a mesma da proposta da Vértice.
- As condições que aparecem são as que `/admin/precos` já mostra (contrato e domínio), no texto do dia.
- A marca da ROI Labs (logo e cores) já existe em `brand-assets/` e no app.
- A cobrança (anuidade, comissão) continua lendo o cadastro do parceiro (spec 010). A proposta não cobra nada.
