---
status: in_progress
next_effort: low
iteration: 13
updated_at: 2026-07-06T13:42:00.000Z
---

## Last completed
Tarefa 13 (Semana 3, Macro plan 3): **Refresh do case `/polo-goiania/` e da
`/modelo/`** no `/site`. Fatos reconferidos no repo/build do site-goiania
(astro build de hoje: **98 páginas**; `porcelanato.ts`: 41 slugs de malha;
`porcelanatos.json`: 30 produtos de 3 marcas; `guias.ts`: 11 guias + hub
`/guia/`; glossário: 19 termos por id; `rss.xml.ts` existe):
- `polo-goiania.astro`: números 93→98 páginas, 40→41 malha, 7→11 guias
  (card agora aponta para o hub `/guia/` e cita assentar/limpar/erros/
  vinílico), glossário corrigido 20→19 termos (estava errado), card de
  descoberta cita o RSS novo, meta description 93→98, "build de hoje"→
  "build de jul/2026", `dateModified: 2026-07-06` no WebPage do @graph.
- `modelo.astro`: sem número velho (só "centenas de páginas", ok);
  adicionado `dateModified: 2026-07-06` no WebPage.
`astro build` do `/site` verde (15 páginas). Nenhuma métrica inventada.

## Next step
Tarefa 14 do `macro_plan.md` (Semana 3, `[low]`): **Refresh de descoberta nos
2 sites.** Conferir que TUDO das semanas 1–3 está em: sitemap, `llms.txt`,
busca interna (`busca-index.json.ts`, só goiânia) e RSS novo (`rss.xml.ts`
nos dois sites). Itens das semanas 1–3: 4 guias novos (como-limpar,
como-assentar, erros-ao-comprar, piso-vinilico-vs-porcelanato), hub `/guia/`,
2 artigos B2B do `/site` (google-shopping-loja-material-construcao,
ecommerce-proprio-vs-polo-pronto). Rodar `astro build` em `site/` e
`site-goiania/` e confirmar no `dist/`: `check-feed` continua passando
(imagens no domínio próprio) e o postbuild IndexNow lista as URLs novas.
Corrigir o que faltar e commitar com build verde (push deploya direto).
Lembrete: `npm install`/`tsc` locais não-confiáveis (OneDrive, errno -4094);
`astro build` funciona.
