---
status: in_progress
next_effort: medium
iteration: 10
updated_at: 2026-07-05T12:45:00.000Z
---

## Last completed
Tarefa 11 (Semana 3, `[plan]`): **2 artigos AEO no blog do `/site`** —
**parcialmente pulado (já existiam)** + complemento do que faltava.

- Os dois artigos pedidos JÁ EXISTIAM no blog (`site/src/content/blog/`):
  - (a) → `growth-partner-vs-agencia-revestimentos.md` (pubDate 2026-06-29);
  - (b) → `exclusividade-de-cadeira-uma-loja-por-nicho-goiania.md` (2026-07-01).
  Ambos já com BLUF, FAQ (5 perguntas), tabela e interlink. NÃO recriados
  (duplicar conteúdo seria pior para SEO).
- O que a tarefa pedia e FALTAVA foi adicionado aos dois:
  - Artigo (a): nova seção "A conta real: quanto custa cada modelo por mês?"
    com a fórmula do simulador (`fee = ticket × pedidos × pct`, exemplo
    450 × 40 × 10% → receita 18.000 / fee 1.800 / líquido 16.200) em tabela
    comparativa vs agência; CTA para `/simulador/` e `/#candidatar` no fecho.
  - Artigo (b): parágrafo final com CTA para `/simulador/` e `/#candidatar`.
  - `updatedDate: 2026-07-05` no frontmatter dos dois (layout `Article.astro`
    já emite `dateModified` no schema + "Atualizado em" visível).
  - Barra final adicionada nos interlinks `/blog/...` que faltavam nos dois
    arquivos (gotcha nginx).
- Sem página nova → sitemap/llms.txt/busca inalterados (artigos já
  registrados). `npx astro build` em `site/` verde (11 páginas).

## Next step
Tarefa 12 do `macro_plan.md` (Semana 3, `[build]`): **Página `/modelo/` no
`/site`** (site institucional B2B, `site/`, Astro).

- PRIMEIRO verificar o que a home (`site/src/pages/index.astro`) já explica
  sobre o modelo (gates, success fee, exclusividade, papel do parceiro):
  - Se só existe resumido → criar página própria aprofundada em `/modelo/`
    com FAQPage + HowTo (etapas da candidatura ao contrato), linkada do
    menu/footer (`Header.astro`/`Footer.astro`) e dos 2 artigos da tarefa 11
    (`growth-partner-vs-agencia-revestimentos.md` e
    `exclusividade-de-cadeira-uma-loja-por-nicho-goiania.md`).
  - Se a home já cobre em profundidade → pular ("pulado, já existia") e
    registrar aqui.
- Página nova em Astro = registrar em sitemap (`sitemap.xml.ts`), `llms.txt`
  (`llms.txt.ts`) e busca interna do `/site` se houver, seguindo o padrão
  existente. Conferir se sitemap/llms são dinâmicos (podem já pegar a rota).
- Schema: não duplicar entidade que o `@graph` do layout já emite.
- URLs sempre com barra final. Push = deploy: `npx astro build` verde dentro
  de `site/` antes de commitar.
