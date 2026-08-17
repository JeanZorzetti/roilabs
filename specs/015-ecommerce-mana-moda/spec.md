# Feature Specification: E-commerce Maná Moda Social Masculina

**Feature Branch**: `015-ecommerce-mana-moda`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Nova cadeira \"Maná Moda Social Masculina\" (Instagram: instagram.com/manamodasocial) ocupa uma cadeira vaga da carteira ROI Labs (specs 012/013). Vamos construir um e-commerce de moda masculina para essa marca, publicado em mana.roilabs.com.br. A ROI Labs cobra comissão única de 10% sobre as vendas processadas (taxa flat, não o modelo de duas taxas aquisição/recorrência da spec 010). Roupa é uma unidade de venda nova para o motor de loja (SKU com variação de tamanho/cor), diferente de m²/rolo/assinatura que o motor multicadeira (spec 013) cobre hoje — a spec deve tratar essa diferença de unidade como decisão central de escopo, não deixar implícita."

## Clarifications

### Session 2026-08-17

- Q: Como o comprador se identifica no checkout? → A: Convidado, sem criar conta — coleta e-mail
  e CPF/CNPJ para identificar o pedido depois (mesmo padrão do goiania).
- Q: Ao solicitar troca/devolução self-service, qual é o resultado? → A: O comprador escolhe, no
  momento da solicitação, entre reembolso do valor pago ou troca por outro tamanho/cor do mesmo
  produto.
- Q: O que acontece quando o pagamento é recusado ou fica em análise? → A: O pedido fica
  "pendente", o comprador é avisado na hora e pode tentar pagar de novo sem perder o carrinho.
- Q: Quando dois compradores disputam a última unidade de uma variação, quem leva? → A: Colocar
  no carrinho não reserva nada; o estoque só é debitado quando o pagamento é aprovado. Quem pagar
  primeiro leva — o outro é avisado da indisponibilidade e, se já tinha pago, recebe reembolso
  automático.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprador finaliza uma compra de moda masculina (Priority: P1)

Um visitante encontra a Maná Moda em `mana.roilabs.com.br`, navega o catálogo de roupas
masculinas, escolhe um produto em um tamanho e cor disponíveis, adiciona ao carrinho e
conclui a compra pagando online.

**Why this priority**: Sem uma compra completa ponta a ponta não há venda, não há comissão e
a cadeira não gera receita — é o MVP mínimo que justifica a existência da loja.

**Independent Test**: Pode ser testado isoladamente navegando o catálogo público, adicionando
um item ao carrinho e concluindo o checkout até a confirmação do pedido, sem depender de
nenhuma outra funcionalidade.

**Acceptance Scenarios**:

1. **Given** o catálogo publicado com produtos e variações em estoque, **When** o comprador
   escolhe um produto, seleciona tamanho e cor disponíveis e finaliza o pagamento, **Then** o
   pedido é confirmado e o comprador recebe a confirmação da compra.
2. **Given** um produto com uma variação de tamanho/cor sem estoque, **When** o comprador tenta
   adicioná-la ao carrinho, **Then** o sistema impede a adição e indica que aquela variação está
   indisponível.
3. **Given** um carrinho com itens de valores diferentes, **When** o comprador revisa o
   checkout, **Then** o valor total exibido inclui todos os itens e o frete calculado antes da
   confirmação do pagamento.

---

### User Story 2 - Maná Moda acompanha vendas e recebe o repasse (Priority: P2)

A Maná Moda, como parceira que ocupa a cadeira, precisa ver quanto vendeu, quanto a ROI Labs
reteve de comissão (10%) e quanto tem a receber, sem precisar perguntar manualmente.

**Why this priority**: A cadeira só é sustentável se o parceiro confia na apuração — é o que
mantém a relação comercial depois da primeira venda, mas não bloqueia a Story 1.

**Independent Test**: Pode ser testado isoladamente gerando vendas de teste e conferindo se o
valor de comissão e o valor líquido a repassar aparecem corretos para o período, sem depender
da jornada de compra em si.

