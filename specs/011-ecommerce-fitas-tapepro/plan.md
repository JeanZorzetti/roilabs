# Implementation Plan: E-commerce de fitas adesivas Tapepro (segundo vertical)

**Branch**: `main` (repo faz push direto em main) | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-ecommerce-fitas-tapepro/spec.md`

## Summary

Adicionar **fitas adesivas** como segundo vertical de venda no `goiania.roilabs.com.br`, que hoje vende porcelanato por m². Fita vende por **rolo**, e a decisão travada é **vertical paralelo**: catálogo, tabela de preço-autoridade e item de pedido **próprios**, deixando o caminho de dinheiro de porcelanato literalmente intocado (`ItemPedido` não ganha coluna nenhuma).

Quatro entregas técnicas:

1. **Catálogo + rotas** `/fitas/` e `/fitas/[slug]/`, com os **fatos** da ficha técnica importados do institucional (`Tapepro/src/lib/produtos.ts`), **copy comercial própria** (FR-032) e a **tabela de faixas de preço** visível na página (FR-039). Registro nos 4 índices.
2. **Carrinho de fitas** paralelo (`cart-fitas.ts`, chave `roi_cart_fitas_v1`), o que resolve FR-028 por construção — chaves diferentes coexistem sem sobrescrita.
3. **Frete nacional real** via Melhor Envio (sandbox primeiro), atrás de um endpoint no `/app` que espelha o padrão CORS já existente de `/api/cupom/validar`. Contingência grava **motivo** (`cep_nao_atendido` vs `falha_tecnica`) e dispara alerta por `sendAlert()` — que já existe.
4. **Home reposicionada** para fitas (cadeira ocupada), com a malha de porcelanato intocada nas URLs e nos links internos.

Extras obrigatórios: `Cupom.escopo` com backfill para `porcelanato` (FR-036/037), **wiring do `check-cart-math.mjs`** (existe mas não roda em lugar nenhum) e **ativação da linha 'fitas adesivas' no Centro de Custo** — que hoje só enxerga SKUs de porcelanato.

**Modalidade por SKU** (quarta rodada de clarificação): **comum** e **gomada** compram direto; **personalizada** é só-orçamento, porque o clichê é valor variável ("a partir de R$ 80") e custo único por arte — cobrá-lo por pedido sobrecobraria o cliente recorrente. Isso faz a **US2 carregar o produto de maior margem**, não ser acessória.

## Technical Context

**Language/Version**: TypeScript. Astro 5.6 estático em `/site-goiania`; Next.js 16 (App Router, standalone) em `/app`.

**Primary Dependencies**: Prisma + Postgres (`roilabs_db`), Mercado Pago (já integrado), **Melhor Envio** (novo — cotação de frete). Nenhuma dependência npm nova: a cotação é um `fetch` contra REST, e o Astro do site não ganha pacote.

**Storage**: Postgres. Schema por `prisma db push` **MANUAL** de máquina que alcança o host (Const. — runner standalone não aplica schema). Inclui backfill de `Cupom.escopo` e `Pedido.vertical`.

**Testing**: Funções puras com self-check `node:assert` (padrão do repo): `test/frete-fitas.test.mjs` (contingência e motivo), `test/cupons.test.mjs` (estender com escopo), `site-goiania/src/scripts/check-cart-math.mjs` (estender para rolos **e wire no build** — hoje é órfão). E2E real = pedido pago em produção (Const. II).

**Target Platform**: `/app` Docker Next standalone (EasyPanel, `app.roilabs.com.br`); site estático Astro → nginx (`goiania.roilabs.com.br`).

**Project Type**: Web — monorepo por app.

**Performance Goals**: Cotação de frete com **timeout de 4s** (margem para o SC-010 de 5s ponta a ponta). Demais fluxos sem meta específica.

**Constraints**:
- Caminho de dinheiro: servidor é autoridade única de preço e frete (FR-006/FR-016).
- `ItemPedido`, `precos.ts` e `frete.ts` (porcelanato) **não podem ser alterados** (FR-003/FR-017).
- nginx: barra final obrigatória em toda URL nova e `try_files =404` (FR-021/FR-022).
- Credencial de frete é **server-side apenas** — nunca no bundle do site estático.

**Scale/Scope**: B2B de baixo volume (dezenas de pedidos/mês). Escala não é gargalo; **correção do dinheiro é**.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Variáveis de Ambiente Primeiro** — A feature **introduz uma credencial nova** (`MELHOR_ENVIO_TOKEN`). O modo de falha mais caro da spec (FR-035) é exatamente uma env var errada em produção derrubando 100% das cotações em silêncio. Por isso o alerta não é opcional: é a materialização deste princípio. O quickstart começa conferindo a env var antes de qualquer teste. ✅
- **II. Verificação em Ambiente Real (NÃO-NEGOCIÁVEL)** — Dinheiro isolado em funções puras com self-check; "pronto" só com pedido pago real em produção. O sandbox do Melhor Envio (crédito fictício, Correios + JadLog) permite E2E de cotação sem gastar, e a cotação real é verificada no navegador em produção. Build local não conta. ✅
- **III. Simplicidade Deliberada (YAGNI)** — Sem dependência npm nova; sem camada de abstração de transportadora (**um** módulo, **uma** implementação — trocar provedor = reescrever um arquivo, não implementar uma interface). Reusa `sendAlert()`, o padrão CORS de `/api/cupom/validar` e o estado `a_combinar` que o `Pedido` já suporta. A duplicação entre verticais é o atalho deliberado, com teto registrado. ✅
- **IV. Qualidade de Página Voltada ao Usuário** — Páginas de produto de fita com ficha técnica real, imagem própria do Tapepro e copy comercial própria; proibido card genérico ou página mínima (FR-026). ✅
- **V. Fluxo Spec-Driven e Entrega Fechada** — Este plano + research/data-model/contracts/quickstart; fecha com `handoff.md` + commit/push. ✅

**Resultado: PASS.** Sem violação → sem Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/011-ecommerce-fitas-tapepro/
├── plan.md              # Este arquivo
├── research.md          # Decisões: provedor de frete, tabela nova vs colunas, sync de conteúdo
├── data-model.md        # ItemPedidoFita, Pedido.vertical/freteMotivo, Cupom.escopo
├── quickstart.md        # Roteiro de validação E2E (dinheiro + SEO)
├── contracts/
│   ├── frete-cotar.md          # POST /api/frete/cotar (CORS, novo)
│   ├── checkout-pedido-fitas.md # POST /api/pedidos com vertical=fitas
│   └── cupom-escopo.md         # /api/cupom/validar + admin de cupons
├── checklists/requirements.md
└── tasks.md             # (/speckit-tasks — não criado aqui)
```

