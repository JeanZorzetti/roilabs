---
status: in_progress
next_effort: high
iteration: 15
updated_at: 2026-07-06T20:30:00.000Z
---

## Last completed
Bloqueio da tarefa 15 RESOLVIDO pelo dono (2026-07-06): o `handoff.md` sujo do
SplitJud foi commitado e pushado (`8c9958d` em `JeanZorzetti/splitjud` main);
working tree de lá confirmado limpo. Nenhuma tarefa nova executada nesta
retomada — a tarefa 15 ainda não começou.

## Next step
Retomar a **tarefa 15** do `macro_plan.md` (Semana 4, `[high]`, repo SplitJud,
`apps/site`): **Glossário de honorários advocatícios em `/glossario/`**.
Passos: (1) re-rodar `git -C "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud"
status` — precisa estar em `main` limpo (foi confirmado limpo em 2026-07-06,
mas re-cheque); (2) ler `docs/GEO-HANDOFF.md` e `docs/PLANO-MACRO-GEO.md` do
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
