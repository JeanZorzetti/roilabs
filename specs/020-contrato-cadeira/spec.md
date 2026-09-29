# Feature Specification: Contrato da cadeira, emitido a partir da proposta

**Feature Branch**: `020-contrato-cadeira`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Integre 'https://app.roilabs.com.br/admin/contratos' com 'https://app.roilabs.com.br/admin/propostas'"

## Contexto

As duas telas vieram do admin da Vértice. Em `/admin/contratos`, o contrato só nasce de uma proposta **da Vértice**
("Emitir contrato" no cartão dela), com cláusulas de prestação de serviço de agência, a Vértice como contratada e a
página pública no site da Vértice. Em produção, `vertice.proposals` tem 0 linhas.

Desde a spec 019 (28/09), as propostas que o operador guarda de verdade são **de cadeira**: anuidade, domínio, comissão
do nicho e entregáveis por fase, com link próprio da ROI Labs em `app.roilabs.com.br/p/<slug>` e **sem aceite
online**. A spec 019 decidiu que "o fechamento segue pelo contrato e pela cobrança da anuidade", mas não existe
caminho da proposta de cadeira até um contrato. O operador fecha a cadeira fora do sistema.

O dono escolheu (29/09, pergunta direta) o caminho **contrato da cadeira**: o cartão da proposta de cadeira emite o
contrato de parceria da ROI Labs, com página pública e marca da ROI Labs. Recusadas: juntar as duas listas numa tela
só (a Vértice não tem proposta em produção) e só ligar as telas por link.

Não existe minuta de contrato de cadeira. A do vault (`Docs/Obsidian/60-legal-fin/contrato-quadro.md`) é do modelo
antigo de marketplace de porcelanato (a ROI Labs vendia, o fornecedor entregava). As cláusulas gerais dela servem de
ponto de partida: independência das partes, força maior, cessão, comunicações e foro.

## Clarifications

### Session 2026-09-29

- Q: O que "integrar Contratos com Propostas" quer dizer? → A: **Contrato da cadeira.** "Emitir contrato" no cartão
  da proposta de cadeira monta o contrato de parceria da ROI Labs a partir dela, com página pública própria. Recusados:
  uma tela só para as duas listas, e só ligação cruzada entre as telas.
- Q: Se o parceiro sair antes dos 12 meses, o que acontece com a anuidade paga? → A: **Não devolve; qualquer parte
  encerra com 30 dias de aviso, sem multa.** Recusados: devolução pro rata (conta de reembolso) e anual fechado com
  multa (trava o fechamento).
- Q: No fim do contrato, o que acontece com o domínio e o site? → A: **O domínio vai para o parceiro; site e
  plataforma ficam com a ROI Labs; o parceiro leva dados e conteúdo em arquivo.** Recusados: entregar cópia do site
  e a ROI Labs ficar com o domínio que o parceiro pagou.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emitir o contrato a partir da proposta de cadeira (Priority: P1)

O parceiro respondeu no WhatsApp que quer fechar. Em `/admin/propostas`, o operador usa "Emitir contrato" no cartão da
proposta dele. A tela do contrato abre com tudo o que a proposta já decidiu: nicho, tipo de cadeira, anuidade, domínio,
comissão, entregáveis por fase, o que a ROI Labs precisa do parceiro e o que não está incluído. Nada disso se redigita.
O operador só preenche o que a proposta não tem: a qualificação do parceiro (razão social, CNPJ, endereço,
representante), o início, o foro e as formas de pagamento da anuidade. Os dados da ROI Labs já vêm preenchidos. Ele
salva, e o contrato ganha um link para mandar ao parceiro.

**Why this priority**: é o elo que falta entre "o parceiro quer" e "a cadeira está fechada". Sem ele, o contrato da
cadeira é escrito à mão, fora do sistema, e o número combinado na proposta pode não ser o do contrato.

**Independent Test**: guardar uma proposta de cadeira de teste, emitir o contrato, abrir o link numa janela anônima e
conferir anuidade, comissão e entregáveis contra a proposta, um por um.

**Acceptance Scenarios**:

