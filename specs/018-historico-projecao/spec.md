# Feature Specification: Histórico de consultas da Projeção

**Feature Branch**: `018-historico-projecao`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Preciso de uma pagina que mostra o historico de consultas e que eu posso abrir cada uma de forma detalhada, use /information-design . Ou dentro da propria 'https://app.roilabs.com.br/admin/projecao'"

## Contexto

A Projeção (spec 017, `/admin/projecao`) paga uma consulta à DataForSEO (≈ US$ 0,10) e mostra o ritmo de venda que a
busca orgânica tende a trazer. Hoje **nada é gravado** (017, FR-012): ao sair da página, a consulta se perde. Para rever
o resultado de um parceiro, o operador paga de novo e precisa lembrar a lista de termos, o nicho e a cidade que usou.

Caso real que motivou o pedido (28/09/2026): as duas consultas do site de cursos da Karla Daniele (Goiânia, 29 termos;
Brasil, 16 termos com "goiânia") só existem num arquivo temporário da sessão que as rodou.

Esta feature grava cada consulta paga e dá a ela um endereço: uma lista para achar a consulta e a mesma tela da Projeção
para abri-la em detalhe, sem pagar outra vez.

## Clarifications

### Session 2026-09-28

O dono deixou a localização em aberto ("página própria ou dentro da própria /admin/projecao"). Decisões tomadas por
default, registradas aqui para contestação:

- Q: A lista mora numa página própria ou dentro de `/admin/projecao`? → A: **Página própria**
  (`/admin/projecao/consultas`), com link a partir da Projeção. A Projeção responde "quantas vendas por mês?", e a lista
  responde outra pergunta ("qual consulta eu abro?"). Juntas, as duas disputam o nível 1 da mesma tela.
- Q: Onde a consulta é aberta em detalhe? → A: **Na própria tela da Projeção**, carregada com o dado salvo. O detalhe
  já existe lá (resposta, cenários, curva, cadeia, cobertura, termos, premissas); uma segunda tela de detalhe seria
  uma cópia que envelhece separada.
- Q: Como o operador reconhece uma consulta na lista? → A: Por um nome opcional, "Para quem", digitado na hora de
  consultar (ex.: "Karla Daniele · cursos"), mais data, local, nicho e os primeiros termos.
- Q: O resultado na lista é o de quando a consulta foi feita ou recalculado? → A: **Recalculado** com as premissas
  atuais do funil, e a página diz isso. O que se grava é a resposta da fonte (volume, dificuldade), que não muda; as
  premissas são do código e mudam com data e fonte.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toda consulta paga fica guardada (Priority: P1)

Como operador, consulto os termos de um parceiro na Projeção e a consulta fica guardada sozinha, com o nome do
parceiro que eu digitei. Não preciso lembrar de salvar, e não perco o que paguei.

**Why this priority**: sem gravar, não existe histórico. É a base das outras duas histórias.

**Independent Test**: fazer uma consulta com "Para quem" = "Teste 018", recarregar a página e conferir que a consulta
aparece no histórico com o nome, a data, o local, o nicho, os termos e o custo.

**Acceptance Scenarios**:

1. **Given** o operador logado, **When** uma consulta paga devolve resultado, **Then** ela é guardada com: quando foi
   feita, para quem (se informado), nicho escolhido, local, termos com volume, histórico mensal e dificuldade, janela do
   volume, linhas repetidas removidas e custo em dólar.
2. **Given** uma consulta que falha (entrada inválida, chave, saldo ou fonte fora do ar), **Then** nada é guardado.
3. **Given** uma consulta paga que deu certo mas não pôde ser guardada, **Then** o operador vê a projeção normalmente
   e um aviso de que ela não entrou no histórico.
4. **Given** uma consulta feita sem "Para quem", **Then** ela entra no histórico identificada pelos termos, sem nome.

---

### User Story 2 - Achar uma consulta no histórico (Priority: P1)

Como operador, abro o histórico e reconheço, sem abrir nenhuma, qual consulta é de qual parceiro, quando foi feita,
para onde e o que ela deu.

**Why this priority**: é a página pedida.

**Independent Test**: com as duas consultas da Karla no histórico, abrir `/admin/projecao/consultas` e dizer, só pela
lista, qual das duas é de Goiânia, quantos termos cada uma tem e quanto cada uma projeta por mês.

**Acceptance Scenarios**:

1. **Given** consultas guardadas, **When** o operador abre o histórico, **Then** vê uma linha por consulta, da mais
   recente para a mais antiga, com: para quem, data e hora, local, nicho, quantidade de termos e os primeiros deles,
   buscas por mês somadas, vendas por mês no ano 1 (faixa do conservador ao otimista, na unidade do nicho) e custo.
2. **Given** o histórico aberto, **Then** a página mostra quantas consultas existem, o custo somado e desde quando as
   consultas são guardadas.
3. **Given** nenhuma consulta guardada, **Then** a página diz que ainda não há consulta e leva para a Projeção.
4. **Given** a Projeção aberta, **Then** existe um link para o histórico com a quantidade de consultas guardadas.

---

### User Story 3 - Abrir uma consulta em detalhe (Priority: P1)

Como operador, abro uma consulta do histórico e vejo a projeção completa dela (resposta, cenários, curva, cadeia da
busca à venda, cobertura da demanda, tabela de termos), exatamente como na hora da consulta, sem pagar de novo. Posso
trocar cenário, nicho e taxa do parceiro, e levar o número ao simulador.

**Why this priority**: "abrir cada uma de forma detalhada" é metade do pedido.

**Independent Test**: abrir a consulta de Goiânia da Karla a partir do histórico e conferir que a tela mostra 260
buscas/mês, a tabela dos 29 termos e o mesmo resultado da consulta original, e que nenhuma chamada paga saiu.

