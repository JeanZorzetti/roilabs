# Feature Specification: Feed de Produtos para Google Merchant Center (Free Listings)

**Feature Branch**: `009-merchant-center-feed`

**Created**: 2026-07-02

**Status**: Draft

**Input**: User description: "Feed de produtos para Google Merchant Center (free listings) no site-goiania: rota que gera o feed no formato Google Merchant a partir do catálogo de porcelanatos, com os campos obrigatórios do Google, apontando para as páginas de produto que já têm Product schema. Objetivo: cadastrar o catálogo inteiro nas free listings da aba Shopping do Google sem custo. Inclui validação do feed e documentação do passo ops (cadastro no Merchant Center + verificação do domínio)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catálogo inteiro elegível nas free listings (Priority: P1)

O Google Merchant Center consegue buscar, em uma URL pública e estável do site de Goiânia, um feed com todos os produtos do catálogo de porcelanato — cada um com identificação, título, descrição, link para a página real do produto, imagem, preço em reais, disponibilidade e condição — de forma que o catálogo inteiro fique elegível para aparecer gratuitamente na aba Shopping do Google.

**Why this priority**: É o núcleo da feature — sem o feed válido não existe listagem. Canal de distribuição de custo zero para o nicho âncora (porcelanato em Goiânia), que concorrentes locais não usam.

**Independent Test**: Acessar a URL do feed em produção, validar contra a especificação de produtos do Google (todos os campos obrigatórios presentes) e conferir que a contagem de itens bate com o catálogo.

**Acceptance Scenarios**:

1. **Given** o catálogo atual com 30 produtos, **When** o feed é requisitado, **Then** a resposta contém exatamente 1 item por produto do catálogo, todos com os campos obrigatórios preenchidos (id, título, descrição, link, imagem, preço em BRL, disponibilidade, condição, marca).
2. **Given** um item qualquer do feed, **When** o link do item é aberto, **Then** ele leva à página de produto correspondente e o título, a imagem e o preço exibidos na página são os mesmos do feed (paridade exigida pela política do Google).
3. **Given** um produto novo adicionado ao catálogo e publicado, **When** o feed é requisitado novamente, **Then** o novo produto aparece no feed sem nenhum passo manual extra (fonte única: o catálogo).

---

### User Story 2 - Feed validado antes de ir ao ar (Priority: P2)

Quem mantém o site tem uma verificação automática que quebra a publicação se o feed sair malformado (estrutura inválida, campo obrigatório vazio, preço zerado ou link quebrado), em vez de descobrir dias depois pela reprovação silenciosa no Merchant Center.

**Why this priority**: Reprovação no Merchant Center é lenta de diagnosticar (revisão pode levar dias) e derruba o catálogo inteiro; pegar erro estrutural antes do deploy custa quase nada.

**Independent Test**: Introduzir localmente um produto com preço ausente e confirmar que a verificação acusa o problema; com o catálogo íntegro, a verificação passa.

**Acceptance Scenarios**:

1. **Given** o catálogo íntegro, **When** o site é construído/verificado, **Then** a validação do feed passa (estrutura bem-formada + campos obrigatórios presentes em todos os itens).
2. **Given** um produto sem preço ou sem imagem no catálogo, **When** a verificação roda, **Then** ela falha apontando o produto e o campo problemático.

---

### User Story 3 - Passo ops documentado: cadastro no Merchant Center (Priority: P3)

O operador (Jean) tem um passo a passo curto e específico do projeto para: criar a conta no Merchant Center, verificar/reivindicar o domínio de Goiânia, cadastrar a URL do feed com busca agendada e habilitar as free listings — além de saber onde acompanhar aprovação/reprovação dos itens.

**Why this priority**: O feed sozinho não lista nada; o cadastro é etapa externa obrigatória. Documentar evita redescobrir o fluxo e registra as decisões (ex.: como o domínio foi verificado).

**Independent Test**: Seguir o documento do zero e chegar a "feed cadastrado e processado sem erro estrutural" no painel do Merchant Center.

**Acceptance Scenarios**:

1. **Given** o feed no ar em produção, **When** o operador segue a documentação, **Then** consegue cadastrar o feed no Merchant Center e o painel reporta os itens processados.

---

### Edge Cases

