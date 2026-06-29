# Feature Specification: E-commerce de porcelanato sobre o pSEO existente

**Feature Branch**: `002-ecommerce-porcelanato`

**Created**: 2026-06-29

**Status**: Draft

**Input**: User description: "Quero transformar o site-goiania (pSEO de porcelanato) em e-commerce de fato — com pagamento online — sem perder nada de pSEO."

## Contexto

`site-goiania` é um site Astro **100% estático** com motor de pSEO já maduro (~40 páginas de categoria, páginas de produto a partir de `porcelanatos.json`, sitemap, JSON-LD `Product`/`Offer`/`BreadcrumbList`/`FAQ`). Monetização atual = lead-gen (formulário → `/app` `/api/leads-consumidor` + WhatsApp). Esta feature adiciona uma **camada transacional de e-commerce** por cima, **sem alterar a natureza estática nem o conteúdo das páginas indexáveis**.

Decisões de negócio já fechadas (brainstorming 2026-06-29):

| Eixo | Decisão |
|------|---------|
| Transação | Pagamento online real (Pix + cartão) |
| Dinheiro | ROI recebe 100% numa conta; repasse manual ao fornecedor (sem split) |
| Fulfillment | Fornecedor exclusivo do polo entrega; ROI não estoca |
| Frete | Tabela fixa por região da Grande Goiânia (CEP→faixa) + retirada grátis |
| Estoque | Sem estoque em tempo real → pedido pago = reserva; confirmação do fornecedor em 24h ou reembolso |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprar porcelanato e pagar online (Priority: P1)

Um visitante que chegou por uma página de pSEO de produto adiciona o porcelanato ao carrinho informando os **m² da obra**, revisa a quantidade convertida em **caixas fechadas** (com folga de perda sugerida) e o total, preenche seus dados e CEP, e **paga online** (Pix ou cartão). Ao concluir, vê a confirmação do pedido. É o MVP completo do e-commerce.

**Why this priority**: É a própria transformação pedida — sem comprar-e-pagar não há "e-commerce de fato". Sozinha já entrega receita transacional.

**Independent Test**: Adicionar um produto, informar m², ir ao checkout, pagar com Pix de teste e confirmar que um pedido `pago` foi registrado e exibido na página de confirmação.

**Acceptance Scenarios**:

1. **Given** uma página de produto com preço por m², **When** o visitante informa os m² e adiciona ao carrinho, **Then** o carrinho mostra a quantidade em caixas fechadas (arredondada para cima, com folga de perda padrão) e o subtotal `caixas × m²/caixa × preço/m²`.
2. **Given** itens no carrinho, **When** o visitante finaliza, **Then** o total é **recalculado no servidor** a partir da fonte de preços (nunca confiando em valores vindos do cliente) e ele é levado ao pagamento.
3. **Given** o pagamento aprovado, **When** o provedor confirma, **Then** o pedido fica `pago` e o visitante vê a confirmação com o resumo.
4. **Given** o pagamento recusado/abandonado, **When** o visitante volta, **Then** o pedido permanece `pendente` e o carrinho é preservado.

---

### User Story 2 - Frete por região de Goiânia ou retirada (Priority: P2)

No checkout, o visitante informa o CEP e o sistema aplica o **frete da faixa de região** correspondente, ou ele escolhe **retirar no fornecedor (grátis)**. O total reflete o frete antes do pagamento.

**Why this priority**: Porcelanato é pesado e o frete muda o valor cobrado; sem ele o total online não fecha com a realidade. Pode entrar logo após o fluxo base (que pode começar só com retirada grátis).

**Independent Test**: Informar um CEP da Grande Goiânia e ver o frete correto da tabela somado ao total; alternar para "retirada" e ver o frete zerar.

**Acceptance Scenarios**:

1. **Given** um CEP coberto pela tabela, **When** informado no checkout, **Then** o frete da faixa é somado ao total.
2. **Given** a opção "retirar no fornecedor", **When** selecionada, **Then** o frete é R$ 0 e o total reflete só o produto.
3. **Given** um CEP fora das faixas cadastradas, **When** informado, **Then** o checkout permite finalizar com **frete "a combinar"**: o total online cobre só o produto e o pedido é marcado para o frete ser fechado com o fornecedor depois.

---

### User Story 3 - Reserva paga, confirmação do fornecedor e reembolso (Priority: P2)

