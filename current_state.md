---
status: in_progress
next_effort: medium
iteration: 18
updated_at: 2026-07-05T19:25:00.000Z
---

## Last completed
**Tarefa 18 (Semana 4, `[build]`, SplitJud) concluída.** Interlink + descoberta
no SplitJud. Pré-check ok (`main` limpo). Commit `2719f9b` pushado em
`github.com/JeanZorzetti/splitjud` main.

- Link contextual para `/calculadora` adicionado nos 6 artigos de
  `apps/site/src/content/blog/` (um por artigo, em ponto onde a simulação faz
  sentido — exemplo de cálculo, cláusula de percentual, regra de rateio).
- Home (`index.astro`): parágrafo com link para a calculadora na seção
  "Como o SplitJud calcula" (features grid).
- `public/llms.txt`: nova seção "Artigos do blog" listando os 6 artigos com
  descrição; calculadora já estava listada (tarefa 17).
- Sitemap: automático via @astrojs/sitemap, já cobre artigos + calculadora.
- `@graph` conferido: artigos emitem `Article` referenciando `PERSON_ID`/
  `ORG_ID` por `@id` (grafo único, sem duplicar entidades); `[PLACEHOLDER_*]`
  de `schema.ts` intocados.
- `npm run build` verde em `apps/site` (15 páginas); verificado no `dist/` que
  7 páginas (6 artigos + home) renderizam `href="/calculadora"`.

## Next step
Executar a **tarefa 19 do macro_plan.md** (`[build]`): **Fechamento do mês**.

1. Rodar `npm run build` em
   `C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud\apps\site` e
   `astro build` nos 2 sites deste repo (`site/` e `site-goiania/`) uma última
   vez — todos precisam passar.
2. Atualizar o `handoff.md` de CADA repo (raiz deste repo E raiz do splitjud)
   com: o que o macro plan 2 entregou (19 tarefas, semanas 1–4), pendências de
   ops que surgiram e gotchas novos descobertos no mês.
3. Registrar o resumo do mês em `Docs/Obsidian/80-dev/changelog-ciclos.md`
   (seguir o formato das entradas existentes).
4. SplitJud: pré-check `git -C "...\splitjud" status` (main limpo; sujo →
   blocked). Commit + push manual do handoff.md de lá
   (`git -C "...\splitjud" push origin main`).
5. Ao final, como é a última tarefa, marcar `status: done` neste arquivo.
