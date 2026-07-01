# Feature Specification: Expandir a malha pSEO de porcelanato (combos validados por volume)

**Feature Branch**: `008-pseo-expandir-combos`

**Created**: 2026-07-01

**Status**: Draft

**Input**: User description: "Escalar o motor de páginas pSEO do site-goiania — expandir a malha (hoje 31 páginas de alta intenção) com mais combinações tipo × característica × ocasião × dimensão × acabamento × intenção local, cada uma validada por volume real de busca. NÃO adicionar a dimensão × bairro (rejeitada na spec 001 D8: bairro×produto ≈ 0 = thin/doorway). Corrigir o llms.txt que promete indevidamente 'bairro'. Público = consumidor comprador de porcelanato em Goiânia."

## Contexto

O motor pSEO já existe e está saudável (`site-goiania`, spec 001): 31 páginas de categoria de alta intenção geradas por dados, 30 SKUs reais, com intro BLUF, FAQ, JSON-LD (Product/FAQPage/BreadcrumbList), silos e conversão via WhatsApp/formulário. Toda página já nasce com `volume > 0` (a validação por volume **já é** um gate de build). Esta feature **não reescreve o motor** — expande o inventário de páginas pelo eixo que comprovadamente tem demanda, mantendo o padrão de qualidade e a honestidade de conteúdo (Constituição III/IV).

Decisão herdada e mantida: **× bairro fica de fora** (spec 001, D8 — cartesiano bairro×produto ~1.600 rejeitado por conteúdo fino / risco de doorway page).

## Clarifications

### Session 2026-07-01

- Q: Piso de volume para um combo virar página? → A: ≥ 200 buscas/mês.
- Q: Regra de parada / tamanho do lote? → A: Construir todos os combos que qualificam pelo piso (nº final = o que o planner retornar; expectativa ~30-50 novos).
- Q: Se o OpenSEO/DataForSEO estiver indisponível ou sem créditos? → A: Bloquear até o OpenSEO voltar — sem fonte de fallback (env/real primeiro, Constituição I/II).

### Session 2026-07-01 (implementação — pivô por dado real)

A mineração real (DataForSEO, chave do `open-seo/.env`) revelou fatos que ajustaram o escopo:

- **Os 30 volumes existentes eram ESTIMATIVAS**, não minerados — inflados ~7-10× vs. o real (ex.: "porcelanato amadeirado" gravado 1900, real Goiás 720, real Goiânia cidade 260). Decisão do usuário: **corrigir os 30 para o real (base Goiás)**. Feito.
- **Base geográfica escolhida: Goiás estado** (melhor proxy do mercado de uma loja de Goiânia; cidade dá volumes minúsculos, nacional engana).
- **≥200/mês em Goiás qualificou 8 combos novos** (não ~30-50): revestimento-cozinha (720), revestimento-banheiro (720), piso-banheiro (590), piso-antiderrapante (390), porcelanato-preco (260), porcelanato-bege (210), piso-cozinha (210), piso-area-externa (210). A meta "30-50" vinha dos números falsos; com dado real e honesto (Const. III), a expansão honesta é ~8.
- **19 das 30 páginas existentes têm volume real < 200** (várias em 10/mês) — grandfathered (o gate mantém > 0), sinalizadas por warning. São candidatas a poda/consolidação futura (com redirects) — registrado no handoff, NÃO executado aqui.
- `loja-porcelanato-goiania` = null no DataForSEO em todos os níveis → volume proxy 10 comentado (não fabricado).
- `volume` é **metadado interno** (não renderiza na página) — corrigir não tem impacto ao usuário, só ganho de integridade.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprador acha a combinação específica que procura (Priority: P1)

Um comprador em Goiânia pesquisa um long-tail de alta intenção que **hoje não tem página dedicada** (ex.: "porcelanato marmorizado para cozinha", "porcelanato 80x80 externo") e cai numa página genérica ou num concorrente. Depois da expansão, existe uma página que responde exatamente àquela busca — com resposta direta (BLUF), produtos reais que casam, guia de como escolher, FAQ e CTA de WhatsApp/orçamento.

**Why this priority**: é a alavanca de crescimento central — cada combo validado novo captura demanda que a malha atual não cobre e a rota de conversão já existe.

**Independent Test**: escolher 5 combos validados ainda não construídos, publicar suas páginas e confirmar que cada uma responde à query exata e encaminha para lead/WhatsApp.

