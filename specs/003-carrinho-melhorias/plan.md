# Implementation Plan: Melhorias do carrinho do e-commerce de porcelanato

**Branch**: `003-carrinho-melhorias` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-carrinho-melhorias/spec.md`

## Summary

Melhorar o carrinho já em produção (`goiania.roilabs.com.br/carrinho/`, entregue pela 002) em quatro frentes, **reusando** a topologia da 002 (site Astro estático + `/app` Next 16) e **sem regredir** pSEO nem o checkout/pagamento. UX/conversão e simulador de m² são **100% client-side** (estendem `cart.ts`, `carrinho.astro` e novos islands); frete+prazo **estendem a tabela-knob** `frete.ts` (já espelhada no front); cupom é um **knob em código** (`cupons.ts`) validado por **um endpoint novo** (`/api/cupom/validar`, JSON + CORS) e **re-validado no checkout** (`/api/pedidos`, autoritativo); recuperação de carrinho é por **link com payload na URL** (sem tabela nem cron). Única migração: dois campos novos em `Pedido` (`cupom_codigo`, `desconto`). Nenhum adapter SSR, nenhuma dependência nova no front.

## Technical Context

**Language/Version**: TypeScript. Astro 5 (`site-goiania`, output estático) + Next 16 App Router (`/app`). Node 20 no build.

**Primary Dependencies**: Astro 5 e `/app` (Prisma + `@/lib/prisma`, Mercado Pago) **já existentes da 002**. **Zero dependência nova** — carrinho/simulador/mini-cart são JS vanilla + `localStorage`; cupom reusa Prisma/MP no `/app`.

**Storage**: Postgres `roilabs_db` (existente). **Sem tabela nova**: `Cupom` é knob em código (`app/src/lib/cupons.ts`); `CarrinhoSalvo` é payload na URL (não persiste). Única mudança de schema: `Pedido` ganha `cupom_codigo` + `desconto`, aplicada por `prisma db push` **MANUAL** (Constituição — não confiar no runner standalone).

**Testing**: Verificação em ambiente real (Constituição II) — Docker/EasyPanel + navegador em prod, pagamento via **credenciais de teste do Mercado Pago**. Self-checks runnable (ponytail) estendidos em `check-cart-math.mjs`: (a) `m²→caixas` com folga 5–20% e mín. 1; (b) math de cupom (percentual/fixo, nunca negativo, só sobre produto); (c) round-trip encode/decode do link de carrinho.

**Target Platform**: site estático → nginx em `goiania.roilabs.com.br`; rotas Next standalone em `app.roilabs.com.br`.

**Project Type**: Web — frontend estático (`site-goiania`) estendido + backend existente (`/app`) estendido.

**Performance Goals**: páginas de pSEO seguem HTML pré-renderizado (FR-018). Mini-cart/simulador/cupom client-side sem bloquear render; aplicar cupom é 1 fetch leve. SC-001: produto→checkout em ≤ 90 s.

**Constraints**: OneDrive corrompe `node_modules` → verificação só confiável em Docker/navegador (Constituição II). **Nunca confiar em valor vindo do cliente** (FR-017) — preço, frete e desconto recalculados no servidor no checkout, inclusive os embutidos no link de carrinho. Cupom display lê resposta cross-origin → endpoint precisa de header `Access-Control-Allow-Origin` para o site (POST simples urlencoded, sem preflight). Conteúdo PT-BR; código/commits em inglês.

**Scale/Scope**: 1 polo (Goiânia), volume inicial baixo. Tabela de frete/cupom = knobs (Grande Goiânia). Link de carrinho pequeno (~10 itens `{slug,caixas}` ⇒ cabe folgado em < 2000 chars de URL).

## Constitution Check

*GATE: passar antes da Fase 0; re-checar após a Fase 1.*

| Princípio | Avaliação |
|---|---|
| **I. Env-first** | OK. Sem segredo novo: cupom é knob em código; reusa `DATABASE_URL` + creds MP via env. Debug de pagamento/cupom começa pelos `.env` da EasyPanel + painel MP. |
| **II. Verificação real (NÃO-NEGOCIÁVEL)** | OK. Nada declarado "funcionando" via build local; verificação = Docker + navegador em prod + fluxo de cupom/frete/checkout de teste MP ponta-a-ponta (ver `quickstart.md`). |
| **III. Simplicidade (YAGNI)** | OK. Cupom = knob em código (sem tabela/CRUD); recuperação = payload na URL (sem tabela/endpoint/cron); frete+prazo estende a tabela existente (sem API de transportadora); simulador reusa `m2ParaCaixas`; mini-cart/inline-edit reusam `cart.ts`. Única migração (2 campos em `Pedido`) e único endpoint novo (cupom) são exigidos pela feature. Tetos marcados com `ponytail:` (ver `research.md`). |
| **IV. Qualidade voltada ao usuário** | OK. Carrinho/mini-cart/simulador reusam o design system premium do site; estados vazio/erro/loading explícitos; pSEO intacto (só islands client-side). |
| **V. Spec-driven + entrega fechada** | OK. No fluxo Spec Kit; `handoff.md` + commit/push ao fechar a implementação. |

**Resultado: PASS.** Sem violações → sem Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-carrinho-melhorias/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 (decisões D1–D8)
├── data-model.md        # Fase 1 (delta Pedido + Cupom knob + CarrinhoSalvo URL + AmbienteSimulado efêmero)
├── quickstart.md        # Fase 1 (como verificar em ambiente real)
├── contracts/           # Fase 1
│   ├── cupom-validar.md     # NOVO: POST /api/cupom/validar (JSON + CORS)
│   └── checkout-delta.md    # Delta do POST /api/pedidos (aplica/re-valida cupom + prazo)
├── checklists/
│   └── requirements.md  # Qualidade da spec (16/16)
└── tasks.md             # Fase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
site-goiania/                       # EXISTENTE (Astro estático) — estendido, pSEO intacto
└── src/
    ├── lib/
    │   └── cart.ts                  # ESTENDE: perda opcional + ambientes no CartItem; edit por m²;
    │                                #          estado de cupom; encode/decode do link (share)
    ├── data/
    │   └── produtos.ts              # EXISTENTE (fonte de m2_caixa/preço p/ DISPLAY) — inalterada
    ├── components/
    │   ├── Header.astro             # ESTENDE: gatilho do mini-cart + badge de contagem
    │   ├── MiniCart.astro           # NOVO: drawer client-side (lista resumida + ir ao carrinho)
    │   ├── AddToCart.astro          # ESTENDE: alternar entre "m² direto" e "calcular por ambiente"
    │   └── SimuladorM2.astro        # NOVO: island de ambientes (largura×comprimento, folga 5–20%)
    ├── pages/
    │   └── carrinho.astro           # ESTENDE: edit inline m²/caixas, estados, resumo transparente,
    │                                #          frete+prazo, campo de cupom, botão compartilhar,
    │                                #          restaurar de ?c=<payload>
    └── scripts/
        └── check-cart-math.mjs      # ESTENDE: folga 5–20%, math de cupom, round-trip do link

app/                                 # EXISTENTE (Next 16) — estendido
├── prisma/schema.prisma             # ESTENDE: Pedido + cupom_codigo + desconto (migração manual)
└── src/
    ├── lib/
    │   ├── precos.ts                # EXISTENTE (fonte de verdade de preço) — inalterada
    │   ├── frete.ts                 # ESTENDE: prazo por faixa + getter de faixa
    │   └── cupons.ts                # NOVO: knob de cupons + validarCupom(codigo, subtotalProduto)
    └── app/
        ├── api/cupom/validar/route.ts  # NOVO: POST público (urlencoded) → JSON {ok,desconto,motivo} + CORS
        ├── api/pedidos/route.ts        # ESTENDE: parse+re-valida cupom, prazo, total = produto − desconto + frete
        └── admin/pedidos/page.tsx      # ESTENDE: coluna cupom/desconto na listagem
```