- Produto sem imagem, sem preço ou com preço 0 no catálogo: o item é omitido do feed (item incompleto reprova individualmente e pode gerar advertência na conta) e a validação acusa em build para correção na fonte.
- Produto sem código de barras (GTIN): o catálogo não tem GTIN; cada item declara explicitamente que não possui identificador universal (mecanismo previsto pelo Google) usando marca como identificação.
- Preço por metro quadrado: o preço exibido na página é R$/m²; o feed declara a mesma base de medida para que o Google mostre o preço unitário corretamente e não reprove por divergência.
- Caracteres especiais em títulos/descrições (acentos, "²", aspas): o feed deve escapá-los corretamente sem mojibake.
- Catálogo vazio ou arquivo de catálogo ausente: a publicação falha na validação (feed vazio cadastrado zeraria a listagem silenciosamente).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST expor um feed de produtos em URL pública e estável do site de Goiânia, no formato aceito pelo Google Merchant Center.
- **FR-002**: O feed MUST conter 1 item por produto publicado no catálogo, gerado a partir da mesma fonte de dados que alimenta as páginas de produto (fonte única; sem lista paralela para manter).
- **FR-003**: Cada item MUST incluir os atributos obrigatórios do Google: identificador único e estável, título, descrição, link da página do produto, link de imagem, preço com moeda BRL, disponibilidade, condição (novo) e marca.
- **FR-004**: Cada item MUST declarar ausência de identificador universal (GTIN/MPN inexistentes no catálogo) pelo mecanismo previsto pelo Google, para não reprovar por identificador ausente.
- **FR-005**: Título, imagem e preço de cada item MUST ser idênticos aos exibidos na página de produto correspondente (política de paridade do Google), incluindo a base de medida do preço (R$/m²).
- **FR-006**: Produto com campo obrigatório ausente ou inválido (sem imagem, sem preço, preço ≤ 0) MUST ser excluído do feed, e a verificação automática MUST acusar o produto e o campo.
- **FR-007**: O feed MUST ser validado automaticamente na publicação: estrutura bem-formada, campos obrigatórios presentes em todos os itens e contagem > 0; falha na validação MUST impedir a publicação.
- **FR-008**: Texto dos itens MUST preservar acentuação e símbolos (ex.: "²") sem corrupção de encoding.
- **FR-009**: A entrega MUST incluir documentação ops co-localizada cobrindo: criação da conta Merchant Center, verificação/reivindicação do domínio, cadastro da URL do feed com busca agendada, habilitação das free listings e onde monitorar aprovação/reprovação de itens.

### Key Entities

- **Produto do catálogo**: item de porcelanato publicado no site de Goiânia; atributos relevantes: identificador (slug), marca, nome derivado, dimensão, acabamento, preço por m², imagem(ns), página própria no site.
- **Item do feed**: projeção de um Produto no vocabulário do Google Merchant (id, title, description, link, image_link, price, availability, condition, brand, declaração de identificador); existe apenas como saída derivada — nunca editado à mão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos produtos publicados no catálogo aparecem no feed com todos os campos obrigatórios (hoje: 30/30).
- **SC-002**: O Merchant Center processa o feed cadastrado sem nenhum erro estrutural (advertências informativas são aceitáveis).
- **SC-003**: ≥ 90% dos itens do feed aprovados para free listings no painel do Merchant Center após a primeira revisão do Google (reprovações pontuais de política são tratáveis caso a caso).
- **SC-004**: Um produto novo adicionado ao catálogo entra no feed no deploy seguinte sem edição manual do feed (zero manutenção paralela).
- **SC-005**: Erro estrutural no feed é detectado na publicação (antes de chegar ao Google), não pelo painel do Merchant Center dias depois.

## Assumptions

- O catálogo atual (30 produtos, todos com marca, preço/m² e ao menos 1 imagem) permanece a fonte única de produtos; não há inventário/estoque em tempo real — todos os itens são anunciados como disponíveis, coerente com a página que os anuncia.
- Preço no feed segue a base da página (R$/m²) com declaração de medida unitária; se o Google reprovar essa base na revisão, a alternativa (preço por caixa derivado de m²/caixa) vira ajuste posterior — fora do escopo inicial.
- Frete não é declarado no feed nesta fase (venda é consultiva/local, fechada via orçamento; free listings aceitam feed sem frete, podendo gerar advertência não-bloqueante). Reavaliar se o painel exigir.
- A conta Google usada para o Merchant Center e a verificação do domínio são do operador (Jean); o cadastro em si é passo manual documentado, não automatizável nesta fase.
- Escopo limitado ao site de Goiânia (nicho âncora); replicar para futuros polos é trivial pela mesma abordagem, mas fora do escopo.
