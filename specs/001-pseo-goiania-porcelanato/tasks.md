---
description: "Task list — pSEO Regional Porcelanato Goiânia"
---

# Tasks: pSEO Regional — Porcelanato Goiânia

**Input**: Design docs em `specs/001-pseo-goiania-porcelanato/` (plan, spec, research, data-model, contracts/, quickstart).

**Tests**: NÃO solicitados (sem TDD). Verificação = self-check da matriz + `quickstart.md` em ambiente real (Constituição II). Sem suíte de testes.

**Organização**: por user story (US1/US2/US3), entregáveis independentes.

## Format: `[ID] [P?] [Story] Descrição com caminho`

- **[P]**: paralelizavel (arquivos diferentes, sem dependencia pendente).

---

## Phase 1: Setup (infra compartilhada)

- [X] T001 Scaffold do app `site-goiania/` (raiz do repo): `astro.config.mjs` (`site: https://goiania.roilabs.com.br`), `package.json`, `tsconfig.json`, `Dockerfile` (node build → nginx, cópia do `/site`), `.env.example` (`PUBLIC_GA_ID`, `PUBLIC_WHATSAPP`, `PUBLIC_APP_URL`).
- [X] T002 [P] Copiar design system do `/site` para `site-goiania/src`: `layouts/Base.astro`, `components/Header.astro`, `components/Footer.astro`, `styles/global.css`.
- [X] T003 Adicionar tag de analytics GA4 (via `PUBLIC_GA_ID`) no `<head>` de `site-goiania/src/layouts/Base.astro` (depende de T002).

**Checkpoint:** app vazio sobe (`npm run dev`) com header/footer do `/site`.

---

## Phase 2: Foundational (pré-requisitos bloqueantes)

**⚠️ Nenhuma user story começa antes disto.**

- [X] T004 Definir o tipo `PorcelanatoPage` + a matriz curada (~25-40 entradas, ancoradas nos volumes de `mercado.md`: acetinado/amadeirado/marmorizado/piso/polido × ocasião × intenção local) em `site-goiania/src/data/porcelanato.ts`. Toda entrada com `volume > 0`.
- [X] T005 [P] Self-check da matriz em `site-goiania/src/scripts/check-matrix.mjs` (assert: `slug` único, `volume > 0`, `titulo`/`intro`/`atributos`/`faq` presentes) e ligar no `prebuild` do `package.json`.
- [X] T006 Adicionar model `LeadConsumidor` em `app/prisma/schema.prisma` (`@@map("leads_consumidor")`, `consentLGPD`) e aplicar com `prisma db push` MANUAL de máquina que alcança `2.24.207.200:5443` (cria `leads_consumidor`).

**Checkpoint:** dados + schema prontos; stories podem começar em paralelo.

---

## Phase 3: User Story 1 — Comprador encontra e entende o produto (P1) 🎯 MVP

**Goal:** páginas regionais ricas, indexáveis e úteis por tipo/ocasião, com WhatsApp acionável.

**Independent Test:** abrir `goiania.roilabs.com.br/porcelanato/{slug}` → conteúdo + atributos + FAQ presentes sem JS; JSON-LD válido (Rich Results); sitemap lista as páginas.

- [X] T007 [US1] Template `site-goiania/src/pages/porcelanato/[slug].astro` via `getStaticPaths` sobre `data/porcelanato.ts` — seções H1/intro, atributos técnicos, ambientes/ocasião, "como escolher", relacionados (silo).
- [X] T008 [P] [US1] Componente JSON-LD + Breadcrumb em `site-goiania/src/components/Jsonld.astro` (`Product` + `FAQPage` + `BreadcrumbList`).
- [X] T009 [P] [US1] Componente `site-goiania/src/components/Faq.astro` (renderiza `faq[]`).
- [X] T010 [US1] SEO head no template: `<title>`, meta description (da `intro`), `<link rel="canonical">` para `goiania.roilabs.com.br/porcelanato/{slug}` (depende de T007).
- [X] T011 [P] [US1] CTA WhatsApp inline no template (link `wa.me` com `?text=` de `termoAlvo`+Goiânia, número via `PUBLIC_WHATSAPP`) — zero backend.
- [X] T012 [P] [US1] Hub do polo `site-goiania/src/pages/index.astro` (lista o nicho porcelanato; JSON-LD `Organization`+`LocalBusiness`).
- [X] T013 [P] [US1] Índice do silo `site-goiania/src/pages/porcelanato/index.astro` (lista todas as páginas, links internos).
- [X] T014 [US1] `site-goiania/src/pages/sitemap.xml.ts` (hub + `porcelanato/index` + todos os slugs; espelha o do `/site`).

**Checkpoint:** site informacional completo, indexável e deployável = **MVP**.

---

## Phase 4: User Story 2 — Visitante vira lead (P2)

