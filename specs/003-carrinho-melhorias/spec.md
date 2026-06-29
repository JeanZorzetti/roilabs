# Feature Specification: Melhorias do carrinho do e-commerce de porcelanato

**Feature Branch**: `003-carrinho-melhorias`

**Created**: 2026-06-29

**Status**: Draft

**Input**: User description: "Melhorar o carrinho do e-commerce de porcelanato (site-goiania, em produção em goiania.roilabs.com.br/carrinho/), construído sobre a spec 002-ecommerce-porcelanato, sem regredir pSEO nem o checkout/pagamento existente. Quatro frentes: UX/conversão; simulador de m² por ambiente; frete/CEP dentro do carrinho; recuperação de carrinho + cupom."

## Contexto

A spec **002-ecommerce-porcelanato** já entregou o carrinho transacional: páginas de produto com "Adicionar ao carrinho", conversão de m²→caixas fechadas, persistência client-side, checkout com recálculo autoritativo no servidor, Pix/cartão e frete por faixa da Grande Goiânia. O carrinho está **em produção** em `goiania.roilabs.com.br/carrinho/`.

Esta feature **melhora o carrinho já existente** — não recria a camada transacional nem o checkout/pagamento. Quatro frentes de melhoria, escolhidas pelo dono do produto:

| Frente | O que melhora | Por que importa |
|--------|---------------|-----------------|
| UX/conversão | Mini-cart no header, edição inline de quantidade/m², estados vazio/erro/carregando claros, resumo transparente caixas×m²×preço, mobile-first, CTA forte | O carrinho é o gargalo de conversão; hoje obriga voltar à página de produto para mexer na quantidade |
| Simulador de m² | Cliente informa medidas por ambiente (cômodo), com folga de perda ajustável, em vez de digitar um único "m² da obra" | Comprador de porcelanato erra o m² → compra a menos (frustra) ou a mais (sobra cara); o simulador reduz erro e insegurança |
| Frete/CEP no carrinho | Frete por faixa da Grande Goiânia **e prazo** já no carrinho, antes do checkout, com retirada grátis e "a combinar" | Porcelanato é pesado; descobrir o frete só no checkout gera abandono por surpresa de preço |
| Recuperação + cupom | Salvar/recuperar carrinho por link compartilhável e aplicar cupom de desconto | Recupera carrinhos abandonados e dá alavanca de campanha à operação |

**Restrição transversal (herdada da 002):** o carrinho continua **client-side** sobre o `site-goiania` (Astro 100% estático → nginx); todo valor monetário (preço, frete, desconto, total) é **recalculado e validado no servidor** (`/app` Next) no checkout, **nunca confiando em valores vindos do cliente**; nenhuma página indexável de pSEO pode deixar de ser pré-renderizada nem ter seu HTML/JSON-LD/sitemap alterado em conteúdo.

## Clarifications

### Session 2026-06-29

- Q: Quais tipos de cupom o sistema deve suportar? → A: Percentual e valor fixo, incidindo só sobre o subtotal do produto (não sobre o frete); sem cupom de "frete grátis" nesta feature.
- Q: O simulador de m² por ambiente substitui a entrada direta de m², ou os dois coexistem? → A: Coexistem — entrada rápida de m²/caixas (US1) e o simulador por ambiente (US2) como opção; nenhum substitui o outro.
- Q: Por quanto tempo um link de carrinho salvo deve permanecer válido? → A: 30 dias a partir da geração; depois expira.
- Q: Qual a faixa permitida para a folga de perda ajustável? → A: 5%–20%, com default 10%; valores fora são ajustados ao limite mais próximo com aviso.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Carrinho claro e editável que converte (Priority: P1)

