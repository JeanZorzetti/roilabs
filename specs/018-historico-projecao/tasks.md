# Tasks — 018 Histórico de consultas da Projeção

**Input**: [plan.md](plan.md), [spec.md](spec.md), [data-model.md](data-model.md), [contracts/api.md](contracts/api.md)

## Phase 1: Foundational (bloqueia as histórias)

- [x] T001 Adicionar `model ConsultaProjecao` em `app/prisma/schema.prisma` (data-model.md)
- [x] T002 Conferir o diff contra o banco de produção e aplicar só o `CREATE TABLE` (quickstart §1)
- [x] T003 `resumirConsulta()` em `app/src/lib/projecao.ts`
- [x] T004 Teste de `resumirConsulta` com exemplo sintético (repo público) em `app/test/projecao.test.mjs`

## Phase 2: US1 — Toda consulta paga fica guardada (P1)

- [x] T005 [US1] `app/src/app/api/projecao/consultar/route.ts`: validar `nicho` e `paraQuem`, gravar depois do volume,
  devolver `id` (`null` na falha, com log sem termos)
- [x] T006 [US1] `app/src/app/admin/projecao/projecao.tsx`: campo "Para quem", enviar `nicho` e `paraQuem`,
  `replaceState` para `?consulta=<id>`, aviso quando `id` for `null`

## Phase 3: US3 — Abrir uma consulta em detalhe (P1)

- [x] T007 [US3] `app/src/app/admin/projecao/page.tsx`: ler `?consulta`, buscar no banco, passar `inicial`;
  estados "não encontrada" e "banco fora"
- [x] T008 [US3] `projecao.tsx`: iniciar nicho, local, termos, nome e resposta a partir de `inicial`; procedência
  "consulta guardada"; aviso de nicho que deixou de existir

## Phase 4: US2 — Achar uma consulta no histórico (P1)

- [x] T009 [US2] `app/src/app/admin/projecao/consultas/page.tsx`: lista (200 mais recentes), total, custo somado,
  desde quando, estado vazio e banco fora
- [x] T010 [US2] Link "Consultas guardadas (N)" no `action` do `AdminShell` da Projeção

## Phase 5: Dados e polimento

- [x] T011 Importação das 2 consultas da Karla (FR-013), por script fora do repo
- [x] T012 Comentários da 017 que dizem "nada é gravado" e `GLOSSARIO.md` (Consultas guardadas, Para quem)
- [ ] T013 `npm test` + typecheck, commit, push
- [ ] T014 Verificação em produção (quickstart §3 a §7), com screenshots nas 3 larguras
- [ ] T015 `handoff.md` da 018 + `.info/log.json` (information-design)