1. **Given** uma proposta de cadeira guardada, **When** o operador usa "Emitir contrato" no cartão, **Then** abre a tela
   do contrato com os termos da proposta à vista (somente leitura) e os campos das partes, do prazo e do foro para
   preencher.
2. **Given** o formulário com parte dos campos em branco, **When** o operador salva, **Then** o contrato é guardado com
   "[a preencher]" nos buracos, a lista de pendências aparece no cartão e o aceite fica travado até completar.
3. **Given** um contrato salvo, **When** a tabela de preço ou de comissão muda depois, **Then** o contrato continua com
   os valores da proposta do dia em que foi emitido.
4. **Given** uma proposta de cadeira vencida (passou da validade), **When** o operador usa "Emitir contrato", **Then**
   ele consegue emitir, mas a tela avisa que a proposta venceu e que os valores são os da proposta, não os da tabela de
   hoje.

---

### User Story 2 - O parceiro lê e aceita o contrato pelo link (Priority: P1)

O parceiro abre o link no celular. Lê o contrato inteiro com a marca da ROI Labs: as partes, o objeto, a remuneração,
as regras da comissão, os entregáveis em anexo, a vigência e as cláusulas gerais. No fim, quem assina pela empresa
digita o nome completo e o CPF, marca que leu e concorda e aceita. A página passa a mostrar o contrato como aceito, com
data, hora e nome de quem aceitou.

**Why this priority**: sem o aceite, o contrato é só mais um documento. O aceite é o fechamento que a spec 019 deixou
para o contrato, e a prova de que a cadeira foi contratada naqueles termos.

**Independent Test**: aceitar um contrato de teste por uma janela anônima e conferir, no admin, o registro do aceite
(nome, documento, data e hora, IP, navegador) e que o texto aceito é o mesmo que estava na tela.

**Acceptance Scenarios**:

1. **Given** um contrato sem pendências, **When** alguém sem login abre o link, **Then** vê o contrato completo com a
   marca da ROI Labs e o bloco de aceite no fim.
2. **Given** um contrato com pendências, **When** alguém abre o link, **Then** lê o contrato, mas não vê o bloco de
   aceite, e o servidor recusa um aceite enviado de qualquer jeito.
3. **Given** o bloco de aceite, **When** o parceiro aceita sem marcar a caixa, ou sem nome ou CPF, **Then** o aceite é
   recusado com a mensagem do campo que falta.
4. **Given** um contrato já aceito, **When** alguém abre o link de novo, **Then** vê o contrato marcado como aceito,
   com data e nome, e sem bloco de aceite.
5. **Given** dois aceites enviados ao mesmo tempo (clique duplo, duas abas), **When** o servidor grava, **Then** só um
   aceite vale, e o segundo recebe a página de contrato aceito.

---

### User Story 3 - Ver proposta e contrato juntos, em qualquer das duas telas (Priority: P2)

Em `/admin/propostas`, o cartão da proposta de cadeira mostra se ela já tem contrato e em que estado: pendente de
preenchimento, aguardando aceite ou aceito em tal data. Em `/admin/contratos`, os contratos de cadeira aparecem na
mesma lista que os da Vértice, identificados como "Cadeira", com o link do contrato e o nome da proposta de origem.

**Why this priority**: é a parte "integrar" do pedido. Mas só tem valor quando existe contrato para mostrar, ou seja,
depois das histórias 1 e 2.

**Independent Test**: com uma proposta sem contrato, uma com contrato pendente e uma com contrato aceito, abrir as duas
telas e conferir o estado de cada uma.

**Acceptance Scenarios**:

1. **Given** uma proposta de cadeira com contrato, **When** o operador abre `/admin/propostas`, **Then** o cartão
   mostra o estado do contrato e o caminho para ele, e não oferece "Emitir contrato" de novo.
2. **Given** contratos da Vértice e de cadeira, **When** o operador abre `/admin/contratos`, **Then** vê os dois tipos
   numa lista só, do mais novo para o mais antigo, cada um com a marca do tipo.
3. **Given** o banco da Vértice fora do ar, **When** o operador abre `/admin/contratos`, **Then** os contratos de
   cadeira aparecem mesmo assim, com o aviso de erro só para a parte da Vértice (e vice-versa).