Um visitante com itens no carrinho consegue, **sem sair da página do carrinho**, ajustar a quantidade (em m² ou em caixas) de cada item, ver o subtotal e o total recalcularem na hora, entender em texto claro quantas **caixas fechadas** está levando e quantos **m² cobrem**, e seguir para o checkout por um CTA evidente. Em qualquer página do site, um **mini-cart no header** mostra a contagem de itens e dá acesso rápido ao carrinho. Estados de carrinho **vazio**, **carregando** e **erro** são explícitos, nunca uma tela em branco.

**Why this priority**: É o núcleo de "melhorar o carrinho". Editar quantidade sem voltar à página de produto e enxergar o resumo com clareza é o que mais move conversão; tudo o mais (simulador, frete, cupom) pluga neste carrinho redesenhado. Sozinha já entrega ganho de conversão.

**Independent Test**: Com itens no carrinho, alterar os m² de um item inline e confirmar que caixas, m² cobertos, subtotal e total atualizam coerentemente; remover um item e ver o estado vazio; abrir o mini-cart no header em outra página e ver a contagem correta.

**Acceptance Scenarios**:

1. **Given** um carrinho com itens, **When** o visitante altera os m² (ou caixas) de um item na própria página do carrinho, **Then** quantidade em caixas, m² cobertos, subtotal do item e total geral se atualizam imediatamente, respeitando arredondamento para cima e mínimo de 1 caixa.
2. **Given** um item no carrinho, **When** o visitante reduz sua quantidade a zero ou aciona "remover", **Then** o item sai do carrinho e o total reflete a remoção; se foi o último item, o carrinho mostra o **estado vazio** com chamada para voltar à vitrine.
3. **Given** qualquer página do site (inclusive páginas de pSEO), **When** há itens no carrinho, **Then** o mini-cart no header exibe a contagem de itens e um caminho de 1 clique para o carrinho — sem que isso altere o HTML pré-renderizado/indexável da página.
4. **Given** o carrinho carregando seu estado persistido ou recalculando, **When** a operação está em andamento, **Then** o visitante vê um estado de **carregando**; se algo falha, vê um estado de **erro** com ação de tentar de novo — nunca uma tela em branco.
5. **Given** um carrinho com itens válidos, **When** o visitante aciona o CTA de finalizar, **Then** ele segue para o checkout existente (002) sem regressão do fluxo de pagamento.

---

### User Story 2 - Simulador de m² por ambiente (Priority: P2)

Como **alternativa opcional** à entrada direta de m²/caixas (US1) — sem substituí-la —, o visitante informa as **medidas por ambiente** (ex.: sala 4,0 × 3,5 m; cozinha 3,0 × 2,5 m). O sistema soma a área, aplica uma **folga de perda ajustável** entre 5% e 20% (padrão 10%, que o cliente pode mudar), converte para **caixas fechadas** considerando os m² por caixa do produto, com mínimo de 1 caixa, e mostra o resultado de forma transparente antes de adicionar/atualizar o item.

**Why this priority**: Comprador de porcelanato tem dificuldade real de calcular metragem; o erro custa dinheiro e confiança. O simulador reduz abandono por insegurança e devoluções por compra errada. Depende do carrinho da US1 para exibir o resultado, por isso vem depois.

**Independent Test**: Informar dois ambientes com medidas conhecidas, definir folga de 10%, e confirmar que a área somada, a área com folga e a quantidade de caixas fechadas batem com o cálculo esperado (arredondado para cima, mínimo 1 caixa); mudar a folga para 5% e ver as caixas recalcularem.

**Acceptance Scenarios**:

1. **Given** o simulador aberto para um produto, **When** o visitante adiciona ambientes com largura × comprimento, **Then** o sistema mostra a área total somada em m².
2. **Given** uma área total e uma folga de perda definida, **When** o visitante confirma, **Then** o sistema aplica a folga (padrão 10%), converte os m² resultantes em caixas fechadas pelos m²/caixa do produto, arredonda para cima, garante mínimo de 1 caixa e mostra caixas, m² cobertos e folga aplicada antes de adicionar ao carrinho.
3. **Given** uma folga padrão de 10%, **When** o visitante altera a folga (ex.: 5% ou 15%), **Then** a quantidade de caixas e os m² cobertos recalculam de acordo.
4. **Given** medidas que resultam em fração de caixa, **When** convertidas, **Then** a quantidade sobe para a próxima caixa fechada (nunca caixa parcial).

