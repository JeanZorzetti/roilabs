# Implementation Plan: E-commerce de porcelanato sobre o pSEO existente

**Branch**: `002-ecommerce-porcelanato` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-ecommerce-porcelanato/spec.md`

## Summary

Adicionar uma camada transacional de e-commerce (carrinho → checkout → pagamento Pix/cartão) ao `site-goiania` **sem tocar nas páginas de pSEO**. O site permanece **build estático → nginx** (Abordagem A): o carrinho é uma ilha client-side com `localStorage`; o checkout é um **POST de formulário urlencoded cross-origin (303)** para o `/app` existente — mesmo padrão do lead atual, sem preflight CORS. O `/app` (Next 16 + Prisma) cria a preferência no **Mercado Pago**, persiste o `Pedido`, recebe o **webhook** idempotente de confirmação e expõe uma listagem operacional para o repasse manual. Sem split, sem estoque em tempo real (pedido pago = reserva), sem adapter SSR, sem dependência nova no front.

## Technical Context

**Language/Version**: TypeScript. Astro 5 (`site-goiania`, output estático) + Next 16 App Router (`/app`). Node 20 no build.

**Primary Dependencies**: Astro 5 (já em `site-goiania`), Prisma + `@/lib/prisma` (já em `/app`), SDK/HTTP do **Mercado Pago** no `/app` (única dependência nova, server-side). Carrinho = JS vanilla + `localStorage` (sem lib de estado, sem framework no front).

**Storage**: Postgres `roilabs_db @ 2.24.207.200:5443` (existente). Novas tabelas `pedidos` (`Pedido`) e `itens_pedido` (`ItemPedido`), aplicadas por `prisma db push` **MANUAL** de máquina que alcança o host (Constituição: NÃO confiar no runner standalone). Tabelas existentes (`leads_consumidor`, `candidaturas`, `cadeiras`) intactas.

**Testing**: Verificação em ambiente real (Constituição II) — Docker/EasyPanel + navegador em prod, com pagamento via **credenciais de teste do Mercado Pago**. Mais self-checks runnable (ponytail): (a) `m² → caixas` (arredonda p/ cima, +10%, mín. 1) e (b) recálculo de total no servidor == soma dos subtotais — `node` + `assert`, sem framework.

**Target Platform**: site estático → nginx em `goiania.roilabs.com.br`; rotas Next standalone em `app.roilabs.com.br`.

**Project Type**: Web — frontend estático (`site-goiania`) estendido + backend existente (`/app`) estendido.

**Performance Goals**: páginas de pSEO seguem HTML pré-renderizado (FR-015). Carrinho/checkout client-side sem bloquear render. Sem metas de throughput.

**Constraints**: OneDrive corrompe `node_modules` → build/verificação só confiável em Docker/navegador (Constituição II). Checkout cross-origin = **requisição simples urlencoded** (sem preflight), igual `leads-consumidor`. **Nunca confiar em preço/total vindos do cliente** (FR-005): recálculo a partir de uma cópia de `porcelanatos.json` no `/app`. Credenciais MP via env (Constituição I). PT-BR no conteúdo; código/commits em inglês.

**Scale/Scope**: 1 polo (Goiânia), volume inicial baixo; idempotência protege o webhook. Tabela de frete cobre a Grande Goiânia (knob).

## Constitution Check

*GATE: passar antes da Fase 0; re-checar após a Fase 1.*

| Princípio | Avaliação |
|---|---|
| **I. Env-first** | OK. `DATABASE_URL` + `MERCADOPAGO_ACCESS_TOKEN`/`_WEBHOOK_SECRET` via env; zero hard-code. Debug de pagamento começa pelos `.env` da EasyPanel + painel MP. |
| **II. Verificação real (NÃO-NEGOCIÁVEL)** | OK. Nada declarado "funcionando" via build local; verificação = Docker + navegador em prod + **fluxo de pagamento de teste MP** ponta-a-ponta (ver `quickstart.md`). |
| **III. Simplicidade (YAGNI)** | OK. Reusa `/app` e o padrão `LeadConsumidor` (sem 2º backend); site continua estático (sem adapter SSR); carrinho = `localStorage`+JS vanilla (sem lib de estado); frete = tabela estática (sem API); checkout guest (sem auth/contas); webhook idempotente mínimo. Adições (2 models, 2 rotas, 1 admin, ilha de carrinho) são **exigidas pela feature**, não especulativas. |
| **IV. Qualidade voltada ao usuário** | OK. `/carrinho` e checkout reusam o design system premium do site; pSEO intacto. |
| **V. Spec-driven + entrega fechada** | OK. No fluxo Spec Kit; `handoff.md` + commit/push ao fechar a implementação. |

**Resultado: PASS.** Sem violações → sem Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-ecommerce-porcelanato/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 (decisões técnicas)
├── data-model.md        # Fase 1 (Pedido + ItemPedido)
├── quickstart.md        # Fase 1 (como rodar/verificar em ambiente real)
├── contracts/           # Fase 1
│   ├── pedidos.md           # POST /api/pedidos (checkout) + GET admin
│   └── pagamentos-webhook.md # POST /api/pagamentos/webhook (MP)
└── tasks.md             # Fase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
site-goiania/                       # EXISTENTE (Astro estático) — estendido, pSEO intacto
└── src/
    ├── lib/
    │   └── cart.ts                  # NOVO: estado do carrinho (localStorage), add/remove, m²→caixas, totais
    ├── components/
    │   ├── ProdutoDetalhe.astro     # + botão "Adicionar ao carrinho" (input m²), ao lado do WhatsApp
    │   ├── AddToCart.astro          # NOVO: ilha client-side (input m² → caixas → add)
    │   ├── CartCount.astro          # NOVO: mini-contador no Header
    │   └── Header.astro             # + link/contador do carrinho
    ├── pages/
    │   ├── carrinho.astro           # NOVO: shell estático + ilha (lista itens, edita caixas, CEP/dados, submit → /app)
    │   └── obrigado.astro           # EXISTENTE: reusada como retorno do MP (mostra status do pedido)
    └── scripts/
        └── check-cart-math.mjs      # NOVO self-check: m²→caixas e soma de subtotais

app/                                 # EXISTENTE (Next 16) — estendido
├── prisma/schema.prisma             # + model Pedido @@map("pedidos") + ItemPedido @@map("itens_pedido")
├── src/lib/
│   ├── precos.ts                    # NOVO: cópia/espelho de porcelanatos.json = fonte de verdade do recálculo
│   ├── frete.ts                     # NOVO: tabela CEP→região→valor + "a combinar" (knob)
│   └── mercadopago.ts               # NOVO: criar preferência + verificar webhook + refund
└── src/app/
    ├── api/pedidos/route.ts         # NOVO: POST público (urlencoded, 303 → init_point MP) + GET admin
    ├── api/pagamentos/webhook/route.ts # NOVO: POST do MP (valida assinatura, idempotente, → pago)
    └── admin/pedidos/page.tsx       # NOVO: listagem p/ repasse + ações confirmar/reembolsar (espelha /admin/leads)
```

