# Tasks: Precificação — tabela de success fee por nicho no admin

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

**Tests**: incluídos (a regra é conta de dinheiro, mesmo sem cobrar).

## Fase 1 — Regra (US1, US2, US3)

- [x] T001 `app/src/lib/precificacao.ts`: tabela `NICHOS` (20 linhas, 5 faixas), constantes (piso, cortes, mínimo, ajuste de distribuidor, premissas de imposto/cartão).
- [x] T002 `calcularComissao()` — piso limitado ao pedido, 2/3 acima do corte com mínimo, distribuidor, entrada inválida = 0.
- [x] T003 `encaixarPorMargem()` — folga, recompra máxima, faixa mais alta que cabe.
- [x] T004 `nichoSugerido()` e `lerNumeroBR()`.
- [x] T005 `app/test/precificacao.test.mjs` + entrada no `npm test`.

## Fase 2 — Tela (US1–US4)

- [x] T006 `app/src/app/admin/precificacao/calculadora.tsx` (client): comissão de um pedido (1ª compra e recompra lado a lado) e encaixe pela margem.
- [x] T007 `app/src/app/admin/precificacao/page.tsx`: faixas, tabela agrupada, taxas em vigor (sobrevive sem banco), regras, contrato, comparativo, notas de confiança.
- [x] T008 Link no menu (`nav.tsx`) e bloco `.pr-*` em `globals.css`; tabelas viram cartões ≤760px.
- [x] T009 Menu do topo: com 12 links, quebra em linha inteira em vez de quebrar o rótulo.

## Fase 3 — Verificação

- [x] T010 `npm run build` limpo (TypeScript incluso) e `npm test` com saída 0.
- [x] T011 Navegador local (Playwright): 1440px e 390px, exemplos do relatório conferidos na tela, console sem erro, sem rolagem lateral.
- [x] T012 Publicar (merge em `main` + push) — autorizado pela Maria em 27/09, ciente do repo público (handoff.md §0).
- [ ] T013 Prova em produção: `/admin/precificacao` responde (redireciona para `/login` sem sessão) e abre logado com a lista real de parceiros.
