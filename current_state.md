---
status: in_progress
next_effort: high
iteration: 14
updated_at: 2026-07-05T17:05:00.000Z
---

## Last completed
Nada executado nesta iteração. Tarefa 15 (Semana 4, `[plan]`, SplitJud) foi
**bloqueada** no pré-check obrigatório da Mecânica cross-repo: o working tree
do repo `C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud` está **sujo** em
`main`:

- deletados (não commitados): `docs/Neural_Web_Architecture (1).pdf`,
  `docs/Otimização de Sites para IA.md`
- modificado: `docs/PLANO-MACRO-GEO.md`
- untracked: `docs/GEO-HANDOFF.md`, `docs/Notebook/`, `apps/site/.astro/`

O macro_plan.md manda explicitamente: "Sujo ou em outra branch →
`status: blocked`, não 'arrume' sozinho." Agravante: o `GEO-HANDOFF.md` — doc
de contexto obrigatório da tarefa 15 — está untracked, ou seja, o próprio
insumo da tarefa está em estado não commitado/em fluxo pelo dono.

## Next step
**Desbloqueado pelo dono em 2026-07-05:** working tree do SplitJud resolvido
(GEO-HANDOFF.md e PLANO-MACRO-GEO.md commitados; `docs/Notebook/` e
`apps/site/.astro/` agora no `.gitignore` — repo é público, o Notebook tem PDF
de terceiro e fica local). `main` limpo, commit `4373b4e` pushado.

Executar a **tarefa 15 do macro_plan.md**:

1. Ler `docs/GEO-HANDOFF.md` e `docs/PLANO-MACRO-GEO.md` no SplitJud.
2. Escrever os 3 artigos GEO restantes do cluster F3 em `apps/site`:
   (a) tabela de honorários OAB, (b) gestão financeira de escritório de
   advocacia, (c) repasse de honorários entre correspondentes — mesmo padrão
   dos 3 existentes (BLUF, FAQ, interlink), com `datePublished` visível na
   página e no schema desde já.
3. Restrições: só `apps/site` e `docs/`; não tocar em `apps/app`, `prisma/`,
   `.env*`, nem nos `[PLACEHOLDER_*]` de `apps/site/src/lib/schema.ts`.
4. `npm run build` em `apps/site` verde antes de commitar; push manual
   (`git -C "...\splitjud" push origin main`). O `current_state.md` continua
   aqui neste repo.