---

### User Story 3 - Frete e prazo por CEP dentro do carrinho (Priority: P2)

Antes de ir ao checkout, o visitante informa o **CEP** na própria página do carrinho e vê o **valor do frete** da faixa da Grande Goiânia **e o prazo** estimado somados ao total, ou escolhe **retirar no fornecedor (grátis)**. Para CEP fora das faixas cadastradas, vê "frete **a combinar**" e ainda pode prosseguir (o total online cobre só o produto).

**Why this priority**: Descobrir o frete só no checkout é causa clássica de abandono por surpresa de preço; trazer frete + prazo para o carrinho dá transparência antes do compromisso. Reusa a tabela de faixas da 002; depende do carrinho da US1 para exibir.

**Independent Test**: Informar um CEP coberto e ver frete + prazo da faixa somados ao total no carrinho; alternar para "retirada" e ver o frete zerar; informar um CEP fora de faixa e ver "a combinar" com o total só do produto.

**Acceptance Scenarios**:

1. **Given** o carrinho com itens, **When** o visitante informa um CEP coberto pela tabela, **Then** o frete da faixa e o prazo estimado aparecem no carrinho e o total passa a incluir o frete — **o mesmo frete será reconfirmado pelo servidor no checkout**.
2. **Given** o frete exibido no carrinho, **When** o visitante seleciona "retirar no fornecedor", **Then** o frete vai a R$ 0 e o total reflete só o produto.
3. **Given** um CEP fora das faixas cadastradas, **When** informado no carrinho, **Then** o sistema mostra "frete a combinar", o total online cobre só o produto e o pedido segue marcado para o frete ser fechado depois (paridade com a 002).
4. **Given** um frete calculado e exibido no carrinho, **When** o visitante chega ao checkout, **Then** o frete cobrado é o **recalculado pelo servidor** a partir da tabela vigente; divergências resolvem a favor do valor do servidor.

---

### User Story 4 - Cupom de desconto (Priority: P3)

O visitante insere um **código de cupom** no carrinho e, se válido, vê o **desconto** aplicado ao total antes do checkout. Cupons inválidos, expirados ou que não atendem às condições são recusados com mensagem clara, sem alterar o total.

**Why this priority**: Dá à operação uma alavanca de campanha/recuperação, mas não é pré-requisito para o carrinho funcionar nem para receita. Entra depois do núcleo.

**Independent Test**: Aplicar um cupom válido e ver o desconto refletido no total recalculado; aplicar um cupom expirado/inexistente e ver recusa sem mudança no total; confirmar no checkout que o desconto cobrado é o validado no servidor.

**Acceptance Scenarios**:

1. **Given** um carrinho com itens, **When** o visitante aplica um cupom válido dentro das suas condições, **Then** o desconto é mostrado como linha própria e o total reflete o abatimento.
2. **Given** um cupom inválido, expirado ou abaixo do mínimo exigido, **When** aplicado, **Then** o sistema recusa com mensagem clara e o total permanece inalterado.
3. **Given** um cupom aplicado no carrinho, **When** o visitante finaliza, **Then** o servidor **revalida** o cupom e recalcula o desconto; um cupom que deixou de ser válido entre o carrinho e o checkout não é cobrado com desconto e o visitante é avisado.

---

### User Story 5 - Salvar e recuperar o carrinho por link (Priority: P3)

O visitante gera um **link compartilhável** do seu carrinho (para retomar em outro dispositivo, enviar a um cônjuge/empreiteiro ou pedir ajuda ao vendedor). Abrir o link restaura exatamente os itens e quantidades.

**Why this priority**: Recupera carrinhos abandonados e ajuda a decisão de compra a duas mãos (comum em reforma), mas é um extra sobre o carrinho que já funciona. P3.

