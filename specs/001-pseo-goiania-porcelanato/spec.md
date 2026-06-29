# Feature Specification: pSEO Regional — Porcelanato Goiânia

**Feature Branch**: `001-pseo-goiania-porcelanato`

**Created**: 2026-06-29

**Status**: Draft

**Input**: User description: "Começar o pSEO do polo Goiânia, nicho âncora porcelanato — páginas regionais de cauda longa que captam a demanda local real e convertem visitante em lead, na IA decidida (subdomínio por polo, nicho como pasta: goiania.roilabs.com.br/porcelanato/{slug})."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprador local encontra e entende um tipo de porcelanato (Priority: P1)

Uma pessoa em Goiânia pesquisa por um tipo de porcelanato (ex.: "porcelanato acetinado", "porcelanato amadeirado", "porcelanato para área externa") e encontra uma página regional da ROI Labs que responde bem à busca: explica o produto, onde usar, como escolher, mostra os atributos técnicos e tira dúvidas comuns. A pessoa sai mais confiante sobre o que comprar.

**Why this priority**: É a base de tudo — sem páginas que rankeiam e entregam valor real ao comprador local, não há tráfego nem conversão. Captura a demanda local já validada (volumes reais do Keyword Planner).

**Independent Test**: Publicar uma única página de tipo (ex.: acetinado), confirmar que ela responde à intenção de busca, é indexável e útil de forma autônoma — entrega valor mesmo sem o resto da matriz.

**Acceptance Scenarios**:

1. **Given** um comprador buscando "porcelanato acetinado" em Goiânia, **When** ele abre a página correspondente, **Then** vê conteúdo específico do tipo (o que é, ambientes ideais, como escolher, atributos técnicos) e uma seção de dúvidas frequentes.
2. **Given** um robô de busca rastreando a página, **When** ele lê o HTML, **Then** o conteúdo principal e a marcação estruturada estão presentes sem depender de script no cliente.
3. **Given** uma busca sem demanda local medida (volume zero), **When** o catálogo de páginas é gerado, **Then** nenhuma página é criada para esse termo (sem páginas finas/vazias).

---

### User Story 2 - Visitante vira lead (Priority: P2)

Depois de ler a página, o visitante manifesta intenção de compra (pede orçamento / quer falar sobre o produto) e esse contato chega à ROI Labs — que, enquanto não há fornecedor fechado, filtra e encaminha manualmente.

**Why this priority**: Converte o tráfego em pipeline. Sem isso, o pSEO gera audiência mas não valor comercial. Vem depois de P1 porque exige que a página/tráfego exista primeiro.

**Independent Test**: A partir de uma página publicada, acionar o CTA de intenção de compra e confirmar que um lead com o contexto do produto é recebido pela ROI Labs.

**Acceptance Scenarios**:

1. **Given** um visitante numa página de produto, **When** ele aciona o CTA de orçamento/contato, **Then** um lead com o contexto da página (produto/ocasião) é entregue à ROI Labs.
2. **Given** que ainda não há fornecedor nem catálogo, **When** o visitante converte, **Then** o destino do lead é a ROI Labs (não um fornecedor inexistente).

---

### User Story 3 - Operação escala a matriz sem retrabalho (Priority: P3)

A ROI Labs (operação) adiciona uma nova página (novo tipo, ocasião ou, futuramente, novo nicho) e ela aparece no silo já consistente, otimizada, com links internos e entrada no sitemap — sem autoria manual página a página.

**Why this priority**: É o que torna o pSEO barato de escalar conforme volumes/catálogo crescem. Importante, mas o valor só se realiza depois que P1/P2 provam o formato.

**Independent Test**: Adicionar uma única entrada na fonte de dados e confirmar que surge uma nova página publicada, com links internos do silo e listada no sitemap, sem criar arquivo de página sob medida.

**Acceptance Scenarios**:

1. **Given** a fonte de dados curada, **When** a operação adiciona uma entrada de página, **Then** a página é gerada com a mesma estrutura, links internos e sitemap atualizado.
2. **Given** um novo nicho no mesmo polo (ex.: construção), **When** ele é adicionado, **Then** estende a mesma propriedade regional (consolidando autoridade), não cria um site separado.

---

### Edge Cases

