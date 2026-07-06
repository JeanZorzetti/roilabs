---
status: blocked
next_effort: high
iteration: 15
updated_at: 2026-07-06T19:50:59.000Z
---

## Last completed
Nada executado nesta iteração. Tarefa 15 (glossário de honorários no SplitJud)
**bloqueou no pré-check obrigatório** da Mecânica cross-repo: o working tree de
`C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud` está **sujo** — `handoff.md`
tem 27 linhas não commitadas (bloco "STATUS 2026-07-05 — Fase GEO F3 concluída",
aparentemente o resumo do macro plan 2/tarefa 19 que ficou sem commit lá).
Branch é `main`, up to date com origin; só esse arquivo está modificado.
A regra do macro_plan.md é explícita: sujo → `status: blocked`, não "arrumar"
sozinho. Nenhum arquivo do SplitJud foi tocado.

## Next step
**BLOQUEADO — ação do dono:** no repo SplitJud, commitar ou descartar a
modificação pendente de `handoff.md` (parece legítima — é o resumo do mês 2;
`git -C "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud" add handoff.md &&
git commit && git push` resolve). Depois disso, retomar a **tarefa 15** do
`macro_plan.md` (Semana 4, `[high]`, repo SplitJud, `apps/site`):
**Glossário de honorários advocatícios em `/glossario/`**.
Passos ao retomar: (1) re-rodar `git -C ...\splitjud status` — precisa estar em
`main` limpo; (2) ler `docs/GEO-HANDOFF.md` e `docs/PLANO-MACRO-GEO.md` do
SplitJud; (3) criar 15–20 termos (sucumbência, contratuais, êxito/quota litis,
dativos, arbitrados, assistenciais, substabelecimento com/sem reserva,
correspondente jurídico, rateio, destaque de honorários, tabela OAB, contrato
de risco...), definição BLUF 2–4 frases + `DefinedTermSet`/`DefinedTerm` +
âncoras `#termo`, interlinkando os 6 artigos do blog e a calculadora; mesmo
padrão do glossário do site-goiania; integrar ao `@graph` existente sem
duplicar entidades e SEM tocar `[PLACEHOLDER_*]` de
`apps/site/src/lib/schema.ts`; (4) `npm run build` verde em `apps/site`,
registrar em sitemap/llms.txt; (5) **push manual**:
`git -C ...\splitjud push origin main` (o runner só pusha este repo).
`current_state.md` continua aqui neste repo.
