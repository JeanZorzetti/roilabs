---
status: in_progress
next_effort: medium
iteration: 12
updated_at: 2026-07-05T12:50:00.000Z
---

## Last completed
Tarefa 13 (Semana 3, `[build]`): **Case vivo do Polo 1 no `/site`** — página
`/polo-goiania/` criada. (Uma iteração anterior interrompida deixou o arquivo
com um `</invoke>` órfão no final — corrigido e concluído.)

- `site/src/pages/polo-goiania.astro`: BLUF + `readout` com 4 números
  VERIFICADOS no build real do site-goiania de hoje (93 páginas totais,
  40 páginas de intenção na malha /porcelanato/ [41 − hub], 30 produtos de
  3 marcas Biancogres/Delta/Savane, 7 guias) + grid de 8 ativos clicáveis
  (malha, catálogo, feed Merchant Center, calculadora, comparador/favoritos,
  guias + glossário de 20 termos, Inspire-se, descoberta) + CTA duplo
  (`/#candidatar` + `/simulador/`). Zero métrica de venda/tráfego.
- Schema `jsonLdNodes`: `WebPage` + nó `Service` com o MESMO
  `@id` `https://roilabs.com.br/#service` que home/modelo (verificado no
  dist: 1 só `@type: Service` no @graph da página).
- Descoberta: entradas estáticas em `sitemap.xml.ts` e `llms.txt.ts`
  (confirmadas no dist).
- Links: Footer ("Polo 1 no ar" agora aponta `/polo-goiania/` em vez do
  domínio do polo direto) + CTA final dos 2 artigos da tarefa 11
  (`exclusividade-de-cadeira-...` e `growth-partner-vs-agencia-...`).
- CSS: classes globais + único bloco novo `.ativos/.ativo*` scoped.
- `npx astro build` verde em `site/` (13 páginas) e em `site-goiania/`
  (93 páginas, rodado para verificar os números citados).

## Next step
Tarefa 14 do `macro_plan.md` (Semana 3, `[build]`): **Refresh de descoberta
nos 2 sites.** Conferir que TUDO das semanas 1–3 está em sitemap, `llms.txt`
e busca interna; rodar os builds e confirmar que `check-feed` continua
passando e que o IndexNow postbuild lista as URLs novas. Corrigir o que faltar.

- Semanas 1–2 (site-goiania): glossário `/glossario/`, guias novos
  (`/guia/porcelanato-area-externa/`, `/guia/rejunte-porcelanato/`,
  `/guia/porcelanato-liquido-vs-porcelanato/`), sub-páginas Inspire-se
  (`/inspire-se/*` — verificar quais existem em `src/pages/inspire-se/`),
  filtros do hub (sem página nova), `/favoritos/`, calculadora
  multi-ambiente (sem página nova). Conferir em
  `site-goiania/src/pages/sitemap.xml.ts`, `llms.txt.ts` e
  `busca-index.json.ts` que todas as páginas novas aparecem.
- Semana 3 (site): `/modelo/` e `/polo-goiania/` já registrados em
  sitemap + llms.txt (feito nas tarefas 12–13); conferir de novo no dist
  mesmo assim.
- `check-feed`: procurar o script em `site-goiania/` (`package.json` /
  `scripts/check-feed.mjs`) e rodá-lo; verificar que imagens estão no
  domínio próprio.
- IndexNow: rodar o build e verificar que o postbuild lista as URLs novas
  (não postar manualmente se depender de secret — só conferir o que o
  build já faz sozinho).
- Builds: `npx astro build` verde nos 2 sites antes de commitar
  (push = deploy). URLs sempre com barra final.