- **Sem catálogo real ainda:** páginas de produto não exibem produtos, preços ou estoque fabricados — permanecem informacionais até o catálogo do fornecedor existir.
- **Fornecedor fecha no futuro:** as mesmas URLs ganham listagem de produto sem quebrar links nem exigir redirecionamento.
- **Visitante sem JavaScript / robô:** o conteúdo principal e o CTA continuam acessíveis (página estática).
- **Páginas quase-duplicadas entre tipos:** cada página tem conteúdo distinto e específico do seu tipo/ocasião — nunca boilerplate repetido (evita conteúdo fino / doorway).
- **Termo com intenção mas volume individual baixo (long-tail):** entra apenas se for combinação de alta intenção curada, não por produto cartesiano cego.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST publicar páginas regionais para o polo Goiânia, cada uma mirando uma busca local real com demanda medida (volume > 0).
- **FR-002**: As páginas MUST ser organizadas em silo por nicho dentro da mesma propriedade regional do polo; cada novo nicho MUST estender essa propriedade (consolidando sua autoridade de busca), não criar uma propriedade separada.
- **FR-003**: Cada página MUST apresentar conteúdo de guia de compra genuinamente útil e específico do tipo (o que é, ambientes/ocasiões ideais, como escolher) — nunca conteúdo fino ou repetido.
- **FR-004**: Cada página MUST expor os atributos técnicos estruturados apropriados ao tipo de produto (para porcelanato: dimensão, PEI, acabamento, antiderrapante, m²/caixa, ambiente).
- **FR-005**: Cada página MUST incluir uma seção de dúvidas frequentes respondendo perguntas comuns do comprador local (sustenta citação por motores de resposta / IA).
- **FR-006**: Cada página MUST oferecer um CTA claro pelo qual o visitante manifesta intenção de compra, e o lead resultante MUST chegar à ROI Labs.
- **FR-007**: As páginas MUST ser descobríveis por buscadores: cada uma indexável, interligada dentro do seu silo e listada em um sitemap.
- **FR-008**: O conjunto de páginas MUST ser gerado a partir de uma única fonte de dados curada, de modo que adicionar/remover uma página seja uma mudança de dados, não autoria sob medida.
- **FR-009**: Enquanto não houver catálogo de fornecedor, as páginas MUST permanecer informacionais (sem produtos, preços ou estoque fabricados) e MUST poder ganhar listagem real de produto depois nas mesmas URLs, sem quebrar links.
- **FR-010**: O conteúdo da página MUST estar presente sem scripting no cliente (HTML estático), para que buscadores e visitantes sem JS recebam o conteúdo completo.
- **FR-011**: A primeira entrega MUST cobrir aproximadamente 25-40 páginas curadas de porcelanato, abrangendo tipos de produto, ambientes/ocasiões e buscas de intenção local, ancoradas na demanda validada.
- **FR-012**: Uma página-hub regional MUST listar o(s) nicho(s) disponível(is) do polo (hoje, porcelanato) como ponto de entrada.

### Key Entities *(include if feature involves data)*

- **Página pSEO**: uma landing regional para um alvo de busca. Atributos: termo-alvo, tipo/ocasião, título, blocos de conteúdo, atributos técnicos, dúvidas frequentes, CTA. Pertence a um silo de nicho.
- **Lead de consumidor**: um contato de intenção de compra vindo de um visitante. Atributos: contexto da página/produto, dado de contato, momento. Destino: ROI Labs.
- **Entrada de catálogo (futuro)**: listagem de produto que mais tarde se acopla a uma página; fora do escopo de conteúdo da v1, mas referenciada por FR-009.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pelo menos 25 páginas de porcelanato publicadas e submetidas para indexação na primeira entrega.
- **SC-002**: Em até 90 dias, ≥70% das páginas publicadas estão indexadas pelos buscadores (a métrica é página indexada, não criada).
- **SC-003**: 0 páginas miram termos de volume zero — toda página publicada tem demanda local validada (volume > 0).
- **SC-004**: Um visitante consegue, a partir da página, enviar um contato de intenção de compra em menos de 1 minuto, e o lead é recebido pela ROI Labs.
- **SC-005**: Adicionar uma nova página exige apenas uma entrada na fonte de dados (sem novo arquivo de página sob medida) — verificável adicionando uma e vendo-a publicada com sitemap e links internos.
- **SC-006**: O tráfego orgânico da propriedade do polo mostra tendência de alta por 3 meses consecutivos (alinhado ao gatilho de "saída do deserto" do GTM).

## Assumptions

- Nenhum fornecedor (Gate 3) está fechado ainda: os leads vão para a ROI Labs e as páginas nascem informacionais; as mesmas URLs ganham catálogo depois.
- Polo e nicho âncora estão fixos: Goiânia + porcelanato (decisões de `mercado`/`gtm` no vault).
- A demanda parte do snapshot do Keyword Planner já validado (tipos/ocasiões de porcelanato); o refinamento de volume por página vem depois, quando a ferramenta for re-rodada.
- A demanda é de nível cidade/tipo-de-produto; páginas de nível bairro estão fora do escopo da v1 (volume validado ~zero).
- O mecanismo de conversão (ex.: mensagem direta vs. formulário) é detalhe de implementação resolvido no planejamento; o requisito é apenas que o lead chegue à ROI Labs.
- A hospedagem/deploy da propriedade regional é passo de operação, executado fora do código desta feature.