**Acceptance Scenarios**:

1. **Given** uma keyword validada com volume > 0 não coberta por página existente, **When** a malha é expandida, **Then** existe uma página dedicada em slug único com todas as seções do padrão (BLUF, atributos, como escolher, FAQ, CTA, relacionados).
2. **Given** uma página nova, **When** o build roda, **Then** o gate de qualidade (prebuild) passa (slug único, volume > 0, título, atributos e FAQ presentes).
3. **Given** uma página nova sem produto real que case, **When** renderizada, **Then** ela se sustenta em conteúdo informacional — **sem** inventar inventário.

---

### User Story 2 - Cada nova página nasce validada por volume real (Priority: P1)

Cada combo novo vem do keyword planner (OpenSEO / DataForSEO) com volume mensal real; nada é chutado. Combos com volume zero nunca são publicados.

**Why this priority**: honestidade + evita thin/doorway pages (Constituição III/IV; D8). É o que separa "método" de "spam em escala".

**Independent Test**: toda entrada nova carrega seu `volume` e `termoAlvo`; o build quebra se algum for 0.

**Acceptance Scenarios**:

1. **Given** um combo candidato, **When** seu volume no OpenSEO é 0 ou abaixo do piso definido, **Then** ele **não** é publicado.
2. **Given** o conjunto de dados, **When** o prebuild roda, **Then** o gate assere volume > 0 para todas as entradas.

---

### User Story 3 - Índices de IA e busca refletem a malha real (Priority: P2)

O sitemap inclui automaticamente as páginas novas (já faz). O `llms.txt` é corrigido para descrever as dimensões reais (**sem** "× bairro") e representar a malha ampliada — idealmente gerado da fonte, para nunca dessincronizar.

**Why this priority**: canal GEO/AEO + corrige uma afirmação pública imprecisa (a linha atual promete bairro, que a arquitetura corretamente não faz).

**Independent Test**: o sitemap lista todos os slugs novos; o `llms.txt` não menciona bairro e bate com as dimensões construídas.

**Acceptance Scenarios**:

1. **Given** a malha expandida, **When** o `sitemap.xml` é consultado, **Then** todos os slugs novos aparecem.
2. **Given** o `llms.txt`, **When** lido, **Then** ele descreve "tipo × característica × ocasião × intenção local" (não bairro) e reflete a malha.

---

### Edge Cases

- **Combo quase-duplicado** (ex.: "porcelanato 60x60" vs. "porcelanato 60x60 cinza"): mesclar ou diferenciar de verdade para evitar canibalização e páginas-gêmeas finas.
- **Keyword com volume mas sem ângulo honesto de conteúdo** (nada real a dizer): pular, não encher linguiça.
- **Combo novo casa com 0 produtos reais**: a página se sustenta em conteúdo informacional (o template já suporta); **não** inventar produto.
- **OpenSEO indisponível / sem créditos DataForSEO**: expansão bloqueada — documentar e parar (env/real primeiro, Constituição I/II), **sem fonte de fallback** e nunca adivinhar volume.
- **× bairro**: fora de escopo por decisão (D8) — não criar essas páginas mesmo que peçam.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A malha DEVE ser expandida com páginas adicionais de alta intenção de porcelanato pelos eixos validados (tipo × característica × ocasião × dimensão × acabamento × intenção local), reusando o mecanismo de geração de páginas por dados já existente.
- **FR-002**: Toda página nova DEVE originar-se de uma keyword com volume de busca real **≥ 200 buscas/mês**, obtido no keyword planner OpenSEO (dados DataForSEO) como **única fonte** de volume; combos abaixo do piso NÃO DEVEM ser publicados. Se o OpenSEO estiver indisponível, a expansão fica bloqueada (sem fonte de fallback).
- **FR-002a**: TODOS os combos que atinjam o piso DEVEM ser construídos (a regra de parada é o piso, não um teto de quantidade); o número final de páginas é o que o planner retornar qualificado.
- **FR-003**: Cada página nova DEVE carregar todos os campos exigidos pelo gate de qualidade existente (slug único, título, intro BLUF, termo-alvo, volume, atributos, como escolher, FAQ, relacionados) e DEVE passar na verificação de prebuild.
- **FR-004**: Páginas novas NÃO DEVEM introduzir atributos falsos/inventados nem inventário falso por localização; toda alegação de atributo DEVE ser real (conteúdo honesto — sem doorway/thin pages).
- **FR-005**: A dimensão × bairro NÃO DEVE ser introduzida como páginas (mantém a decisão D8 da spec 001).
- **FR-006**: Páginas novas DEVEM exibir produtos reais que casem quando existirem e permanecer válidas (informacionais) quando nenhum produto casar, sem fabricar inventário.
- **FR-007**: Cada página nova DEVE carregar a estrutura GEO/AEO existente (JSON-LD Product/FAQPage/BreadcrumbList quando aplicável, breadcrumb, links de silo) e o design system atual.
- **FR-008**: O sitemap DEVE incluir toda página nova automaticamente (sem passo manual).
- **FR-009**: O `llms.txt` DEVE ser corrigido para descrever as dimensões reais (remover a menção a "bairro") e refletir a malha ampliada; o `llms.txt` DEVERIA ser gerado a partir da fonte das páginas para manter-se em sincronia.
- **FR-010**: Páginas novas DEVEM se interligar ao silo existente (relacionados / categorias) para manter a malha internamente conectada.
- **FR-011**: Combos quase-duplicados DEVEM ser evitados ou explicitamente diferenciados para prevenir canibalização de keyword e páginas-gêmeas finas.

