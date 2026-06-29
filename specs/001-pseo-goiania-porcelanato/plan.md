# Implementation Plan: pSEO Regional — Porcelanato Goiânia

**Branch**: `001-pseo-goiania-porcelanato` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-pseo-goiania-porcelanato/spec.md`

## Summary

Gerar páginas de SEO programático para compradores de porcelanato em Goiânia, num **novo app Astro estático** servido em `goiania.roilabs.com.br` (subdomínio por polo, nicho como pasta — IA decidida no vault). As páginas são informacionais (sem catálogo, até haver fornecedor), ricas e específicas por tipo/ocasião, ancoradas nos volumes reais do Keyword Planner. Conversão por **dois canais**: WhatsApp click-to-chat (sem backend) e um **formulário** que grava um `LeadConsumidor` no `/app` existente (urlencoded → 303, honeypot, consentimento LGPD). Medição entra como **sitemap + tag de analytics** no código; submissão ao Search Console é ops.

Abordagem técnica: um **único template** `porcelanato/[slug].astro` + `getStaticPaths` sobre uma **fonte de dados curada** (`src/data/porcelanato.ts`, ~25-40 entradas). Reusa o design system do `/site` por cópia. Nenhuma dependência nova; uma tabela Postgres nova e um endpoint novo no `/app`.

## Technical Context

**Language/Version**: TypeScript. Astro 5 (site-goiania, output estático) + Next 16 App Router (endpoint no `/app` existente). Node 20 no build.

**Primary Dependencies**: Astro 5 (já em `/site`), Prisma + `@/lib/prisma` (já em `/app`). **Sem dependências novas** (`@dnd-kit`, libs de form, etc. não entram).

**Storage**: Postgres `roilabs_db @ 2.24.207.200:5443` (existente). Nova tabela `leads_consumidor` (model `LeadConsumidor`), aplicada por `prisma db push` MANUAL. Tabelas existentes (`candidaturas`, `cadeiras`) intactas.

**Testing**: Verificação em ambiente real (Constituição II) — Docker/EasyPanel + navegador em prod. Mais um self-check runnable do gerador (Constituição/ponytail): assert de que toda entrada da matriz tem `slug` único, `volume > 0` e atributos obrigatórios (`node` + `assert`, sem framework).

**Target Platform**: site estático → nginx em `goiania.roilabs.com.br`; endpoint Next standalone em `app.roilabs.com.br`.

**Project Type**: Web — frontend estático novo (`site-goiania`) + backend existente (`/app`) estendido.

**Performance Goals**: páginas estáticas (HTML pré-renderizado), conteúdo completo sem JS (FR-010). LCP típico < 2,5s; sem metas de throughput (estático).

**Constraints**: OneDrive corrompe `node_modules` (errno -4094) → build/verificação só confiável em Docker/navegador (Constituição II). LLM = claude-cli (sem API paga). Conteúdo PT-BR. Form cross-origin = requisição simples urlencoded (sem preflight), igual `candidaturas`.

**Scale/Scope**: ~25-40 páginas na v1; centenas a poucos milhares conforme catálogo/volumes (a matriz expande por dados, não código — FR-008).

## Constitution Check

*GATE: passar antes da Fase 0; re-checar após a Fase 1.*

| Princípio | Avaliação |
|---|---|
| **I. Env-first debug** | OK. `DATABASE_URL`/analytics ID via env; nenhum segredo hard-coded. Debug de deploy começa pelos `.env` da EasyPanel. |
| **II. Verificação em ambiente real (NÃO-NEGOCIÁVEL)** | OK. O plano NÃO declara nada "funcionando" via build local; verificação = Docker (EasyPanel) + navegador em prod (ver `quickstart.md`). |
| **III. Simplicidade (YAGNI)** | OK. 1 template + 1 arquivo de dados (sem CMS, sem API de volume, sem content collection p/ programático); design system por cópia (sem pacote compartilhado — 2º polo dispara extração); páginas informacionais (sem catálogo falso). Novo app + nova tabela são **justificados por decisões já fechadas** (IA polo no vault; "os dois" no clarify), não especulação. |
| **IV. Qualidade de página voltada ao usuário** | OK. Conteúdo rico e específico por tipo/ocasião + design premium reusado do `/site` (FR-003). |
| **V. Spec-driven + entrega fechada** | OK. Estamos no fluxo Spec Kit; `handoff.md` + push ao fechar (Fase de implement). |

**Resultado: PASS.** Sem violações → sem Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-pseo-goiania-porcelanato/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 (decisões de design)
├── data-model.md        # Fase 1 (LeadConsumidor + shape da matriz)
├── quickstart.md        # Fase 1 (como rodar/verificar em ambiente real)
├── contracts/           # Fase 1 (endpoint de lead + contrato da página)
│   ├── leads-consumidor.md
│   └── porcelanato-page.md
├── checklists/
│   └── requirements.md  # do /speckit-specify (16/16)
└── tasks.md             # Fase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
site-goiania/                       # NOVO app Astro (3º na EasyPanel), espelha /site
├── astro.config.mjs                # site: https://goiania.roilabs.com.br
├── Dockerfile                      # node build → nginx (cópia do /site)
├── package.json · tsconfig.json
└── src/
    ├── data/
    │   └── porcelanato.ts           # matriz curada: dimensões + ~25-40 entradas (term, volume, tipo, ocasião, atributos, FAQ)
    ├── layouts/Base.astro           # cópia do /site + <head> SEO + JSON-LD + tag analytics
    ├── components/
    │   ├── Header.astro · Footer.astro   # cópia do /site
    │   ├── WhatsappCta.astro         # link wa.me com texto pré-preenchido do contexto
    │   └── LeadForm.astro            # form → app /api/leads-consumidor (honeypot + consentimento LGPD)
    ├── pages/
    │   ├── index.astro               # hub do polo: lista nicho(s) (hoje porcelanato)
    │   ├── porcelanato/index.astro   # índice do silo (lista todas as páginas)
    │   ├── porcelanato/[slug].astro  # TEMPLATE pSEO (getStaticPaths sobre data/porcelanato.ts)
    │   ├── obrigado.astro            # pós-form
    │   └── sitemap.xml.ts            # hub + todos os /porcelanato/{slug}
    └── styles/global.css            # cópia do /site
    └── scripts/check-matrix.mjs      # self-check: slug único, volume>0, atributos obrigatórios

app/                                 # EXISTENTE — estendido
├── prisma/schema.prisma             # + model LeadConsumidor @@map("leads_consumidor")
└── src/app/
    ├── api/leads-consumidor/route.ts # POST público (urlencoded, honeypot, consent, 303) + GET admin
    └── admin/leads/page.tsx          # listagem mínima p/ a operação (espelha /admin de candidaturas)
```

**Structure Decision**: app Astro **separado** (`site-goiania`) porque servir as páginas regionais do build do `roilabs.com.br` criaria conteúdo duplicado nos dois hosts (decisão de IA no vault). Nichos futuros = novas pastas dentro de `site-goiania` (mesmo host, autoridade consolidada — FR-002), não novos apps. O `/app` é estendido (não duplicado) para o lead + admin.

## Complexity Tracking

> Sem violações de Constitution Check — seção não aplicável.