**Independent Test**: Montar um carrinho, gerar o link, abrir o link numa sessão limpa e confirmar que os itens e quantidades são idênticos.

**Acceptance Scenarios**:

1. **Given** um carrinho com itens, **When** o visitante aciona "salvar/compartilhar", **Then** recebe um link que representa o estado atual do carrinho.
2. **Given** um link de carrinho salvo, **When** aberto em outra sessão/dispositivo, **Then** os itens e quantidades são restaurados de forma idêntica ao momento em que o link foi gerado.
3. **Given** preços que mudaram desde que o link foi gerado, **When** o carrinho é restaurado e levado ao checkout, **Then** vale o preço atual da fonte recalculado no servidor (paridade com a 002).

---

### Edge Cases

- **Edição concorrente m²/caixas**: o visitante pode editar tanto em m² quanto em caixas; ao editar um, o outro é derivado de forma consistente (caixas sempre fechadas, mínimo 1).
- **Produto saiu da fonte** (`slug` não existe mais) ao restaurar link ou recarregar: o item é descartado com aviso, sem quebrar o carrinho (paridade com a 002).
- **Cupom + "frete a combinar"**: o desconto incide só sobre o produto cobrado online; o frete a combinar é tratado fora, sem desconto sobre algo ainda não cobrado.
- **CEP digitado parcial/inválido**: o carrinho não trava; pede um CEP válido e mantém o total sem frete até obter um CEP utilizável.
- **Folga de perda fora da faixa** (ex.: 0% ou 90%): a folga é limitada a 5%–20%; valores fora são ajustados ao limite mais próximo com aviso.
- **Link de carrinho expirado** (>30 dias): não restaura o carrinho; mostra mensagem clara e oferece voltar à vitrine.
- **Cupom duplo / reaplicar**: aplicar outro cupom substitui o anterior (um cupom por carrinho), sem empilhar descontos, salvo decisão explícita da operação.
- **Mini-cart em página de pSEO**: o widget é injetado client-side; com JS desabilitado ou antes da hidratação, a página indexável permanece intacta e válida.
- **Link de carrinho adulterado** (quantidades/preços embutidos manipulados): nada vindo do link é confiável para valor; preço, frete e desconto são sempre recalculados no servidor.

## Requirements *(mandatory)*

### Functional Requirements

**UX / carrinho (US1)**
- **FR-001**: O carrinho MUST permitir editar a quantidade de cada item **na própria página do carrinho** — em m² ou em caixas — sem exigir voltar à página de produto, recalculando caixas, m² cobertos, subtotal e total imediatamente.
- **FR-002**: O carrinho MUST exibir, por item, de forma transparente: quantidade em **caixas fechadas**, **m² cobertos**, preço unitário aplicado e subtotal; e o **total geral** com suas linhas (produto, frete, desconto quando houver).
- **FR-003**: O sistema MUST oferecer um **mini-cart no header** em todas as páginas do site (incluindo páginas de pSEO) com a contagem de itens e acesso de 1 clique ao carrinho, **injetado client-side sem alterar o HTML pré-renderizado/indexável**.
- **FR-004**: O carrinho MUST tratar explicitamente os estados **vazio** (com chamada para a vitrine), **carregando** e **erro** (com ação de tentar de novo), nunca exibindo tela em branco.
- **FR-005**: O carrinho MUST oferecer um **CTA de finalizar** evidente que leva ao checkout existente (002) sem regressão do fluxo de pagamento, e MUST ser utilizável em telas mobile (mobile-first).