---

### User Story 4 - Corrigir antes do aceite e excluir com segurança (Priority: P3)

Antes de o parceiro aceitar, o operador corrige o contrato (CNPJ digitado errado, foro trocado) no mesmo link. Depois
do aceite, o contrato não muda mais. Excluir funciona como hoje para o contrato não aceito. O contrato aceito não pode
ser excluído, e a proposta que tem contrato não pode ser excluída enquanto ele existir.

**Why this priority**: evita perder a prova do que foi aceito. É raro, mas o erro custa caro.

**Independent Test**: editar um contrato não aceito e ver o link mostrar a versão nova; tentar excluir um aceito e a
proposta dele e ver as duas recusas com o motivo.

**Acceptance Scenarios**:

1. **Given** um contrato não aceito, **When** o operador edita e salva, **Then** o mesmo link passa a mostrar a nova
   versão.
2. **Given** um contrato aceito, **When** o operador tenta editar ou excluir, **Then** a ação não aparece e o servidor
   recusa se for chamada mesmo assim.
3. **Given** uma proposta de cadeira com contrato, **When** o operador tenta excluí-la, **Then** a exclusão é recusada
   com o motivo: exclua o contrato primeiro, se ele ainda não foi aceito.

### Edge Cases

- Proposta guardada antes de 29/09/2026, **sem entregáveis**: o contrato é emitido, mas o anexo de escopo sai como
  pendência ("Entregáveis da cadeira") e trava o aceite até o operador escrever o escopo no campo de condições
  específicas ou guardar uma proposta nova.
- Nicho sem ritmo combinado (proposta sem estimativa): o contrato traz a comissão pela regra, sem número estimado. A
  estimativa da proposta **nunca** entra no contrato como valor devido ou prometido.
- Parceiro pessoa física (CPF com 11 dígitos): o contrato o qualifica como pessoa física, sem representante. A página
  ganha as cláusulas de consumidor (ver FR-014).
- Marcador digitado à mão, como "[percentual]", em qualquer campo livre: vira pendência e trava o aceite, como no
  contrato da Vértice.
- Link de contrato inexistente ou excluído: a página responde "contrato não encontrado", sem revelar se existiu.
- Contrato aberto por robô de busca: a página não entra no índice.
- A proposta de origem é excluída depois (não deveria, ver US4): o contrato continua legível, porque carrega uma cópia
  congelada de tudo o que veio dela.

## Requirements *(mandatory)*

### Functional Requirements

**Emissão (admin)**

- **FR-001**: O cartão da proposta de cadeira em `/admin/propostas` DEVE oferecer "Emitir contrato" enquanto a proposta
  não tiver contrato.
- **FR-002**: A tela de emissão DEVE mostrar, somente leitura, os termos que vêm da proposta: nicho, tipo de cadeira,
  anuidade e domínio (valor de cada item e total), comissão (resumo, regras e quando se paga), entregáveis por fase,
  entregáveis extras, o que a ROI Labs precisa do parceiro e o que não está incluído.
- **FR-003**: O operador DEVE preencher na emissão apenas: qualificação do parceiro (razão social ou nome, CNPJ ou CPF,
  endereço, representante legal, e-mail), qualificação da ROI Labs, título, início, foro, formas de pagamento da
  anuidade e condições específicas. A qualificação da ROI Labs e o foro DEVEM vir pré-preenchidos com os do último
  contrato de cadeira salvo.
- **FR-004**: O servidor DEVE montar o contrato relendo a proposta do banco. Valor vindo do formulário para anuidade,
  comissão ou escopo é ignorado.
- **FR-005**: O contrato DEVE ser congelado no momento do salvamento: mudança posterior de tabela, nicho ou proposta não
  altera o que o link mostra.
- **FR-006**: Salvar com campo obrigatório em branco DEVE ser permitido. O contrato sai com "[a preencher]" no lugar e
  guarda a lista de pendências, que trava o aceite. Obrigatórios: nome, documento e endereço das duas partes,
  representante de parte PJ, foro e entregáveis da cadeira.
- **FR-007**: Emitir a partir de proposta vencida DEVE ser permitido, com aviso na tela de emissão.

