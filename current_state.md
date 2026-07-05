---
status: in_progress
next_effort: medium
iteration: 16
updated_at: 2026-07-05T19:10:53.000Z
---

## Last completed
**Tarefa 16 (Semana 4, `[build]`, SplitJud) concluída.** Recência nos 3 artigos
antigos de `apps/site/src/content/blog/`. Pré-check ok (`main` limpo). O git
log confirmou 2026-06-28 como data real do primeiro commit dos 3 arquivos —
`publishedAt` já estava correto, não mudou.

Feito (commit `62a9f22` pushado em `github.com/JeanZorzetti/splitjud` main):
- `updatedAt: 2026-07-05` no frontmatter dos 3 artigos antigos
  (divisao-de-honorarios-advocaticios, contrato-de-parceria-entre-advogados,
  honorarios-sucumbencia-vs-contratuais), justificado por retoque real:
  interlinks novos de cada um para os 3 artigos do F3 (tarefa 15).
- `blog/[slug].astro`: exibe "Atualizado em <data>" quando `updatedAt` existe;
  schema já emitia `dateModified` via `updatedAt ?? publishedAt` (verificado
  no HTML: `dateModified: 2026-07-05`).
- Bugfix bônus: datas visíveis renderizavam 1 dia a menos (meia-noite UTC
  formatada no fuso local UTC-3) — adicionado `timeZone: 'UTC'` nos 4
  `toLocaleDateString` de `blog/[slug].astro`, `blog/categoria/[slug].astro`
  e `blog/index.astro`. Verificado: "28 de junho" e "05 de julho" corretos.
- `npm run build` verde (14 páginas).

## Next step
Executar a **tarefa 17 do macro_plan.md** (`[plan]`, SplitJud): **calculadora
pública de divisão de honorários** em `apps/site` (ex. `/calculadora/`).

1. Repo: `C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud` (confirmar `main`
   limpo antes; sujo → `status: blocked`).
2. Página client-side: advogado informa o valor recebido e os percentuais dos
   envolvidos e vê a divisão calculada. Replicar SÓ a matemática — LER o código
   de rateio em `apps/app` para conferir a fórmula, mas NÃO importar nem
   modificar nada de lá.
3. Padrão AEO: BLUF, FAQPage no `@graph` (sem duplicar entidades do grafo
   único de `apps/site/src/lib/schema.ts`; não tocar nos `[PLACEHOLDER_*]`),
   CTA para o app (https://app.splitjud.com.br/auth). Referência de UX: a
   calculadora do site-goiania (lead magnet AEO).
4. Registrar a página nova em sitemap (é automático via @astrojs/sitemap) e no
   `llms.txt` se existir em `apps/site/public/`; interlink pesado fica para a
   tarefa 18, mas linkar a calculadora dos lugares óbvios já ajuda.
5. Restrições: só `apps/site` e `docs/`; nada de `apps/app`, `prisma/`,
   `.env*`. `npm run build` verde em `apps/site` antes de commitar; push
   manual (`git -C "...\splitjud" push origin main`). `current_state.md`
   continua neste repo (ROI Labs).
