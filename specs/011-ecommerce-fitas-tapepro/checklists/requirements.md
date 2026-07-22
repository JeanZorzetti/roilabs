# Specification Quality Checklist: E-commerce de fitas adesivas Tapepro

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-22
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

**Status: ✅ aprovado — pronto para `/speckit-plan`.**
**Re-validado após `/speckit-clarify` (2026-07-22): 16/16 mantidos. Nenhuma regressão.**

## Notes

### Iteração 1 — linguagem dos requisitos

- Nomes de arquivo/símbolo (`precos.ts`, `frete.ts`, `ItemPedido`, `/fitas/`, `elegivelParaFeed`, nginx, `sitemap.xml.ts`) removidos dos requisitos e reescritos em linguagem de capacidade. As referências concretas ficam confinadas ao **Contexto**, **Dependencies** e **Riscos**, onde servem de rastro de decisão — não como requisito.
- `SC-010` reescrito de "timeout de X ms na chamada" para o resultado observável pelo comprador (5s ou contingência visível).

### Iteração 2 — 3 clarificações resolvidas

Q1 (carrinho misto), Q2 (contingência de frete) e Q3 (dados do catálogo) foram respondidas pelo Jean e codificadas na spec. Nenhum marcador restante.

### Achados da investigação de fontes (Q3)

Verificado no código, não presumido:

| Dado | Estado | Fonte |
|------|--------|-------|
| Ficha técnica dos 3 SKUs | ✅ existe | `Tapepro/src/lib/produtos.ts` |
| Aplicações, benefícios, copy SEO | ✅ existe | idem |
| Imagens de produto | ✅ existe | `Tapepro/src/assets/produtos/` (4 PNG) |
| Fotos reais de clientes | ✅ existe | `Tapepro/imagens/` (com/sem fundo) |
| Mínimos de pedido | ✅ existe | 20 rolos (personalizada), 15 (gomada) |
| **Preço por rolo** | ❌ **não existe** | — bloqueia só a publicação |

O handoff de origem afirmava que o conteúdo de catálogo "não existe ainda". **Está desatualizado**: o conteúdo existe e é rico. Só o preço falta.

### Tensão registrada (não é defeito da spec)

`Tapepro/src/lib/produtos.ts` afirma *"Preço NÃO entra no site — o nicho inteiro vende por orçamento"*, e `Tapepro/CLAUDE.md` confirma que concorrentes e o próprio Tapepro funilam tudo para WhatsApp/orçamento. A decisão de publicar preço **contraria o padrão do nicho de propósito** — é a aposta diferenciadora deste vertical, tomada com a informação à vista. Registrada nas Clarifications da spec para que não seja "descoberta" como surpresa no futuro.

### Iteração 3 — `/speckit-clarify` (5 perguntas)

Re-validação: **16/16 itens mantidos, zero regressões.** A spec cresceu de 30 para 37 requisitos e de 10 para 11 critérios mensuráveis, sem introduzir ambiguidade nova.

**A reversão que importa:** a decisão de identidade ("dois verticais lado a lado, marca neutra") foi **supersedida**. Motivo dado pelo Jean: fitas é **cadeira ocupada** (receita real, success fee 15%/10%) e porcelanato é **moeda de troca** (vitrine para vender a cadeira vaga). A prioridade de SEO segue a receita. A malha de porcelanato continua intocável, mas com justificativa nova — é o argumento comercial de venda da cadeira, não a receita a proteger.

Duas premissas erradas foram corrigidas no processo:

1. **"Fitas ganha SEO tomando a home do porcelanato"** — falso. Os verticais miram universos de palavra-chave disjuntos (local/B2C/obra vs nacional/B2B/embalagem). A briga pela home era soma-zero com prêmio zero. O que dá prioridade real é o namespace próprio e a divisão de intenção entre os domínios.
2. **FR-027 original ("reaproveitar o conteúdo do institucional")** — como estava escrito, produzia canibalização cross-domain: os dois sites publicando a mesma copy para os mesmos 3 SKUs. Reescrito para separar **fatos** (repetem, e devem repetir) de **prosa comercial** (própria de cada domínio).

**Buraco de receita fechado:** a contingência de frete da rodada 2 tratava "CEP não atendido" e "API caiu" como a mesma coisa. Uma credencial errada em produção faria 100% dos pedidos saírem sem frete cobrado, com o sistema aparentando operar conforme o especificado — perda silenciosa. FR-034/FR-035 separam as causas e alertam.

### Riscos que o plano precisa endereçar

1. **Frete** é a única dependência externa no caminho de dinheiro — cotação errada é prejuízo por pedido.
2. **Malha pSEO de porcelanato** (41 páginas + 5 guias) não pode quebrar; o erro recorrente do repo é esquecer um dos 4 índices ao adicionar rotas.
3. **Preço unitário fixo acima do mínimo** é uma suposição (sem faixas por volume). Se o Tapepro exigir faixas, vira feature nova no caminho de dinheiro — confirmar ao receber os preços.
4. **Hostname geográfico vs produto nacional**: `goiania.roilabs.com.br` vendendo fita B2B nacional é sinal contrário, aceito conscientemente. Mitigado por FR-031, não eliminado. Se o SEO nacional não deslanchar, é a primeira hipótese a testar.
5. **Reposicionar a home** troca sinal de SEO em página que já ranqueia. Exige baseline no GSC antes da mudança, senão não há como saber se funcionou (e o Crawl Stats do GSC tem janela de 90 dias — leitura precoce engana).
6. **Backfill do escopo de cupom** é o mesmo padrão que virou landmine na 010: coluna nova sem backfill quebra consulta existente. Aplicar junto do `db push`, antes do push do código.