**Conteúdo do contrato**

- **FR-008**: O contrato DEVE conter, nesta ordem: qualificação das partes; objeto (a cadeira do nicho, o tipo e o
  escopo do Anexo I); exclusividade da cadeira; remuneração (anuidade, domínio e comissão); definição de venda
  originada e fonte do número; relatório e contestação; obrigações do parceiro; vigência e renovação; saída e
  encerramento; domínio e site ao fim do contrato; proteção de dados; propriedade intelectual; limite de
  responsabilidade; cláusulas gerais (independência das partes, força maior, cessão, comunicações); lei e foro; e o
  Anexo I (escopo por fase, extras, o que não inclui).
- **FR-009**: A remuneração DEVE reproduzir as condições da proposta sem reescrevê-las: o resumo e as regras da
  comissão, o "quando" (todo dia 05, sobre o mês anterior, só sobre venda paga e originada pela cadeira), a base
  (produto com desconto, sem frete, piso por pedido, só no nicho de % por pedido), o estorno em devolução,
  cancelamento ou chargeback, o relatório venda por venda antes de cada cobrança e a recompra comissionada por 12 meses
  depois do fim.
- **FR-010**: O contrato DEVE definir "venda originada pela cadeira" (a venda paga feita pelo canal que a ROI Labs opera
  para o parceiro: site, loja e atendimento da equipe de vendas da ROI Labs), "recompra" (nova compra de cliente cuja
  1ª compra foi originada pela cadeira) e a fonte do número (o registro de vendas da ROI Labs, enviado no relatório).
  O parceiro DEVE ter prazo escrito para contestar o relatório antes da cobrança.
- **FR-011**: O contrato DEVE dizer, em cláusula própria, que a estimativa da proposta é uma projeção e não uma
  promessa de resultado, e que o valor devido é o da regra aplicada às vendas reais.
- **FR-012**: Qualquer parte DEVE poder encerrar o contrato antes dos 12 meses com aviso de 30 dias, sem multa. A
  anuidade já paga não é devolvida, porque cobre o site montado e o domínio comprado. A comissão das vendas feitas até
  o fim continua devida, e a recompra segue a regra dos 12 meses (FR-009).
- **FR-013**: Ao fim do contrato, por qualquer motivo, o domínio (pago pelo parceiro) DEVE ser transferido a ele. O
  site e a plataforma continuam da ROI Labs. O parceiro recebe em arquivo os dados dos clientes dele e o conteúdo que
  forneceu (textos, fotos, marca).
- **FR-014**: Com parceiro pessoa física, o contrato NÃO DEVE limitar responsabilidade e DEVE usar o foro do domicílio
  dele. Com PJ, vale o foro escolhido e o teto de responsabilidade em 12 meses de valores pagos, sem cobrir dolo.

**Página pública e aceite**

- **FR-015**: Cada contrato DEVE ter um link público próprio no domínio do app da ROI Labs, com endereço impossível de
  adivinhar, marca da ROI Labs, fora do índice de busca e legível no celular.
- **FR-016**: O bloco de aceite DEVE aparecer só em contrato sem pendências e não aceito. Ele pede nome completo e CPF de
  quem aceita, uma caixa desmarcada de "li e concordo" e o botão de aceite.
- **FR-017**: O aceite DEVE gravar nome, CPF, data e hora, IP, navegador e uma impressão digital do texto aceito, que
  prova que o texto não mudou depois. O servidor DEVE recusar aceite de contrato com pendência, já aceito ou
  inexistente.
- **FR-018**: Contrato aceito DEVE ficar imutável: não se edita nem se exclui.

**Integração das telas**

- **FR-019**: O cartão da proposta de cadeira DEVE mostrar o estado do contrato (pendências, aguardando aceite, aceito
  em data por nome) com o caminho para ele. Sem contrato, mostra "Emitir contrato".
- **FR-020**: `/admin/contratos` DEVE listar contratos de cadeira e da Vértice juntos, do mais novo para o mais antigo,
  cada um marcado com o tipo. A falha de uma fonte não esconde a outra.
