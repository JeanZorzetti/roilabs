---
status: in_progress
next_effort: medium
iteration: 19
updated_at: 2026-07-06T22:10:00.000Z
---

## Last completed
**Tarefa 18 concluída** (Semana 4, SplitJud, `[low]`): RSS + descoberta no
repo SplitJud (`apps/site`), commit `1c100d5` pushado manualmente para
`JeanZorzetti/splitjud` main. Resultado:
- Criado `apps/site/src/pages/rss.xml.ts` — RSS 2.0 gerado na mão (padrão da
  tarefa 7 / `site/src/pages/rss.xml.ts` deste repo), a partir de
  `getCollection('blog')` filtrando `publishedAt !== null`, ordenado por data
  desc. 9 itens no feed (6 originais + 3 da tarefa 16). URLs sem barra final
  (`/blog/<slug>`), guid isPermaLink, atom:link self.
- `<link rel="alternate" type="application/rss+xml" href="/rss.xml">` no
  `<head>` de `BaseLayout.astro` (cobre PublicLayout também).
- `public/llms.txt`: adicionada linha do feed RSS em "Páginas principais"
  (glossário e os 3 artigos novos já estavam, das tarefas 15–16).
- Sitemap é automático (@astrojs/sitemap). Interlink verificado: glossário
  linka calculadora + todos os artigos, artigos novos linkam glossário;
  nada refeito.
- Validação: `npm run build` verde (19 páginas), `dist/rss.xml` inspecionado
  (9 `<item>`, XML válido). Working tree do SplitJud limpo após push.
- Não tocado: `apps/app`, `prisma/`, `.env*`, `[PLACEHOLDER_*]`.

## Next step
**Tarefa 19** do `macro_plan.md` (Semana 4, `[medium]`): **Fechamento.**
1. Rodar `npm run build` em
   `C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud\apps\site` e
   `astro build` em `site/` e `site-goiania/` DESTE repo
   (`C:\Users\jeanz\OneDrive\Desktop\ROI Labs\ROI Labs`) — todos devem passar.
2. Atualizar `handoff.md` de CADA repo (raiz deste repo e raiz do splitjud)
   com o que o macro plan 3 entregou (tarefas 1–18; ver commits recentes de
   cada repo), pendências de ops (GSC_SA_KEY/PSI se ainda ausentes, T002
   placeholders do SplitJud) e gotchas novos.
3. Registrar o resumo do mês em
   `Docs/Obsidian/80-dev/changelog-ciclos.md`, seção "Macro plan 3"
   (vault Obsidian, NÃO em docs/ do repo).
4. No SplitJud: commit + push manual
   (`git -C "...\splitjud" push origin main`). Neste repo: commit normal
   (runner pusha). Depois disso todas as 19 tarefas estão feitas →
   marcar `status: done` neste arquivo, iteration 20.
