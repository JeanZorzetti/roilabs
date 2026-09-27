# Implementation Plan: Precificação — tabela de success fee por nicho no admin

**Branch**: `016-precificacao` (trabalho em branch; `main` é deploy) | **Date**: 2026-09-27 | **Spec**: [spec.md](./spec.md)

## Summary

Uma página nova no admin (`/admin/precificacao`) que mostra a tabela de success fee por nicho da pesquisa de 27/09/2026 e duas calculadoras (comissão de um pedido; encaixe pela margem). A regra de negócio mora num módulo puro, testado sem I/O; a página só lê o banco para listar as taxas em vigor dos parceiros, e sobrevive sem ele.

## Technical Context

**Language/Version**: TypeScript 5 · Next.js 16 App Router · React 19

**Primary Dependencies**: nenhuma nova.

**Storage**: nenhuma mudança de schema. Leitura de `Parceiro` (+ `Cadeira.daCasa`).

**Testing**: `node --import tsx test/precificacao.test.mjs` (entra no `npm test`).

**Project Type**: admin Next (server component + 1 client component).

## Constitution Check

| Princípio | Como a feature cumpre |
|---|---|
| I. Env primeiro | Não mexe em env nem conexão. |
| II. Verificação real | Build + testes + navegador local com Playwright (1440px e 390px, console limpo). **Falta** a prova em produção: só depois do push, e o push depende da decisão sobre o repo público (handoff.md). |
| III. Simplicidade | Tabela em código, não em model Prisma (muda raramente; teto e caminho de upgrade no topo de `precificacao.ts`). Sem dependência. |
| IV. Qualidade de página | Faixas coloridas, calculadora com decomposição da conta, tabelas que viram cartões no celular, estados de erro e de "não fecha". |
| V. Spec-driven | spec/plan/tasks/handoff nesta pasta. |

## Estrutura

```text
app/src/lib/precificacao.ts                   # NOVO — tabela + calcularComissao + encaixarPorMargem + nichoSugerido + lerNumeroBR (puro)
app/src/app/admin/precificacao/page.tsx       # NOVO — server: faixas, tabela, taxas em vigor, regras, comparativo
app/src/app/admin/precificacao/calculadora.tsx# NOVO — client: as duas calculadoras
app/src/app/admin/nav.tsx                     # + link "Precificação"
app/src/app/globals.css                       # bloco .pr-*; menu do topo quebra em linha inteira, não no rótulo
app/test/precificacao.test.mjs                # NOVO
app/package.json                              # teste novo no `npm test`
```

## Decisões

- **D1 — Não é parâmetro de cobrança.** A taxa que fatura continua em `Parceiro.comissaoAquisicao/Recorrencia` (spec 010). Ligar a tabela ao cadastro (ex.: botão "preencher pela tabela") fica para quando o Jean aprovar a tabela.
- **D2 — Sugestão por radical de palavra.** "Taxas em vigor" casa o `Parceiro.nicho` (texto livre) com a tabela pelo início das palavras, sem acento; modelos especiais primeiro ("CRM / Estética" é SaaS). É dica de leitura, rotulada como tal.
- **D3 — Degraus da régua de margem**: 55/45/35/30/20% → 18-10, 15-10, 12-8, 10-6, 8-5, cortados pela regra de 1/3 da folga. Com os limiares exatos, cada degrau cabe na própria folga (teste de propriedade em `precificacao.test.mjs`).