Como não há estoque em tempo real, todo pedido pago entra como **reserva**. O fornecedor confirma a disponibilidade do lote em até 24h: se disponível, o pedido vira `confirmado`; se faltar, o pedido é **reembolsado** e o cliente avisado. O status fica consultável.

**Why this priority**: Protege contra cobrar sem poder entregar — risco direto de dinheiro. Não bloqueia o MVP de pagar, mas é necessário antes de operar de verdade.

**Independent Test**: Marcar um pedido pago como "lote indisponível" e confirmar que ele transita para `reembolsado` e o cliente recebe a comunicação; marcar como disponível e ver `confirmado`.

**Acceptance Scenarios**:

1. **Given** um pedido `pago`, **When** registrado, **Then** seu status inicial de fulfillment é `aguardando confirmação` (reserva).
2. **Given** uma reserva, **When** o fornecedor confirma disponibilidade, **Then** o pedido vira `confirmado`.
3. **Given** uma reserva sem lote disponível, **When** marcada como indisponível, **Then** o pagamento é reembolsado e o pedido vira `reembolsado`.

---

### User Story 4 - Operação de pedidos para repasse manual (Priority: P3)

A ROI precisa ver os pedidos pagos (cliente, itens, m²/caixas, frete, total, status) para **repassar manualmente** ao fornecedor e acompanhar reservas/reembolsos — espelhando o painel de leads já existente.

**Why this priority**: Operacionaliza o repasse manual decidido. Útil, mas o fluxo de receita já funciona sem painel dedicado (consulta direta ao dado é suficiente no day-1).

**Independent Test**: Criar um pedido pago e confirmar que ele aparece na listagem operacional com todos os campos necessários ao repasse.

**Acceptance Scenarios**:

1. **Given** pedidos registrados, **When** a operação abre a listagem, **Then** vê cada pedido com itens, quantidades, frete, total e status.

---

### Edge Cases

- Preço do produto mudou entre o "adicionar ao carrinho" e o checkout → o total **válido** é o recalculado no servidor no momento do checkout; divergências são resolvidas a favor do preço atual da fonte.
- Quantidade informada resulta em 0 caixas (m² muito pequeno) → mínimo de 1 caixa.
- Carrinho com produto cujo `slug` não existe mais na fonte → item é descartado no checkout com aviso.
- Notificação de pagamento duplicada/atrasada do provedor → processamento idempotente por id do pagamento (não duplica nem rebaixa status).
- Notificação de pagamento forjada → rejeitada por validação de autenticidade antes de mudar qualquer status.

## Requirements *(mandatory)*

### Functional Requirements

**Vitrine / carrinho (site estático)**
- **FR-001**: As páginas de produto MUST oferecer "Adicionar ao carrinho" sem deixar de oferecer o canal WhatsApp existente.
- **FR-002**: O sistema MUST converter os m² informados pelo cliente em caixas fechadas, arredondando para cima e aplicando uma folga de perda padrão (default 10%, ajustável), com mínimo de 1 caixa.
- **FR-003**: O carrinho MUST persistir no navegador do cliente entre páginas e recargas, sem exigir login.
- **FR-004**: O carrinho MUST exibir, por item, quantidade em caixas, m² cobertos e subtotal, e o total geral.

**Checkout / pagamento**
- **FR-005**: O sistema MUST recalcular preço de cada item e o total **no servidor**, a partir da fonte de preços, ignorando quaisquer valores monetários enviados pelo cliente.
- **FR-006**: O sistema MUST aceitar pagamento online via Pix e cartão.
- **FR-007**: O sistema MUST registrar o pedido com itens, dados de contato do cliente, CEP/forma de entrega, frete e total, e refletir o status do pagamento.
- **FR-008**: O sistema MUST processar a confirmação de pagamento do provedor de forma idempotente e somente após validar a autenticidade da notificação.
- **FR-009**: Após pagamento aprovado, o cliente MUST ver uma confirmação com o resumo do pedido.

**Frete**
- **FR-010**: O sistema MUST calcular o frete por faixa de região da Grande Goiânia a partir do CEP, usando uma tabela editável.
- **FR-011**: O sistema MUST oferecer "retirar no fornecedor" com frete zero.
- **FR-016**: Para CEP fora das faixas cadastradas, o sistema MUST permitir finalizar com frete "a combinar" — total online só do produto e pedido marcado para o frete ser fechado pela operação com o fornecedor.