**Acceptance Scenarios**:

1. **Given** vendas concluídas em um período, **When** a Maná Moda consulta o resumo de vendas,
   **Then** o sistema mostra o total vendido, a comissão de 10% retida e o valor líquido devido.
2. **Given** o valor líquido apurado de um período, **When** o ciclo de repasse se completa,
   **Then** a Maná Moda recebe o valor líquido correspondente.

---

### User Story 3 - ROI Labs cadastra a cadeira na carteira (Priority: P3)

A equipe da ROI Labs registra a Maná Moda como cadeira ocupada na carteira de parceiros, com a
comissão de 10% associada, para que ela apareça publicamente como parceira ativa.

**Why this priority**: É pré-requisito administrativo, mas não bloqueia a compra em si — pode
ser feito com um cadastro mínimo antes do catálogo completo existir.

**Independent Test**: Pode ser testado isoladamente conferindo se a cadeira aparece como
"ocupada" na carteira pública com a comissão correta, sem depender do catálogo de produtos.

**Acceptance Scenarios**:

1. **Given** a cadeira vaga na carteira, **When** a equipe da ROI Labs cadastra a Maná Moda com
   a comissão de 10%, **Then** a cadeira passa a aparecer como ocupada, com a URL
   `mana.roilabs.com.br` associada.

---

### Edge Cases

- Última unidade disputada por dois carrinhos: nenhum dos dois tem reserva; quem pagar primeiro
  leva, o outro é avisado da indisponibilidade e recebe reembolso automático se já tinha pago
  (ver FR-016).
- Troca/devolução após confirmação e pagamento: comprador escolhe entre reembolso ou troca por
  outra variação disponível, self-service na loja (ver FR-011).
- Pagamento recusado ou em análise: pedido fica pendente, comprador é avisado e pode tentar
  pagar de novo sem perder o carrinho (ver FR-015).
- Como o comprador é avisado se um produto exibido no catálogo não tiver mais nenhuma variação
  disponível?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir uma vitrine pública com o catálogo de produtos de moda
  masculina da Maná Moda em `mana.roilabs.com.br`.
- **FR-002**: O sistema DEVE mostrar, na página de cada produto, as variações de tamanho e cor
  disponíveis antes de o comprador adicionar ao carrinho.
- **FR-003**: O sistema DEVE impedir a adição ao carrinho de uma variação (tamanho/cor) sem
  estoque disponível.
- **FR-004**: O sistema DEVE permitir que o comprador monte um carrinho com múltiplos
  produtos/variações e finalize a compra em um único checkout.
- **FR-005**: O sistema DEVE calcular o frete dinamicamente por CEP do comprador (mesma
  integração de cotação real já usada pelas cadeiras físicas da carteira) e exibi-lo antes da
  confirmação do pagamento.
- **FR-006**: O sistema DEVE processar o pagamento da compra e confirmar o pedido ao comprador
  após a aprovação.
- **FR-007**: O sistema DEVE aplicar automaticamente a comissão única de 10% da ROI Labs sobre o
  valor de cada venda concluída, sem depender de classificação por cliente novo/recorrente.
- **FR-008**: O sistema DEVE controlar o estoque por variação (tamanho/cor) de forma automática:
  o operador da ROI Labs cadastra a quantidade disponível por variação e o sistema debita a cada
  venda concluída, bloqueando novas vendas quando a quantidade chega a zero.
  *(Emendado em 2026-08-17 pelo `/speckit-analyze`: a redação original dizia "a Maná Moda
  cadastra", o que exigiria escrita no painel do parceiro — e ele é somente leitura nesta versão.
  Teto e caminho de upgrade em plan.md, Complexity Tracking.)*
- **FR-009**: O sistema DEVE fornecer à Maná Moda um resumo consultável das vendas realizadas,
  da comissão retida e do valor líquido a receber.
- **FR-010**: O sistema DEVE repassar à Maná Moda o valor líquido das vendas (valor da venda
  menos a comissão de 10%) em uma cadência regular.
