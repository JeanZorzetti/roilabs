---
status: in_progress
next_effort: high
iteration: 13
updated_at: 2026-07-05T12:48:00.000Z
---

## Last completed
Tarefa 14 (Semana 3, `[build]`): **Refresh de descoberta nos 2 sites** —
auditoria, quase tudo já estava em paridade porque sitemap/llms.txt/busca-index
são gerados das mesmas fontes de dados (`guias.ts`, `ambientes.ts`,
`porcelanato.ts`, `produtos.ts`).

- **site-goiania**: confirmado no dist que glossário, os 3 guias novos
  (`porcelanato-area-externa`, `rejunte-porcelanato`,
  `porcelanato-liquido-vs-porcelanato`) e as sub-páginas Inspire-se
  (`/inspire-se/sala/`, `/inspire-se/area-externa/`) aparecem em
  `sitemap.xml`, `llms.txt` e `busca-index.json` (83 entradas). Única
  correção: llms.txt dizia "19 termos técnicos" no glossário — são 20
  (contados os `id:` em `glossario.astro`), corrigido em `llms.txt.ts`.
- **site**: `/modelo/` e `/polo-goiania/` confirmados no dist em
  `sitemap.xml` e `llms.txt` (já registrados nas tarefas 12–13).
- **Builds verdes**: `npm run build` no site-goiania (93 páginas, prebuild
  check-matrix OK) e `npx astro build` no site (13 páginas).
- **check-feed**: OK — 30 itens em `dist/feed.xml`, imagens no domínio próprio.
- **IndexNow**: postbuild listou as 88 URLs do sitemap (incluindo as novas),
  mas a API respondeu **HTTP 403** mesmo com o key file válido e servido em
  produção (curl 200, conteúdo bate). Provável rate-limit/bloqueio da API para
  pings repetidos desta origem local; o script é não-fatal por design e roda
  de novo no build de deploy. Observação, não bloqueio — nada a corrigir no
  repo.

## Next step
Tarefa 15 do `macro_plan.md` (Semana 4, `[plan]`): **3 artigos GEO restantes
do F3 no SplitJud** — repo DIFERENTE em
`C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud` (monorepo; trabalhar SÓ em
`apps/site` e `docs/`).

Antes de qualquer coisa (Mecânica cross-repo do macro_plan.md):
1. `git -C "...\splitjud" status` — precisa estar em `main` com working tree
   limpo; sujo/outra branch → `status: blocked`, não arrumar sozinho.
2. Ler `docs/GEO-HANDOFF.md` e `docs/PLANO-MACRO-GEO.md` no SplitJud.

A tarefa: escrever os 3 artigos que faltam do cluster F3 — (a) tabela de
honorários OAB, (b) gestão financeira de escritório de advocacia, (c) repasse
de honorários entre correspondentes — no mesmo padrão dos 3 existentes (BLUF,
FAQ, interlink), **com `datePublished` visível na página e no schema desde
já**. Não tocar em `apps/app`, `prisma/`, `.env*`, nem nos `[PLACEHOLDER_*]`
de `apps/site/src/lib/schema.ts`. `npm run build` em `apps/site` deve passar
antes de commitar. Push do SplitJud é manual
(`git -C "...\splitjud" push origin main`); o `current_state.md` continua
aqui neste repo e é commitado aqui.
