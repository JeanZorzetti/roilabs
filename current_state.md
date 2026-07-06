---
status: in_progress
next_effort: low
iteration: 18
updated_at: 2026-07-06T22:05:00.000Z
---

## Last completed
**Tarefa 17 concluída** (Semana 4, SplitJud, `[low]`): FAQ + breadcrumbs no
repo SplitJud (`apps/site`), commit `4f585a5` pushado manualmente para
`JeanZorzetti/splitjud` main. Resultado:
- `/faq` **já emitia `FAQPage`** schema (via `data/faqs` + prop `jsonLd`) —
  registrado como "pulado (já existia)".
- `BreadcrumbList` JSON-LD **não existia** fora do `/glossario`. Fix na raiz:
  `PublicLayout.astro` agora anexa um node `BreadcrumbList` ao `@graph`
  (via `buildGraph` do BaseLayout) sempre que `showBreadcrumb`+
  `breadcrumbLabel` são passados — cobriu calculadora, funcionalidades,
  preços, depoimentos, faq, `/blog` e categorias de blog de uma vez.
- `blog/[slug].astro` (usa BaseLayout direto) ganhou trilha completa
  Início > Blog > Categoria > Post no `@graph` junto do Article.
- `/glossario` teve seu node `BreadcrumbList` próprio removido (o layout
  passou a emitir o equivalente — evita duplicata).
- Validação: `npm run build` verde (19 páginas) + script Node varrendo o
  `dist/`: 18 páginas com `BreadcrumbList`, JSON-LD parseia em todas,
  **zero `@id` duplicado** em qualquer `@graph`. (`/auth` e `/setup` são
  redirects sem JSON-LD; home sem breadcrumb, correto.)
- `[PLACEHOLDER_*]` de `schema.ts` intocados; working tree do SplitJud limpo
  após push.

## Next step
**Tarefa 18** do `macro_plan.md` (Semana 4, `[low]`, repo SplitJud em
`C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud`, só `apps/site`):
**RSS + descoberta.** Passos:
1. Pré-check: `git -C "...\splitjud" status` — `main` limpo obrigatório;
   sujo/outra branch → `status: blocked`.
2. Criar `/rss.xml` como endpoint `.ts` em `apps/site/src/pages/rss.xml.ts`,
   gerando XML na mão a partir da content collection `blog`
   (`getCollection('blog')`, filtrar `publishedAt !== null`, ordenar por data
   desc) — mesma fonte do `llms.txt`. Sem dependência nova (padrão da tarefa 7
   deste plano, já feita nos sites deste repo — ver `site/src/pages/rss.xml.ts`
   como referência de formato).
3. `<link rel="alternate" type="application/rss+xml" href="/rss.xml">` no
   `<head>` de `apps/site/src/layouts/BaseLayout.astro`.
4. Conferir `public/llms.txt`: glossário e os 3 artigos novos já estão
   (tarefas 15–16); adicionar referência ao `/rss.xml`. Sitemap é automático
   (@astrojs/sitemap). Conferir interlink glossário ↔ artigos ↔ calculadora ↔
   home (tarefas 15–16 já interlinkaram; só verificar, não refazer).
5. `npm run build` verde; commit + **push manual**
   (`git -C "...\splitjud" push origin main`).
6. Atualizar este arquivo aqui neste repo (iteration 19, next_effort medium —
   tarefa 19 é `[medium]`) e commitar aqui. NÃO tocar `apps/app`, `prisma/`,
   `.env*`, `[PLACEHOLDER_*]`. URLs SplitJud SEM barra final.