- **FR-011**: O sistema DEVE permitir que o próprio comprador solicite troca ou devolução de um
  pedido diretamente na loja, respeitando o direito de arrependimento de 7 dias previsto no CDC
  para compra online. Ao solicitar, o comprador DEVE poder escolher entre reembolso do valor
  pago ou troca por outro tamanho/cor disponível do mesmo produto.
- **FR-012**: O sistema DEVE registrar a Maná Moda como cadeira ocupada na carteira de parceiros
  da ROI Labs, com a comissão de 10% e a URL `mana.roilabs.com.br` associadas.
- **FR-013**: O sistema DEVE confirmar ao comprador a finalização do pedido de forma explícita
  (por exemplo, página de confirmação com os itens e o valor pago).
- **FR-014**: O sistema DEVE permitir a compra como convidado, sem exigir criação de conta,
  coletando e-mail e CPF/CNPJ do comprador para identificar o pedido posteriormente.
- **FR-015**: Quando o pagamento for recusado ou ficar em análise, o sistema DEVE manter o
  pedido como pendente, avisar o comprador imediatamente e permitir nova tentativa de pagamento
  sem perder o carrinho montado.
- **FR-016**: Adicionar um produto ao carrinho NÃO DEVE reservar estoque; o estoque só é
  debitado quando o pagamento é aprovado. Se dois compradores pagarem pela mesma unidade e ela
  já tiver sido vendida, o sistema DEVE avisar o segundo comprador da indisponibilidade e
  reembolsá-lo automaticamente.

### Key Entities

- **Produto**: item de moda masculina vendido pela Maná Moda — nome, descrição, preço, imagens,
  categoria.
- **Variação**: combinação de tamanho e cor de um Produto, cada uma com seu próprio estoque.
- **Pedido**: compra feita por um comprador — um ou mais itens (Produto + Variação +
  quantidade), valor total, frete e status (confirmado, cancelado, etc.), identificado por
  e-mail e CPF/CNPJ do comprador (sem exigir conta).
- **Cadeira/Parceiro (Maná Moda)**: entidade que ocupa a cadeira vaga na carteira, com a
  comissão de 10% associada.
- **Repasse**: valor líquido devido à Maná Moda referente às vendas de um período, após dedução
  da comissão da ROI Labs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um comprador consegue ir do catálogo até a confirmação da compra em menos de 5
  minutos.
- **SC-002**: 100% das vendas concluídas têm a comissão de 10% aplicada corretamente, sem
  intervenção manual.
- **SC-003**: A Maná Moda consegue conferir, a qualquer momento, quanto vendeu e quanto tem a
  receber, sem precisar pedir esse número à ROI Labs.
- **SC-004**: Nenhuma venda é aceita para uma variação de produto sem estoque disponível.
- **SC-005**: `mana.roilabs.com.br` está publicamente acessível e a Maná Moda aparece como
  cadeira ocupada na carteira da ROI Labs, com a comissão correta.

## Assumptions

- Roupa (SKU com variação de tamanho/cor) é uma unidade de venda diferente de m²/rolo/assinatura
  — decisão de como o motor de loja existente (spec 013) absorve essa unidade nova é técnica e
  fica para `/speckit-plan`, não para esta especificação.
- Por ser cadeira de produto físico, o pagamento segue a decisão já travada na spec 012 (cadeira
  física → processada pelo carrinho da própria ROI Labs), com repasse do valor líquido à Maná
  Moda — não pelo gateway do parceiro.
- A comissão de 10% é uma taxa única (flat) sobre toda venda processada, diferente do modelo de
  duas taxas aquisição/recorrência usado por outros parceiros (spec 010).
- Catálogo inicial cobre variação por tamanho e cor; outros atributos de variação (ex.: tecido,
  modelagem) ficam fora do escopo desta versão.
- Escopo geográfico inicial é o Brasil, em português e reais (BRL).
- A Maná Moda é responsável pelo conteúdo, fotos e fornecimento dos produtos; a ROI Labs opera a
  vitrine, o checkout, o controle de estoque exposto ao comprador e a cobrança da comissão.