### Key Entities *(include if feature involves data)*

- **Página pSEO (categoria de alta intenção)**: página que responde a uma busca de compra específica. Atributos: slug, tipo, ocasião, atributos técnicos (dimensão/acabamento…), título, intro BLUF, termo-alvo, volume, como escolher, FAQ, relacionados. Relação: casada a produtos reais por tags heurísticas.
- **Keyword validada**: termo-alvo + volume mensal (OpenSEO/DataForSEO). É o portão que decide se uma página pode existir.
- **Produto (SKU real)**: item de inventário real (marca, dimensão, acabamento, preço, imagens). Casado às páginas; nunca fabricado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A malha cresce com todos os combos que atingem o piso de ≥ 200 buscas/mês na base Goiás. **Resultado real (2026-07-01): 8 páginas novas ≥ 200 → 38 categorias no total** (a expectativa inicial de ~30-50 vinha dos volumes estimados, corrigidos nesta entrega).
- **SC-002**: 100% das páginas novas passam no gate de prebuild (slug único, volume > 0, campos obrigatórios) — o build quebra caso contrário.
- **SC-003**: 0 páginas publicadas com volume zero/não validado; 0 páginas usando o eixo bairro; 0 atributos ou inventário fabricados.
- **SC-004**: O `sitemap.xml` lista 100% das páginas novas; o `llms.txt` não referencia mais "bairro" e bate com as dimensões construídas.
- **SC-005**: Toda página nova encaminha o visitante a uma ação de lead (WhatsApp ou formulário), consistente com a rota de conversão existente.
- **SC-006** (indicador de negócio, defasado): em 3-6 meses (a rampa conhecida de indexação), a contagem de páginas indexadas e as impressões crescem proporcionalmente às páginas adicionadas (medido no Search Console — ops).

## Assumptions

- O keyword planner OpenSEO (self-hosted, dados DataForSEO) é a **única** fonte de volume e precisa estar acessível e com créditos; se não estiver, a expansão fica bloqueada até voltar — **sem fonte de fallback** (Constituição I/II — env/real primeiro). *(clarificado 2026-07-01)*
- Piso de volume para publicar um combo novo: **≥ 200 buscas/mês**. *(clarificado 2026-07-01)*
- Regra de parada: construir **todos** os combos que atingem o piso (não há teto de quantidade); expectativa de ~30-50 páginas novas (total ~60-80), mas o número real é o que o planner qualificar. *(clarificado 2026-07-01)*
- Sem fornecedor assinado ainda (Gate 3); páginas novas se sustentam em conteúdo informacional + os 30 SKUs existentes, não em novo inventário real por página. Expansão de inventário real é um passo futuro separado.
- Escopo restrito ao `site-goiania` (goiania.roilabs.com.br); o institucional `roilabs.com.br` (B2B) e novos polos/nichos ficam fora.
- Template existente, componentes, utilitário de JSON-LD, gate de check-matrix e fluxo de lead são reusados como estão; isto é expansão de dados + conteúdo, não reescrita de motor.