**Reserva / fulfillment**
- **FR-012**: Todo pedido pago MUST iniciar como reserva (`aguardando confirmação`), por não haver estoque em tempo real.
- **FR-013**: A operação MUST poder transitar uma reserva para `confirmado` ou disparar reembolso (`reembolsado`) caso o lote não exista.
- **FR-014**: A operação MUST conseguir listar os pedidos com os campos necessários ao repasse manual ao fornecedor.

**Preservação de pSEO (restrição transversal)**
- **FR-015**: Nenhuma página indexável (categorias, produtos, hub, sitemap) pode deixar de ser pré-renderizada estaticamente nem ter seu HTML/JSON-LD/sitemap alterado em conteúdo por esta feature. A camada de e-commerce entra apenas como elementos client-side e endpoints fora do deploy estático.

### Key Entities *(include if feature involves data)*

- **Pedido**: uma intenção de compra paga ou em andamento. Atributos: contato do cliente (nome, WhatsApp/e-mail), forma de entrega (retirada/entrega/frete-a-combinar) + CEP, frete (valor ou "a combinar"), total, status de pagamento (`pendente`/`pago`/`reembolsado`), status de fulfillment (`aguardando confirmação`/`confirmado`/`reembolsado`), referência do pagamento no provedor, timestamps. Consentimento LGPD como no lead atual.
- **ItemPedido**: uma linha do pedido. Atributos: `slug` do produto, quantidade em caixas, m² cobertos, preço unitário por m² no momento da compra, subtotal. Relaciona-se a um Pedido.
- **FaixaFrete** (pode ser tabela de configuração, não necessariamente persistida): mapeia faixa de CEP/região → valor de frete.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um visitante consegue ir de uma página de produto até o pagamento aprovado em ≤ 2 minutos, sem criar conta.
- **SC-002**: 100% dos pedidos pagos têm total igual ao recalculado no servidor (zero divergência cliente↔servidor cobrada).
- **SC-003**: Zero regressão de pSEO: todas as URLs indexáveis continuam retornando HTML pré-renderizado e o sitemap permanece idêntico em cobertura (verificável comparando o `dist/` antes/depois).
- **SC-004**: 100% dos pedidos pagos entram como reserva e têm um desfecho registrado (`confirmado` ou `reembolsado`) — nenhum pedido pago fica sem tratamento.
- **SC-005**: Notificações de pagamento duplicadas não geram pedido duplicado nem cobrança/estado inconsistente.

## Assumptions

- **Reuso do backend existente**: a persistência de pedidos e o tratamento de pagamento entram no `/app` (Next 16 + Prisma + Postgres `roilabs_db`) já usado pelos leads, espelhando o padrão `LeadConsumidor` / `/api/leads-consumidor` / `/admin/leads`. Não se cria um segundo backend.
- **Provedor de pagamento**: Mercado Pago (Pix + cartão), com **uma** conta da ROI; credenciais via env, sem hard-code (Constituição I). Split/marketplace fora de escopo.
- **Site permanece estático**: o `site-goiania` continua build estático → nginx; nenhum adapter SSR é adicionado (Abordagem A do design). O carrinho é client-side; checkout/webhook são chamadas ao `/app`.
- **Frete como knob**: os valores e faixas da tabela de frete vêm da operação; começam cobrindo a Grande Goiânia. Cálculo por transportadora/fora do polo está fora de escopo.
- **Fonte de preços**: `porcelanatos.json` (preço por m²) é a fonte de verdade para o recálculo no servidor; o `/app` precisa acessá-la (ou um espelho dela) no checkout.
- **Sem conta de cliente**: checkout é guest; o cliente acompanha o pedido pelo retorno do pagamento (página de confirmação), sem área logada.
- **Verificação em ambiente real** (Constituição II): pagamento testado com credenciais de teste do Mercado Pago e fluxo validado em Docker/navegador, não em build local.

## Out of Scope

- Split de pagamento / repasse automático (repasse é manual).
- Cálculo de frete por transportadora ou para fora da Grande Goiânia.
- Estoque em tempo real / integração com ERP do fornecedor.
- Conta de cliente, histórico logado, wishlist, cupons.
- Adapter SSR / mudança do modelo de deploy estático do `site-goiania`.