### Source Code (repository root)

```text
site-goiania/                            # Astro estático (SEO + carrinho)
├── src/data/
│   ├── fitas.ts                         # NOVO: catálogo de fitas (fatos do institucional + copy própria)
│   ├── produtos.ts                      # INTOCADO (porcelanato)
│   └── porcelanato.ts                   # INTOCADO (malha pSEO)
├── src/lib/
│   ├── cart-fitas.ts                    # NOVO: carrinho por rolo, chave roi_cart_fitas_v1
│   └── cart.ts                          # INTOCADO (chave roi_cart_v1)
├── src/pages/
│   ├── fitas/index.astro                # NOVO: vitrine do vertical
│   ├── fitas/[slug].astro               # NOVO: página de produto (ficha + compra ou orçamento)
│   ├── carrinho-fitas.astro             # NOVO: carrinho + cotação de frete + checkout
│   ├── index.astro                      # ALTERADO: home lidera com fitas (FR-025)
│   ├── sitemap.xml.ts                   # ALTERADO: + rotas de fitas
│   ├── llms.txt.ts                      # ALTERADO: + rotas de fitas
│   ├── busca-index.json.ts              # ALTERADO: + SKUs de fita
│   └── feed.xml.ts                      # ALTERADO: só SKUs com preço público (FR-024)
├── src/components/                      # Footer ALTERADO (4º índice)
├── src/scripts/
│   ├── check-cart-math.mjs              # ALTERADO: + math de rolos · E WIRE no package.json (hoje órfão)
│   └── check-feed.mjs                   # ALTERADO: tolerar SKU só-orçamento por design
└── package.json                         # ALTERADO: prebuild roda check-cart-math

app/                                     # Next 16 + Prisma (dinheiro)
├── prisma/schema.prisma                 # + ItemPedidoFita · Pedido.vertical/freteMotivo · Cupom.escopo
├── scripts/migrate-011-backfill.mjs     # NOVO: Cupom.escopo='porcelanato', Pedido.vertical='porcelanato'
├── src/lib/
│   ├── precos-fitas.ts                  # NOVO: slug → {faixas[], minimoRolos, pesoKg, dims} (autoridade; SÓ comum + gomada)
│   ├── frete-fitas.ts                   # NOVO: cotação Melhor Envio + timeout + motivo da contingência
│   ├── precos.ts · frete.ts             # INTOCADOS (porcelanato)
│   └── cupons.ts                        # ALTERADO: avaliarCupom passa a receber vertical
├── src/app/api/
│   ├── frete/cotar/route.ts             # NOVO: CORS, espelha /api/cupom/validar
│   ├── pedidos/route.ts                 # ALTERADO: ramo vertical=fitas (doc obrigatório, itens em rolos)
│   └── cupom/validar/route.ts           # ALTERADO: recebe vertical
├── src/app/admin/                       # pedidos: coluna vertical + motivo do frete
└── test/
    ├── frete-fitas.test.mjs             # NOVO: contingência, motivo, timeout
    └── cupons.test.mjs                  # ALTERADO: escopo por vertical
```

**Structure Decision**: Monorepo existente, sem app novo. O site estático ganha um vertical paralelo em `data/`, `lib/` e `pages/`; o `/app` ganha a autoridade de preço, a cotação de frete e o ramo de checkout de fitas. **Nenhum arquivo do caminho de dinheiro de porcelanato é editado** — `produtos.ts`, `porcelanato.ts`, `cart.ts`, `precos.ts`, `frete.ts` e o model `ItemPedido` ficam como estão. Os únicos arquivos compartilhados que mudam são os 4 índices de SEO, a home, `cupons.ts` (ganha parâmetro) e `pedidos/route.ts` (ganha ramo) — todos com o caminho de porcelanato preservado por construção.

## Complexity Tracking

> Sem violações de constituição — seção não aplicável.

A duplicação entre verticais (catálogo, carrinho, preço-autoridade, item de pedido) é **decisão de produto registrada na spec**, não desvio arquitetural: troca deliberada de elegância por risco zero na receita existente. Teto: uma **terceira** unidade de venda torna a duplicação insustentável. Caminho de upgrade: generalizar para `{unidade, quantidade, precoUnitario}` — explicitamente rejeitado agora.
