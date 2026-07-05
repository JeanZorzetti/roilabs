---
status: in_progress
next_effort: medium
iteration: 7
updated_at: 2026-07-05T12:35:00.000Z
---

## Last completed
Tarefa 7 (Semana 2, `[build]`): **Favoritos ↔ comparador** no `site-goiania`.
- `src/pages/favoritos.astro` — botão "Comparar favoritos lado a lado"
  (`.fav-cmp`) nas ações da página: aparece com ≥2 favoritos e monta o
  deep-link `/comparar/?p=slug1,slug2,slug3` com os 3 primeiros (o comparador
  aceita 2–3). Parte deste diff já estava no working tree de iteração anterior
  (não commitado); verificado e mantido.
- `src/pages/comparar.astro` — botão de favoritar por coluna (`.cmp__fav`,
  "♡ Favoritar" / "♥ Favoritado", `aria-pressed`) na linha de links da tabela,
  usando a mesma lib `src/lib/favoritos.ts` do FavToggle (mesmo localStorage
  `roi_fav_v1`). Sync via `FAV_EVENT` + `storage`; clique delegado no
  `.cmp__table-wrap`; track `comparador_favorito`. Estilo em `<style is:global>`
  porque a tabela é DOM criado por JS (gotcha dos scoped styles).
- Verificação: `astro build` verde (93 páginas);
  `node src/scripts/check-feed.mjs` OK (30 itens); `.fav-cmp` presente em
  `dist/favoritos/index.html`, `.cmp__fav` no CSS e `cmpFav` no bundle JS do
  comparar. Páginas não são novas → sitemap/llms.txt/busca inalterados.
- Observação p/ tarefa 8 (mantida): a `/calculadora` já tem botão
  "+ Adicionar ambiente" — verificar se multi-ambiente já existe antes de
  construir.

## Next step
Tarefa 8 do `macro_plan.md` (Semana 2, `[build]`): **Calculadora
multi-ambiente** no `site-goiania`.
- Objetivo: permitir somar cômodos (ex.: sala 35m² + cozinha 12m²) antes do
  cálculo de caixas/rejunte/argamassa, client-side.
- **Verificar ANTES**: `src/pages/calculadora.astro` — iterações anteriores
  observaram que já existe um botão "+ Adicionar ambiente"; se o
  multi-ambiente já estiver completo e funcional, registrar "pulado (já
  existia)" e ir para a tarefa 9 (Vistos recentemente via localStorage).
- Manter compatibilidade com o pré-preenchimento
  `?m2caixa=&produto=&nome=` e com o fluxo de lead existente
  (POST `/api/leads-consumidor`, mesmo padrão do comparador).
- Conferir a matemática com 2–3 casos manuais (m² total → caixas por
  m²/caixa com folga, rejunte, argamassa).
- Gotcha: DOM criado por JS não recebe scoped styles → `<style is:global>`.
- `astro build` verde + `node src/scripts/check-feed.mjs` antes de commitar
  (push = deploy em produção). Página não é nova → sitemap/llms/busca não
  mudam.
