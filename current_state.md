---
status: in_progress
next_effort: medium
iteration: 15
updated_at: 2026-07-05T19:15:00.000Z
---

## Last completed
**Tarefa 15 (Semana 4, `[plan]`, SplitJud) concluída.** Pré-check da Mecânica
cross-repo passou (`main` limpo em `..\splitjud`). Escritos os 3 artigos GEO
restantes do cluster F3 em `apps/site/src/content/blog/`:

- `tabela-de-honorarios-oab.md` (categoria honorarios)
- `gestao-financeira-escritorio-de-advocacia.md` (categoria gestao-juridica)
- `repasse-de-honorarios-correspondentes.md` (categoria honorarios)

Mesmo padrão dos 3 existentes: BLUF, H2 em formato de pergunta, tabelas,
interlinks (entre si + para os 3 artigos antigos + /funcionalidades), CTA
SplitJud com preços reais (R$ 47/mês, anual 10x R$ 19,70). `publishedAt:
2026-07-05` no frontmatter — o template `blog/[slug].astro` já emite a data
visível (`<time>`) e `datePublished`/`dateModified` no `Article` do `@graph`,
verificado no HTML gerado. `npm run build` verde (14 páginas), 3 URLs novas no
sitemap automático. Commit `98caf14` pushado manualmente em
`github.com/JeanZorzetti/splitjud` (main).

Nota: nenhum template foi alterado — o schema/data já eram suportados; os
artigos antigos continuam sem retoque (recência deles é a tarefa 16).

## Next step
Executar a **tarefa 16 do macro_plan.md** (`[build]`, SplitJud): **recência nos
3 artigos antigos**.

1. Repo: `C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud` (confirmar `main`
   limpo antes; sujo → `status: blocked`).
2. Arquivos: `apps/site/src/content/blog/divisao-de-honorarios-advocaticios.md`,
   `contrato-de-parceria-entre-advogados.md`,
   `honorarios-sucumbencia-vs-contratuais.md`. Todos têm
   `publishedAt: 2026-06-28` no frontmatter — conferir com
   `git log --follow --format=%as -- <arquivo>` a data real do primeiro commit
   e usar essa como `publishedAt` (datePublished).
3. O schema do content (`content.config.ts`) já tem `updatedAt` opcional, e o
   template `blog/[slug].astro` já usa `updatedAt ?? publishedAt` como
   `dateModified` no schema. Adicionar `updatedAt` (hoje) SÓ se houver retoque
   real no conteúdo; a data visível na página hoje mostra apenas publishedAt —
   avaliar exibir "Atualizado em" quando `updatedAt` existir (mudança pequena
   no `[slug].astro`).
4. Restrições: só `apps/site` e `docs/`; não tocar em `apps/app`, `prisma/`,
   `.env*`, nem nos `[PLACEHOLDER_*]` de `apps/site/src/lib/schema.ts`.
5. `npm run build` em `apps/site` verde antes de commitar; push manual
   (`git -C "...\splitjud" push origin main`). `current_state.md` continua
   neste repo (ROI Labs).