**Simulador de m² (US2)**
- **FR-006**: O sistema MUST oferecer um simulador — como **alternativa opcional** à entrada direta de m²/caixas do FR-001, sem substituí-la — onde o visitante informa **um ou mais ambientes** por largura × comprimento e vê a **área total** somada em m².
- **FR-007**: O sistema MUST aplicar uma **folga de perda ajustável pelo cliente** (default 10%, limitada a **5%–20%**; valores fora da faixa são ajustados ao limite mais próximo com aviso) sobre a área antes de converter em caixas.
- **FR-008**: O sistema MUST converter a área (com folga) em **caixas fechadas** usando os m²/caixa do produto, arredondando para cima, com **mínimo de 1 caixa**, e mostrar caixas, m² cobertos e folga aplicada antes de adicionar/atualizar o item.

**Frete no carrinho (US3)**
- **FR-009**: O carrinho MUST permitir informar o **CEP** e exibir o **frete da faixa** da Grande Goiânia **e o prazo estimado** somados ao total, reusando a tabela de faixas da 002.
- **FR-010**: O carrinho MUST oferecer **retirada no fornecedor com frete zero** e, para CEP fora das faixas, **"frete a combinar"** (total online só do produto), em paridade com a 002.
- **FR-011**: O frete exibido no carrinho MUST ser **reconfirmado e recalculado pelo servidor** no checkout; em divergência, vale o valor do servidor.

**Cupom (US4)**
- **FR-012**: O sistema MUST aceitar a aplicação de um **código de cupom** no carrinho e, se válido dentro de suas condições (validade, mínimo, escopo), exibir o desconto como linha própria e abater o total. Os tipos suportados são **percentual** e **valor fixo**, incidindo **somente sobre o subtotal do produto** (nunca sobre o frete); cupom de "frete grátis" está fora do escopo desta feature.
- **FR-013**: O sistema MUST recusar cupom inválido/expirado/abaixo do mínimo com **mensagem clara, sem alterar o total**, e MUST aceitar **no máximo um cupom por carrinho** (reaplicar substitui).
- **FR-014**: O sistema MUST **revalidar o cupom no servidor** no checkout e cobrar apenas o desconto validado; cupom que deixou de valer entre carrinho e checkout não é cobrado com desconto e o visitante é avisado.

**Recuperação de carrinho (US5)**
- **FR-015**: O sistema MUST permitir gerar um **link compartilhável** que represente o estado atual do carrinho (itens e quantidades), **válido por 30 dias** a partir da geração.
- **FR-016**: Abrir um link de carrinho salvo **dentro da validade** MUST **restaurar itens e quantidades** de forma idêntica ao momento da geração; itens cujo `slug` não existe mais são descartados com aviso. Um link **expirado** (após 30 dias) não restaura e MUST exibir mensagem clara.

**Restrições transversais (herdadas da 002)**
- **FR-017**: O sistema MUST recalcular e validar **no servidor** todo valor monetário (preço, frete, desconto, total) no checkout, a partir da fonte de preços e da tabela de frete, **ignorando quaisquer valores monetários enviados pelo cliente** (inclusive os embutidos em links de carrinho).
- **FR-018**: Nenhuma página indexável (categorias, produtos, hub, sitemap) pode deixar de ser **pré-renderizada estaticamente** nem ter seu HTML/JSON-LD/sitemap **alterado em conteúdo** por esta feature; as melhorias entram como elementos client-side e endpoints fora do deploy estático.
- **FR-019**: O carrinho MUST continuar **persistindo no navegador** e funcionando **sem login** (checkout guest), em paridade com a 002.

### Key Entities *(include if feature involves data)*