**Structure Decision**: mesma topologia da 001 — `site-goiania` (frontend estático) + `/app` (backend) estendidos, sem novo app. O `site-goiania` **não ganha runtime** (Dockerfile/nginx inalterados); todo código server vive no `/app`, reusando Prisma/Postgres e o padrão de rota pública cross-origin já validado pelo lead. A fonte de preço é **espelhada** no `/app` (`src/lib/precos.ts`) para satisfazer FR-005 sem o servidor depender do build do site. `// ponytail: cópia de porcelanatos.json; sincronizar por script no build se a divergência incomodar.`

## Phases

- **Fase 0 — Pesquisa/decisões** (`research.md`): integração MP (Checkout Pro: preferência → `init_point` → webhook), cross-origin sem preflight, fonte de preço espelhada, idempotência do webhook, refund, tabela de frete.
- **Fase 1 — Design** (`data-model.md`, `contracts/`, `quickstart.md`): modelos `Pedido`/`ItemPedido`; contratos de `/api/pedidos` e `/api/pagamentos/webhook`; roteiro de verificação real com pagamento de teste.
- **Fase 2 — Tasks** (`/speckit-tasks`): NÃO gerado aqui. Sequência prevista por user story (P1 → P3), backend antes do front em cada slice.

## Complexity Tracking

> Sem violações de Constitution Check — seção não aplicável.