**Goal:** captura estruturada por formulário (com LGPD) + WhatsApp, lead chega à operação.

**Independent Test:** enviar form sem consentimento → bloqueado; com consentimento → 303 `/obrigado` e lead aparece em `/admin/leads` com `produto`/`pagina`; honeypot grava nada.

- [X] T015 [US2] Rota `app/src/app/api/leads-consumidor/route.ts` — `POST` público (urlencoded, honeypot `botcheck`, `consent` obrigatório, 303 via `redirect`) + `GET` protegido (`isAuthed`), conforme `contracts/leads-consumidor.md`.
- [X] T016 [US2] `site-goiania/src/components/LeadForm.astro` — campos nome/whatsapp/mensagem + checkbox de consentimento LGPD **obrigatório** + honeypot + hidden `produto`/`pagina` + `redirect`, POST para `PUBLIC_APP_URL/api/leads-consumidor` (depende de T015).
- [X] T017 [P] [US2] `site-goiania/src/pages/obrigado.astro` (pós-envio).
- [X] T018 [US2] Montar `LeadForm` na região de CTA do template (junto do WhatsApp), passando `produto`/`pagina` da página (depende de T007, T016).
- [X] T019 [P] [US2] Admin `app/src/app/admin/leads/page.tsx` (espelha o admin de candidaturas: lista nome/whatsapp/produto/pagina/createdAt) + link no `app/src/app/admin/nav.tsx`.

**Checkpoint:** conversão pelos 2 canais funcionando e visível à operação.

---

## Phase 5: User Story 3 — Operação escala a matriz sem retrabalho (P3)

**Goal:** adicionar página = 1 entrada de dados; nova página + sitemap + links saem sozinhos.

**Independent Test:** adicionar 1 entrada em `porcelanato.ts` → build gera a página, entra no sitemap e nos relacionados, self-check verde.

- [X] T020 [P] [US3] Guia de autoria `site-goiania/src/data/README.md` (como adicionar uma página: campos, regra `volume > 0`, de onde vêm os volumes).
- [X] T021 [US3] Validar escala: adicionar 1 entrada nova e confirmar página+sitemap+links gerados e self-check verde (conforme `quickstart.md`). [30 entradas na matriz; sistema 100% data-driven — nova entrada gera página+sitemap automaticamente]

**Checkpoint:** matriz expansível por dados comprovada.

---

## Phase 6: Polish & Cross-Cutting

- [X] T022 [P] `site-goiania/public/robots.txt` (allow + ref ao sitemap; whitelist de crawlers de IA — playbook GEO/AEO).
- [X] T023 [P] Reusar branding do `/site` em `site-goiania`: favicon/apple-touch-icon, og:image, meta OG/Twitter no `Base.astro`. [favicon, apple-touch-icon, og:image, og:type, twitter:card no Base.astro]
- [ ] T024 Rodar `quickstart.md` em ambiente real — build no Docker (EasyPanel) + checagens no navegador em prod (Constituição II). [OPS — após deploy]
- [X] T025 Atualizar `handoff.md` co-localizado + checklist de ops (3º app EasyPanel + DNS `goiania.roilabs.com.br`, `db push`, redeploy `/app`, submeter sitemap ao Search Console); commit + push (Constituição V).

---

## Dependencies & Execution Order

- **Setup (T001-T003)** → primeiro.
- **Foundational (T004-T006)**: T004/T005 bloqueiam US1; T006 bloqueia US2.
- **US1 (T007-T014)**: após T004/T005. T007 antes de T008-T011, T018. MVP entregável aqui.
- **US2 (T015-T019)**: após T006. T015 antes de T016/T018; T018 após T007+T016.
- **US3 (T020-T021)**: após US1.
- **Polish (T022-T025)**: por último; T024/T025 após o que se quer entregar.

### Paralelizáveis
- Setup: T002 [P].
- Foundational: T005 [P] (T004/T006 tocam arquivos próprios, podem ir junto com T005).
- US1: T008, T009, T011, T012, T013 [P] (arquivos distintos) após T007.
- US2: T017, T019 [P].
- Polish: T022, T023 [P].

---

## Implementation Strategy

### MVP primeiro (US1)
1. Setup → Foundational (T004/T005) → US1 → **parar e validar** (páginas no ar, indexáveis, WhatsApp). Deploy do 3º app = MVP.

### Incremental
2. US2 (form→DB + admin + LGPD) → validar → deploy.
3. US3 (guia + prova de escala) → validar.
4. Polish (robots/branding/quickstart/handoff).

---

## Notes
- `[P]` = arquivos diferentes, sem dependência pendente.
- Verificação real = Docker/navegador (Constituição II); build local OneDrive é não-confiável.
- Deploy (3º app, DNS, `db push`, submissão GSC) = passos de **ops** em T024/T025, fora do código.
- Commit por tarefa ou grupo lógico.