- **FR-021**: A exclusão de uma proposta de cadeira com contrato DEVE ser recusada, com o motivo.
- **FR-022**: Toda ação do admin (emitir, editar, excluir) DEVE conferir a sessão no servidor, como as outras ações do
  admin.

### Key Entities *(include if feature involves data)*

- **Contrato de cadeira**: o contrato emitido a partir de uma proposta de cadeira. Tem um link próprio, a proposta de
  origem (no máximo um contrato por proposta), o que o operador preencheu, o documento congelado (tudo o que o link
  mostra, com a cópia dos termos da proposta), a lista de pendências, as datas de criação e de edição e o registro do
  aceite.
- **Registro de aceite**: nome, CPF, data e hora, IP, navegador e impressão digital do texto aceito. Um por contrato.
- **Proposta de cadeira** (spec 019, existe): passa a saber se tem contrato. O documento dela não muda.
- **Contrato da Vértice** (existe): não muda. Só passa a dividir a lista com o de cadeira.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O operador emite o contrato de uma proposta de cadeira em menos de 5 minutos, digitando só os dados das
  partes, o início e o foro.
- **SC-002**: Em 100% dos contratos emitidos, anuidade, domínio, comissão e entregáveis são idênticos aos da proposta
  de origem, conferidos campo a campo num contrato de teste de cada modelo de nicho (% por pedido, mensalidade,
  consulta).
- **SC-003**: Nenhum contrato com pendência pode ser aceito: o aceite forçado de um contrato pendente é recusado nos
  testes.
- **SC-004**: Todo aceite gravado tem nome, CPF, data e hora, IP, navegador e impressão do texto, e o texto aceito
  confere com a impressão gravada.
- **SC-005**: O parceiro lê o contrato inteiro e aceita pelo celular (360 px de largura) sem rolagem lateral.
- **SC-006**: O primeiro contrato de cadeira real é emitido e aceito pelo link, sem contrato redigido fora do sistema.

## Assumptions

- O parceiro é, em regra, empresa que usa a cadeira na atividade dela: contrato paritário de Código Civil, e não de
  consumidor [LEI CC 421-A]. O caso pessoa física segue o FR-014.
- O aceite por clique com registro de autoria vale como prova [LEI MP 2.200-2/2001 art. 10 §2º]. Assinatura por
  provedor certificado, que tornaria o contrato título executivo sem testemunhas [LEI CPC 784 §4º], fica fora da v1:
  anuidade e comissões mensais são valores pequenos. Upgrade: provedor de assinatura se a cobrança judicial virar
  risco real.
- A vigência é de 12 meses a partir do início escrito ou, em branco, da data do aceite. A renovação é por mais 12
  meses, salvo aviso de qualquer parte com 30 dias de antecedência. O reajuste anual da anuidade é pelo IPCA [LEI Lei
  10.192/2001 art. 2º §1º].
- O parceiro tem 5 dias úteis, depois de receber o relatório, para contestar a comissão. Sem contestação, a cobrança do
  dia 05 segue.
- Inadimplência: multa de 2%, juros de 1% ao mês e correção pelo IPCA. A operação é suspensa só depois de aviso com 10
  dias de prazo.
- Proteção de dados: a ROI Labs atende os clientes do parceiro e trata dados deles. O contrato define os papéis e
  remete a um acordo de tratamento de dados. Nicho de saúde (clínica, consulta) guarda dado sensível e leva essa
  cláusula ao advogado antes do primeiro contrato real do nicho.
- O texto das cláusulas é uma **minuta**, escrita a partir das condições congeladas da proposta, das cláusulas gerais
  do contrato-quadro do vault e do checklist de contrato B2B. Antes do primeiro contrato real, o dono decide se passa
  pelo advogado. Ponto a levar: a natureza do contrato (prestação de serviços de marketing e vendas, não representação
  comercial da Lei 4.886/65), porque a equipe de vendas da ROI Labs fecha vendas do parceiro e recebe comissão sobre
  elas.
- Fica fora: cobrar a anuidade ou a comissão (spec 010/014 e cobrança manual), editar a proposta, aceite da proposta,
  mais de um contrato por proposta, aditivo, assinatura por provedor e contrato de cadeira sem proposta de origem.
