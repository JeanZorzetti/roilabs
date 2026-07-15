# ROI Labs — Growth Partner

Monorepo do **ROI Labs Growth Partner**, um marketplace de venture local (modelo BNI:
uma cadeira por nicho por polo). Reúne o site institucional, o e-commerce do primeiro
polo e o painel administrativo, todos com deploy automático por push.

## Pacotes

| Pasta | Nome | Stack | O que é |
|-------|------|-------|---------|
| [`site/`](site) | `roilabs-site` | Astro | Site institucional do Growth Partner |
| [`site-goiania/`](site-goiania) | `site-goiania` | Astro | E-commerce do Polo 1 — Goiânia / porcelanato |
| [`app/`](app) | `roilabs-admin` | Next.js + Prisma | Painel administrativo (design system light) |
| [`open-seo/`](open-seo) | — | — | Keyword planner self-hosted (dependência de terceiro, não editar) |

## Estrutura de apoio

- **`Docs/`** — vault Obsidian (`Docs/Obsidian/80-dev/`). Toda documentação nova nasce aqui.
- **`specs/`** — specs Spec Kit das features.
- **`brand-assets/`** — logotipos e material de marca.
- **`macro_plan.md` / `current_state.md`** — plano e estado do loop autônomo (ver abaixo).
- **`scripts/`** — utilitários de build e manutenção.

## Desenvolvimento

Cada pacote tem seu próprio `package.json`. Exemplo para o site institucional:

```bash
cd site && npm install && npm run dev
```

Para o painel admin (Next + Prisma), gere o client antes do build:

```bash
cd app && npm install && npx prisma generate && npm run dev
```

## Loop autônomo

Este repo é operado por um loop autônomo (Claude Code) que consome `macro_plan.md`
e grava progresso em `current_state.md`, uma tarefa por iteração, com push direto
em `main`:

```bash
node "../claude-loop-runner/src/runner.mjs" "$(pwd)" --max-iterations 24
```

## Deploy

Push em `main` dispara o deploy de cada app automaticamente. Não há passo manual.