**Acceptance Scenarios**:

1. **Given** o histórico, **When** o operador abre uma consulta, **Then** a Projeção carrega com o nicho, o local, o
   nome e os termos daquela consulta nos campos, e a resposta completa, sem chamada à fonte paga.
2. **Given** uma consulta aberta, **Then** a procedência diz que é uma consulta guardada, com data e hora, e que o
   resultado usa as premissas atuais do funil.
3. **Given** uma consulta aberta, **When** o operador troca cenário, nicho ou taxa do parceiro, **Then** a projeção é
   recalculada sem custo, e a consulta guardada não muda.
4. **Given** uma consulta aberta, **When** o operador edita os termos e consulta de novo, **Then** é uma consulta paga
   nova, guardada como outra linha. A antiga fica como estava.
5. **Given** um endereço de consulta que não existe, **Then** a tela diz que a consulta não foi encontrada e leva ao
   histórico, sem mostrar projeção nenhuma.

### Edge Cases

- **Nicho que deixou de existir** na tabela de Precificação: a consulta abre com o primeiro nicho e avisa qual era o
  gravado.
- **Termo sem volume** ou **sem dificuldade** na consulta guardada: os mesmos estados da 017 ("sem volume medido",
  "não medida · conta 15"). Nada muda por ter sido guardado.
- **Premissas mudaram** desde a consulta: o número da lista e do detalhe muda junto, e a página declara que usa as
  premissas atuais. A resposta da fonte (volume e dificuldade) nunca muda.
- **Nome longo** em "Para quem": até 80 caracteres; na lista, a linha quebra sem estourar a largura.
- **Muitas consultas**: a lista mostra as 200 mais recentes e diz quantas ficaram de fora.
- **Banco fora do ar** ao abrir o histórico: a página diz que o histórico não pôde ser lido, sem mostrar "nenhuma
  consulta" (que seria outra coisa).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda consulta paga que devolve resultado DEVE ser guardada pelo servidor, depois da resposta da fonte e
  antes de responder à tela, com os campos do Acceptance Scenario 1 da US1.
- **FR-002**: Consulta que falha (qualquer erro da 017) NÃO DEVE ser guardada.
- **FR-003**: Falha ao guardar NÃO DEVE impedir a resposta: a tela mostra a projeção e avisa que ela não entrou no
  histórico. A falha vai para o log do servidor, sem os termos.
- **FR-004**: A entrada da Projeção DEVE ganhar o campo opcional "Para quem", com até 80 caracteres.
- **FR-005**: O histórico DEVE ficar em `/admin/projecao/consultas`, protegido pelo login do admin, com a lista da
  US2 (mais recente primeiro, até 200 linhas).
- **FR-006**: O resultado na lista DEVE ser a média de vendas por mês no ano 1, do conservador ao otimista, na unidade
  do nicho guardado, calculado com as premissas atuais. A página DEVE dizer isso.
- **FR-007**: O histórico DEVE mostrar a quantidade de consultas, o custo somado e a data da primeira consulta guardada.
- **FR-008**: Cada linha do histórico DEVE abrir a consulta na Projeção (endereço próprio por consulta), com os campos
  preenchidos e a resposta completa, sem chamada paga.
- **FR-009**: Na consulta aberta, a procedência DEVE indicar "consulta guardada" com data e hora da consulta original.
- **FR-010**: Consultar de novo a partir de uma consulta aberta DEVE criar uma consulta nova. Nenhuma consulta guardada
  é alterada ou apagada por esta feature.
- **FR-011**: Endereço de consulta inexistente DEVE mostrar "consulta não encontrada" e o link para o histórico.
- **FR-012**: A Projeção DEVE mostrar um link para o histórico com a quantidade de consultas guardadas.
- **FR-013**: As duas consultas de 28/09/2026 do site de cursos da Karla Daniele (Goiânia, 29 termos; Brasil, 16
  termos), nicho "Serviços locais e clínicas", DEVEM entrar no histórico com "Para quem" = "Karla Daniele · cursos",
  a partir da resposta exata da fonte guardada naquela sessão.
- **FR-014**: Emenda da 017, FR-012: a Projeção passa a guardar a consulta. Continua sem guardar taxa do parceiro,
  cenário escolhido e qualquer outra coisa.
- **FR-015**: Só um operador logado DEVE ler o histórico ou abrir uma consulta. Os termos NÃO DEVEM ir para o log.

### Key Entities

- **Consulta guardada**: uma consulta paga que deu certo. Tem quando foi feita, para quem (opcional), nicho escolhido,
  local (código e nome), a lista de termos com volume, histórico mensal e dificuldade, a janela do volume, as linhas
  repetidas removidas e o custo em dólar. Não muda depois de criada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das consultas pagas que deram certo depois do deploy aparecem no histórico (conferido com uma
  consulta real em produção).
- **SC-002**: A partir do histórico, o operador abre qualquer consulta em 1 clique e vê o mesmo número que a consulta
  mostrou quando foi feita (com as premissas iguais), com custo zero na fonte paga.
- **SC-003**: Pela lista, sem abrir nada, o operador diz de quem é cada consulta, quando foi feita, para onde e quanto
  projeta, nas duas consultas da Karla.
- **SC-004**: O histórico e a consulta aberta funcionam a 1440, 768 e 390 px sem rolagem lateral.

## Assumptions

- Um operador (o dono), poucas consultas por semana: sem paginação, sem busca e sem filtro até passar de 200.
- Sem renomear, sem apagar e sem comparar consultas lado a lado nesta versão.
- Data e hora mostradas no horário de Brasília.
- O banco de produção do app é o mesmo das outras telas do admin, com mudança de estrutura aplicada à mão daqui
  (constituição, Restrições Técnicas).
