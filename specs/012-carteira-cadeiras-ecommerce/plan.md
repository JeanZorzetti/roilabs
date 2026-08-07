# Implementation Plan: A carteira inteira como cadeiras vendáveis

**Branch**: `012-carteira-cadeiras-ecommerce` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/012-carteira-cadeiras-ecommerce/spec.md` (3 rodadas de clarification, zero
`NEEDS CLARIFICATION` bloqueante)

## Summary

Transformar as cadeiras ocupadas em produto comprável e ligar a apuração de receita da carteira,
que hoje é **R$ 0,00 provado**. Fase 1 = 8 cadeiras vendáveis, medidas hoje.

**A abordagem técnica cabe em três frases:** cadeira SaaS vende no gateway do parceiro e reporta
por **webhook** (**2 adaptadores cobrem as 7 cadeiras** — Mercado Pago 4, Stripe 3); o negócio
nasce **sem `Pedido` interno**, o que exige tornar `NegocioOriginado.pedidoId` anulável; e o
caminho de dinheiro que fatura hoje — porcelanato, fitas e `/api/pagamentos/webhook` — **não é
tocado**.

**O que este plano deliberadamente NÃO faz:** generalizar `ItemPedido`. A decisão de pagamento
por tipo de cadeira desarmou o gatilho da spec 011 (`research.md` §3, `spec.md` Contexto).

## Technical Context

**Language/Version**: TypeScript, Next.js 16 App Router (`/app`), Node 22 · Astro estático
(`/site`, `/site-goiania`)

**Primary Dependencies**: Prisma (Postgres), `mercadopago`, `stripe`. **Kiwify não tem SDK** —
webhook HTTP cru.

**Storage**: Postgres existente. **`prisma db push` é MANUAL**, de uma máquina que alcança o host
(Constituição). `migrate diff --script` como preview seguro (lição da 010).

**Testing**: teste de contrato do webhook (7 casos em `contracts/webhook-carteira.md`) +
verificação em ambiente real. **Build local não vale** (Constituição II: OneDrive corrompe
`node_modules`).

**Target Platform**: Docker/EasyPanel. Deploy Astro → nginx; Next standalone.

**Project Type**: web (Astro público + Next app/API + Postgres)

**Constraints**: caminho de dinheiro — idempotência no **banco**, assinatura antes de estado,
status lido do gateway. LLM único = `claude-cli`, sem API paga.

**Scale/Scope**: **7 cadeiras** na fase 1 (de 35), **2 adaptadores** de gateway, 2 tabelas novas,
1 coluna anulada em tabela existente, 1 corte de domínio. *(Fase 0 cortou o adaptador Kiwify e a
cadeira `orcaobra`.)*

## Constitution Check

*GATE: passar antes da Fase 0. Rechecar após a Fase 1.*

| Princípio | Situação | Evidência |
|---|---|---|
| **I. Env vars primeiro** | ✅ e **reforçado** | `segredoRef` guarda o NOME da env, nunca o valor. Segredo derivado do painel é o modo de falha nº 1 e o 401 é o único sinal. |
| **II. Verificação em ambiente real** | ✅ | Nenhum critério fecha em build local. `SC-001` exige venda real com cartão real em produção. |
| **III. Simplicidade deliberada (YAGNI)** | ✅ **por remoção** | A generalização do `ItemPedido` foi **retirada** do escopo com gatilho registrado. `Pedido` sintético rejeitado. Reusa o padrão do webhook existente em vez de framework de webhooks. |
| **IV. Qualidade de página** | ✅ | FR-014 tem piso objetivo (≥800 palavras no HTML inicial, preço explícito, ≥6 FAQ) em vez de "parece bom". |
| **V. Spec-driven e entrega fechada** | ✅ | 3 rodadas de clarification antes deste plano; `handoff.md` co-localizado. |

**Sem violações.** `Complexity Tracking` fica vazio de propósito — o plano encolheu em relação à
primeira leitura da spec, não cresceu.

## Project Structure

### Documentation (this feature)

```text
specs/012-carteira-cadeiras-ecommerce/
├── spec.md
├── plan.md               # este arquivo
├── research.md           # os 3 gateways medidos, o reuso e o bloqueio de schema
├── data-model.md         # delta de schema
├── contracts/
│   └── webhook-carteira.md
├── handoff.md
└── tasks.md              # saída do próximo passo (`tasks`) — NÃO criado aqui
```

### Source Code (repository root)

```text
app/                                    # Next 16 — API e admin
├── prisma/schema.prisma                # ALTERA: NegocioOriginado, Cadeira
│                                       # ADICIONA: VendaParceiro, CredencialGateway
├── scripts/migrate-012-backfill.mjs    # NOVO — origem='pedido' explícito
└── src/
    ├── lib/
    │   ├── seats.ts                    # ALTERA — estado/daCasa/exibirDaCasa no SEED
    │   ├── carteira/
    │   │   ├── adaptadores/            # NOVO — mercadopago.ts | stripe.ts | kiwify.ts
    │   │   └── registrar-venda.ts      # NOVO — passos 4-6 do contrato, um lugar só
    │   └── mercadopago.ts              # REUSA verifyWebhookSignature (multi-conta)
    └── app/api/
        ├── pagamentos/webhook/         # ⛔ NÃO TOCAR — fatura hoje (FR-005a)
        ├── cadeiras/                   # ALTERA — expõe estado/exibição
        └── carteira/webhook/[gateway]/[parceiroId]/   # NOVO