**Structure Decision**: mesma topologia da 001/002 — `site-goiania` (frontend estático) + `/app` (backend) estendidos, **sem novo app e sem runtime no site** (Dockerfile/nginx inalterados). Todo código server vive no `/app`. O front continua **espelhando** as tabelas de display (preço via `data/produtos.ts`, frete via mirror de `frete.ts`); o servidor permanece a **única fonte autoritativa de dinheiro** no checkout (FR-017). Cupom precisa ler resposta cross-origin → o endpoint `/api/cupom/validar` envia `Access-Control-Allow-Origin` para o site; é o único ponto que difere do padrão "form-POST 303" da 002. `// ponytail: cupom como knob em código + link na URL; promover a tabela DB/CRUD e a link tokenizado só se a operação precisar gerir sem deploy ou revogar links.`

## Phases

- **Fase 0 — Pesquisa/decisões** (`research.md`): cupom como knob + endpoint CORS vs mirror; aplicação do desconto na preferência MP (escalar unitPrice, sem item negativo); prazo na tabela de frete; link de carrinho via payload na URL com expiração soft de 30 dias; persistência client-only de ambientes/perda; mini-cart como island sem tocar HTML de pSEO.
- **Fase 1 — Design** (`data-model.md`, `contracts/`, `quickstart.md`): delta de `Pedido` (cupom_codigo, desconto); `Cupom` (knob) e `CarrinhoSalvo` (URL) modelados; contratos do endpoint de cupom e do delta de checkout; roteiro de verificação real.
- **Fase 2 — Tasks** (`/speckit-tasks`): NÃO gerado aqui. Sequência prevista por user story (P1 UX → P2 simulador/frete → P3 cupom/recuperação), backend antes do front em cada slice que toca o `/app`.

## Complexity Tracking

> Sem violações de Constitution Check — seção não aplicável.
