# Implementation Plan: Cobrança recorrente de assinatura

**Branch**: `014-cobranca-recorrente` (trabalho direto em `main`) | **Date**: 2026-08-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-cobranca-recorrente/spec.md`

## Summary

Ligar a renovação automática que a 013 deixou preparada: o item de pedido da unidade
`assinatura` já grava `recorrencia`, `assinaturaEstado` e um `assinaturaRef` **nulo de
propósito** — o placeholder que esta feature preenche. A mudança central é trocar, só para
`loja.unidade === 'assinatura'`, a chamada de checkout de `createPreference` (Checkout Pro,
cobrança única) para `createPreapproval` (Assinaturas MP, autorização recorrente): é a única
forma de cobrar os ciclos seguintes **sem o comprador informar o cartão de novo** (FR-001),
porque o Checkout Pro de hoje não devolve nenhum meio de pagamento reutilizável. O 1º ciclo
continua sendo o MESMO `Pedido`/`ItemPedido` que a 013 já grava — não nasce um segundo conceito
de "ciclo 1" (assumption da spec). Duas tabelas novas (`Assinatura`, `CicloCobranca`) guardam a
máquina de estado (ativa/inadimplente/cancelada) e o histórico de tentativas; o webhook do MP,
já existente, ganha um ramo para eventos de assinatura; um cron diário (mesmo padrão do
`api/cron/digest`) fecha a janela de retry e cancela quem esgotou tentativas (FR-009); e um
link de token opaco — a menor superfície possível, sem login — cobre o autoatendimento de
cancelamento (FR-010/FR-011).

## Technical Context

**Language/Version**: TypeScript 5.x · Node 20+ · Next.js 16 App Router (`app`)

**Primary Dependencies**: Next 16, Prisma 6, Mercado Pago (Checkout Pro **e agora também
Assinaturas/Preapproval**, mesma conta/token). **Nenhuma dependência nova é adicionada** — a
API de Assinaturas é REST, coberta pelo mesmo padrão fetch sem SDK que `mercadopago.ts` já usa.

**Storage**: Postgres (EasyPanel). Schema aplicado por `prisma db push` **manual** (Constituição,
Restrições Técnicas). Duas tabelas novas: `assinaturas`, `ciclos_cobranca`.

**Testing**: `node --import tsx test/*.test.mjs` no `/app`, mesmo runner das 19+ suítes hoje.
Sem prova de pagamento real (cartão real está cancelado, mesma restrição da 013) — a verificação
é: teste unitário da máquina de estado + leitura do Postgres + navegação real do link de
cancelamento em produção.

**Target Platform**: `app` → Next standalone em `app.roilabs.com.br` (EasyPanel/Docker). Um cron
novo roda como GitHub Action agendada (mesmo padrão de `.github/workflows/rank-tracking.yml`),
não como processo de longa duração dentro do container.

**Project Type**: Web service (checkout, webhook, admin, cron, banco) — sem frontend novo no
`site-goiania` estático. A única tela nova voltada ao comprador (`/assinatura/cancelar`) vive
no `app` (Next), porque precisa de Prisma e do cliente MP, que o site estático não tem.

**Performance Goals**: nenhuma meta nova. O cron roda 1×/dia sobre um volume pequeno
(zero assinaturas reais em produção hoje — spec Assumptions); não há requisito de latência.

**Constraints**:
- **Zero comprador reautentica o cartão** (FR-001, literal). É a restrição que decide a
  arquitetura: só a autorização recorrente nativa do MP evita reentrada de cartão sem o app
  entrar em escopo PCI (tokenizar cartão no cliente).
- **Não recriar o 1º ciclo** (Assumption da spec) — o `Pedido`/`ItemPedido` gravado pela 013
  continua sendo a única fonte do ciclo 1; `Assinatura` nasce dentro da MESMA transação que já
  marca esse pedido como pago, nunca antes.
- Zero prova ponta a ponta com cartão real (mesma restrição da 013 — Out of scope, cancelado
  pelo Jean). Toda verificação é por leitura de banco e teste unitário da máquina de estado.
- Build local não prova nada (Constituição II).
- **Risco registrado, não resolvido nesta fase**: o nome exato do `type`/evento que o MP envia
  no webhook para uma cobrança gerada por Assinatura (`subscription_authorized_payment` é o
  nome mais citado na documentação pública, mas não foi possível confirmar contra a doc viva —
  ver research.md). O webhook é escrito para aceitar `payment` OU esse tipo, e a task de
  implementação inclui uma verificação em sandbox antes de fechar a fase.

**Scale/Scope**: 0 assinaturas reais hoje → infraestrutura que passa a valer na 1ª cadeira de
unidade `assinatura` publicada (spec Assumptions). 2 tabelas novas, ~4 rotas novas, 1 workflow
de cron novo, zero rota removida.

## Constitution Check

*GATE: passa antes da Fase 0 e é re-avaliado depois da Fase 1.*

| Princípio | Como este plano satisfaz | Status |
|---|---|---|
| **I. Env vars primeiro** | Nenhuma env var nova — reaproveita `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, todas já em produção. | ✅ |
| **II. Verificação em ambiente real** | Nenhuma task fecha com "build passou". Gates: `npm test` (máquina de estado, dedupe, ownership do token), leitura direta do Postgres de produção para conferir `assinaturas`/`ciclos_cobranca`, e navegação real do link de cancelamento. O risco do nome do evento webhook (acima) é verificado em sandbox MP antes de fechar a fase de implementação, não presumido. | ✅ |
| **III. Simplicidade deliberada (YAGNI)** | Zero dependência nova. Reaproveita 100% do que já existe: `mercadopago.ts` (2 funções novas, mesmo padrão fetch), `webhook/route.ts` (1 ramo novo), o cron pattern (`api/cron/digest` + GitHub Actions), `email.ts`, o padrão de token opaco único que a própria auth do site já não usa em lugar nenhum novo. Nenhuma abstração de "gateway de assinatura genérico" — é MP, ponto, como todo o resto do checkout. | ✅ |
| **IV. Qualidade de página** | A única tela nova (`/assinatura/cancelar`) é pequena por design (Assumption da spec: "menor tamanho possível para cancelar"), mas seu conteúdo (confirmação clara do que cancelar significa e o que continua valendo) segue o mesmo padrão de clareza das páginas de obrigado/pedido existentes — não é uma tela genérica de erro/sucesso. | ✅ |
| **V. Spec-driven e entrega fechada** | `specify → clarify (dispensado, checklist já 16/16) → plan` cumpridos; `tasks`/`implement` na sequência. `handoff.md` criado no fechamento, commit + push sem perguntar. | ✅ |

**Restrições técnicas verificadas:** monorepo por app respeitado (tudo em `app/src` e
`app/prisma`, nada novo em `site-goiania`); `prisma db push` manual previsto como task própria;
patterns Next 16 (`params: Promise<…>`, `getAuthFromRequest`, singleton `@/lib/prisma`, `@@map`
snake_case) mantidos; LLM não entra nesta feature.

**Resultado do gate:** PASS, com 1 item em Complexity Tracking (o risco do nome do evento
webhook, que é incerteza externa, não complexidade evitável).

## Project Structure

### Documentation (this feature)

```text
specs/014-cobranca-recorrente/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — a decisão Preapproval vs. alternativas, e o risco do evento webhook
├── data-model.md         # Fase 1 — Assinatura, CicloCobranca, e como se ligam ao ItemPedido da 013
├── quickstart.md         # Fase 1 — como verificar em ambiente real (Constituição II)
├── contracts/
│   ├── checkout-assinatura.md   # O que muda no POST /api/pedidos para unidade='assinatura'
│   ├── webhook-assinatura.md    # O ramo novo do webhook MP
│   └── cancelamento.md          # O contrato do link de autoatendimento (FR-010/FR-011)
├── checklists/
│   └── requirements.md  # já existe — 16/16
└── tasks.md             # Fase 2 — NÃO criado por /speckit-plan
```

### Source Code (repository root)

```text
app/                                        # Next 16 — checkout, webhook, admin, cron, banco
├── prisma/schema.prisma                    # + model Assinatura, + model CicloCobranca
├── src/lib/
│   └── mercadopago.ts                      # + createPreapproval, + cancelPreapproval
├── src/app/api/pedidos/route.ts            # unidade='assinatura' passa a chamar createPreapproval
├── src/app/api/pagamentos/webhook/route.ts # + ramo de evento de assinatura (cria Assinatura no
│                                            #   1º pagamento, grava CicloCobranca nos seguintes)
├── src/app/api/cron/assinaturas/route.ts   # NOVO — sweep diário: fecha janela de retry (FR-009)
├── src/app/api/assinaturas/cancelar/route.ts # NOVO — POST: valida token, cancela na MP + no banco
├── src/app/assinatura/cancelar/page.tsx    # NOVO — tela pública de autoatendimento (FR-010)
├── src/app/admin/assinaturas/page.tsx      # NOVO — visibilidade interna (FR-008 / US4)
└── test/
    ├── assinatura-maquina-estado.test.mjs  # NOVO — ativa→inadimplente→ativa / →cancelada (FR-003/FR-009)
    ├── assinatura-dedupe.test.mjs          # NOVO — mesmo mpPaymentId não grava 2 ciclos (FR-006)
    └── assinatura-cancel-token.test.mjs    # NOVO — token só cancela A PRÓPRIA assinatura (FR-011)

.github/workflows/
└── cobranca-assinaturas.yml                # NOVO — cron diário (mesmo padrão de rank-tracking.yml)
```

**Structure Decision**: tudo mora em `app/`, nenhuma pasta de topo nova. O cron é uma rota HTTP
protegida por `CRON_SECRET` (não um processo separado) porque é exatamente o padrão que
`api/cron/digest` já validou em produção — inventar um segundo mecanismo de agendamento seria a
abstração que a Constituição III proíbe. `site-goiania` (Astro) não é tocado: a tela de
cancelamento não precisa de SEO nem faz parte do funil de vendas, e colocá-la no `app` evita
duplicar acesso a Prisma/MP num container que não tem nenhum dos dois.

## Fases de execução

### Fase 1 — O dado e a autorização recorrente

Adicionar `Assinatura`/`CicloCobranca` ao schema (`prisma db push` manual). Trocar
`createPreference` → `createPreapproval` só no branch `unidade === 'assinatura'` de
`/api/pedidos`, gravando `assinaturaRef` no `ItemPedido` de imediato (mesmo padrão de
`mpPreferenceId` hoje). Nenhuma cadeira publicada usa essa unidade ainda (spec Assumptions) —
esta fase é segura por vacuidade em produção.

*Prova:* teste unitário de que o branch monta o payload de preapproval corretamente; nenhuma
rota existente muda de comportamento (cobertura de regressão do checkout atual continua verde).

### Fase 2 — O webhook e a máquina de estado

Estender `webhook/route.ts`: o 1º pagamento de uma assinatura cria a `Assinatura` dentro da
MESMA transação que hoje marca o `Pedido` como pago; pagamentos seguintes (pedido já `pago`)
gravam `CicloCobranca` e movem o estado (`ativa`↔`inadimplente`, nunca `cancelada` aqui — FR-009
é o cron, não o webhook).

*Prova:* `assinatura-maquina-estado.test.mjs` e `assinatura-dedupe.test.mjs` verdes; verificação
em sandbox MP do nome real do evento (risco do Technical Context).

### Fase 3 — Cancelamento e visibilidade

`api/assinaturas/cancelar` (token opaco, FR-011 por construção — o token só existe para UMA
assinatura) + `/assinatura/cancelar` (tela). `admin/assinaturas` (FR-008/US4). Cron
`api/cron/assinaturas` + workflow do GitHub Actions (FR-009).

*Prova:* `assinatura-cancel-token.test.mjs` verde; navegação real do link em produção; leitura
do Postgres confirmando que o cron cancela quem passou da janela e não toca quem não passou.

## Complexity Tracking

> Um item: incerteza externa, não complexidade evitável.

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Webhook aceita dois `type` possíveis (`payment` e `subscription_authorized_payment`) para o mesmo evento de cobrança | A doc pública do MP não confirma de forma verificável qual nome o gateway envia (ver research.md); tratar os dois é a forma de não quebrar em produção por causa de um detalhe de nomenclatura | Assumir um nome só e corrigir depois de quebrar é a exata falha que a Constituição II proíbe ("nenhuma mudança é declarada funcionando sem evidência de ambiente real"); a verificação em sandbox é uma task explícita, não uma suposição no código |

## O que este plano deliberadamente NÃO faz

- **Não constrói troca de forma de pagamento.** Cartão vencido/recusado permanentemente é
  resolvido pelo próprio comprador na página de assinatura do MP (fora do nosso domínio) — fora
  de escopo por Assumption da spec.
- **Não reembolsa.** Fora de escopo por Assumption da spec.
- **Não cria login/área logada de comprador.** O token de cancelamento é a superfície mínima
  (FR-010/FR-011), não uma conta.
- **Não migra o checkout de porcelanato/fitas.** Só o branch `unidade === 'assinatura'` muda.
- **Não prova pagamento com cartão real.** Mesma restrição cancelada da 013.