site/                                   # institucional B2B (Astro) — US5
└── src/pages/index.astro                # ALTERA — fallback sem JS do mapa de cadeiras

site-goiania/                            # e-commerce (Astro) — US2/US3/US4
└── src/pages/                           # ADICIONA página por cadeira; porcelanato vira pasta
```

**Structure Decision**: monorepo por app já existente, sem app novo. Os adaptadores moram em
`app/src/lib/carteira/` porque **a lógica é uma só** — os três gateways diferem em assinatura,
consulta e formato, e convergem no mesmo `registrar-venda.ts`. Três rotas finas, um núcleo.

## Fases

### Fase 0 — ✅ CONCLUÍDA em 2026-08-07 *(sem código)*

Resolvida antes da primeira linha, e **cortou um adaptador inteiro**:

- **`sirius` = Stripe** (confirmado). O `mercadopago` no `package.json` dele é dependência escrita
  e não usada — inventário de código dá palpite, não veredito.
- **`orcaobra` SAI da fase 1.** O bloqueio não é fiação, é produto: *"acho ele um produto ruim do
  jeito que está"*. Cadeira vai para `em-preparacao`; ligar checkout ali produziria uma página de
  compra para algo que não deveria estar à venda.

**Escopo final da fase 1: 7 cadeiras, 2 adaptadores.**

| adaptador | cadeiras |
|---|---|
| **Mercado Pago** | `atma` (já ligado), `polarisia`, `estetiacrm`, `vertice` |
| **Stripe** | `sirius`, `context`, `orion` |
| ~~Kiwify~~ | **zero — não construir** (Constituição III: sem cadeira, é scaffolding "para depois") |

### Fase 1 — Schema e o núcleo de registro *(P1 — US1)*

`data-model.md` na ordem lá descrita. O risco concreto **não** é criar tabela nova: é
**`pedidoId` virar anulável** e toda consulta existente por `pedidoId` passar a ignorar em
silêncio os negócios de webhook. **Varrer todas as leituras de `NegocioOriginado` é tarefa, não
observação** — esta casa já pisou nessa landmine duas vezes (`freteMotivo`, 010).

Fecha com os 7 testes de contrato, incluindo os **dois retries simultâneos** (é a `@@unique` que
segura, não o `if`).

### Fase 2 — Um adaptador, uma cadeira, ponta a ponta *(P1 — US1+US2)*

**Uma** cadeira, do gateway mais representativo (Mercado Pago cobre 5). Venda real com cartão
real em produção → `VendaParceiro` → `NegocioOriginado` → fee apurado. **É `SC-001`**: a receita
provada da carteira sai de R$ 0,00 aqui, ou não sai.

Só depois disso os outros adaptadores — replicar antes de provar um é multiplicar defeito.

### Fase 3 — A página da cadeira *(P1 — US3)*

Página por cadeira com o piso de FR-014. **Conteúdo antes de quantidade**: a medição da Atma
mostra que 86% do tráfego veio de uma página respondendo uma pergunta de preço inteira, e que
esforço por artigo não prediz nada. Publicar 8 páginas finas é o resultado a evitar.

Cadeira sem gateway ligado **não** oferece checkout (FR-008); cadeira não-vendável **não** gera
URL indexável (FR-009).

### Fase 4 — Cadeira da casa e institucional *(P2 — US5)*

`daCasa` / `exibirDaCasa` como **dado** (`sirius`, `meridian`, `orion` visíveis como da casa).
Portão objetivo: **nenhum agregado de faturamento soma cadeira da casa** (FR-010).

### Fase 5 — Corte de domínio *(P2 — US4)* ⚠️ a de maior risco

`goiania.roilabs.com.br` → `loja.roilabs.com.br` (label a confirmar). **Por último de propósito**:
é a única fase que pode destruir ativo existente (41 páginas pSEO + 5 guias com histórico no GSC).

Ordem obrigatória: cert e handshake **verificados sem `curl -k`** → 301 de toda URL indexada →
sitemap submetido e **corpo validado** (`<?xml`, não o status 200) → conferir 30 dias depois.

### Fase 6 — As 27 sem produto *(P3 — US6)*

Só o estado no modelo. **Nenhuma página pública.** Transformá-las em vendáveis é trabalho de
produto, um a um, fora desta feature.

## Riscos

| risco | probabilidade | mitigação |
|---|---|---|
| `pedidoId` anulável quebra leitura existente em silêncio | **alta** | varredura como tarefa da Fase 1 + teste da invariante de origem |
| Segredo do webhook deriva do painel → venda para de ser gravada calada | **alta** | `log.warn` no 401 tem de chegar a alguém; é o único sinal |
| Corte de domínio derruba a malha indexada | média | Fase 5 por último, 301 completo, validar corpo do sitemap |
| Parceiro sub-reporta venda | **estrutural, não mitigável aqui** | SC-001a: publicar sempre como "vendas reportadas por webhook" |
| `sirius`/`orcaobra` não emitem webhook utilizável | média | Fase 0 antes de construir o adaptador |
| Fase 3 vira 8 páginas finas | média | piso objetivo de FR-014, medido com contador que não seja o `sed` guloso |

## Próximo passo

`tasks` — o plano está fechado e sem `NEEDS CLARIFICATION` bloqueante. **Fase 0 primeiro**: ela
pode eliminar um adaptador inteiro antes de qualquer linha de código.