- **Carrinho**: o estado client-side de itens e quantidades; agora também recuperável por link. Atributos: lista de itens (slug, quantidade em caixas, m² cobertos, e — quando veio do simulador — a composição de ambientes), CEP/forma de entrega escolhida, cupom aplicado (código). Nenhum valor monetário do carrinho é fonte de verdade — tudo é recalculado no servidor.
- **AmbienteSimulado** (efêmero, parte de um item): largura × comprimento de um cômodo, usado para somar área e derivar caixas. Pode ser persistido no item para o cliente revisar/editar.
- **Cupom**: regra de desconto gerida pela operação. Atributos: código, tipo (**percentual** ou **valor fixo**, sempre sobre o subtotal do produto), valor, validade (início/fim), valor mínimo de pedido, escopo/condições, ativo. Fonte de verdade da validação é o servidor.
- **CarrinhoSalvo**: representação persistível de um carrinho recuperável por link. Atributos: identificador/token do link, conteúdo do carrinho (itens e quantidades), data de criação, **expiração (30 dias após a criação)**. Não armazena valores monetários como verdade.
- **FaixaFrete** (reuso da 002): faixa de CEP/região → valor de frete + prazo estimado. Agora também consultada a partir do carrinho.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um visitante consegue **ajustar quantidades, ver o frete e aplicar cupom inteiramente na página do carrinho** e chegar ao checkout em ≤ 90 segundos, sem voltar à página de produto e sem criar conta.
- **SC-002**: Em 100% dos carrinhos que informam CEP, o **frete e o prazo** ficam visíveis **antes** do checkout; e o total mostrado no carrinho é **igual** ao recalculado pelo servidor no checkout (zero divergência cobrada).
- **SC-003**: Em ≥ 95% dos carrinhos que usam o simulador, a quantidade de caixas resultante respeita as regras (arredondamento para cima, folga aplicada, mínimo 1 caixa) — verificável por casos de teste de medidas conhecidas.
- **SC-004**: 100% dos cupons cobrados com desconto foram **validados no servidor**; cupons inválidos/expirados nunca reduzem o total cobrado.
- **SC-005**: 100% dos links de carrinho salvos restauram **itens e quantidades idênticos** ao momento da geração (descontados apenas itens cujo produto saiu da fonte).
- **SC-006**: **Zero regressão de pSEO**: todas as URLs indexáveis continuam retornando HTML pré-renderizado e o `sitemap` permanece idêntico em cobertura (verificável comparando o `dist/` antes/depois), e o checkout/pagamento da 002 continua funcionando.

## Assumptions

- **Construído sobre a 002**: reusa o carrinho client-side, o checkout, o recálculo autoritativo no servidor (`/app` Next + Prisma + Postgres `roilabs_db`), a tabela de faixas de frete e o provedor de pagamento (Mercado Pago) já existentes. Não se cria um segundo carrinho nem um segundo backend.
- **Site permanece estático**: o `site-goiania` continua build estático → nginx; nenhum adapter SSR é adicionado. Mini-cart, simulador, campo de CEP, cupom e recuperação são **client-side**; validações de valor são chamadas ao `/app`.
- **Fonte de preços**: `porcelanatos.json` (preço por m² e m²/caixa) permanece a fonte de verdade para o recálculo no servidor.
- **Cupom como knob da operação**: cupons (código, tipo, valor, validade, mínimo, ativo) são geridos pela operação; o impacto na margem do repasse manual da 002 é decisão de negócio assumida ao criar cada cupom. Um cupom por carrinho.
- **Recuperação por link**: a recuperação é por **link compartilhável** (token) **válido por 30 dias**; recuperação por e-mail/lembrete automático fica fora do escopo desta feature.
- **Prazo de entrega**: o prazo estimado exibido vem da configuração da operação por faixa de frete (knob), não de integração com transportadora.
- **Verificação em ambiente real** (Constituição II): frete, cupom, simulador e recuperação validados em Docker/navegador em produção, com o checkout de teste do Mercado Pago, não em build local.

## Out of Scope

- Recriar o checkout, o pagamento ou o modelo de reserva/fulfillment da 002 (reuso direto).
- Conta de cliente, histórico logado, wishlist, recuperação por e-mail/automação de remarketing.
- Empilhar múltiplos cupons, cupons por cliente/uso único rastreado por identidade, ou programa de fidelidade.
- Cálculo de frete por transportadora ou fora da Grande Goiânia (mantém faixas da 002).
- Estoque em tempo real / integração com ERP do fornecedor.
- Adapter SSR ou qualquer mudança no modelo de deploy estático do `site-goiania`.
