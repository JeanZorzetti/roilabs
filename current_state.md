---
status: in_progress
next_effort: medium
iteration: 11
updated_at: 2026-07-05T12:50:00.000Z
---

## Last completed
Tarefa 12 (Semana 3, `[build]`): **Página `/modelo/` no `/site`** — criada
(a home só explica o modelo em resumo: hero, 3 fases, gates, FAQ curto; não
havia HowTo nem aprofundamento — logo, a página se justificava).

- Novo `site/src/pages/modelo.astro`: BLUF + 4 seções (3 gates aprofundados,
  success fee com a fórmula pública e exemplo 450×40×10% em `readout`,
  exclusividade/papéis nas colunas `fit`, HowTo visual de 6 etapas da
  candidatura ao contrato) + FAQ com 7 perguntas NOVAS (não duplica as da
  home: % do fee, propriedade do site, canais atuais, repasse do dinheiro,
  SLA na prática, saída sem resultado, prazo até contrato).
- Schema via `jsonLdNodes` do `Base`: `WebPage` + `FAQPage` (7 Q&A) +
  `HowTo` (6 steps) + nó `Service` `#service` (mesmo `@id` da home, emitido
  1× — verificado no dist que não há duplicata no @graph).
- Descoberta: `/modelo/` adicionada em `sitemap.xml.ts` e `llms.txt.ts`
  (não são 100% dinâmicos para páginas .astro — entradas estáticas).
- Links: Header (nav "Modelo" no lugar de "/#mecanica" — a página cobre a
  mecânica em profundidade), Footer ("Como funciona o modelo"), e CTA final
  dos 2 artigos da tarefa 11 agora linkam `/modelo/`.
- CSS: reuso das classes globais (section/steps/fit/faq/readout); único
  bloco novo é `.howto*` scoped no próprio modelo.astro. URLs com barra
  final. `npx astro build` verde (12 páginas, `/modelo/index.html` gerado).

## Next step
Tarefa 13 do `macro_plan.md` (Semana 3, `[build]`): **Case vivo do Polo 1 no
`/site`** — página "Polo Goiânia — porcelanato" mostrando o que a cadeira
ocupada recebe, com FATOS verificáveis no repo, **sem inventar métricas de
venda/tráfego**.

- Fatos a levantar no próprio repo antes de escrever: nº de páginas da
  malha/guias no build do `site-goiania` (rodar `npx astro build` lá e
  contar), catálogo de 30 produtos (`site-goiania/src/data/produtos*`),
  calculadora (`/calculadora/`), comparador (`/comparar/`), feed Merchant
  Center (script `check-feed`), favoritos, galeria Inspire-se, glossário,
  guias — citar só o que existir de verdade.
- Página nova em `site/src/pages/` (ex. `polo-goiania.astro` →
  `/polo-goiania/`), padrão da `/modelo/` recém-criada: classes globais,
  `jsonLdNodes` sem duplicar entidades do `@graph` do `Base`
  (Organization/WebSite; nó `Service #service` já é emitido por home e
  `/modelo/` — se usar, mesmo `@id`).
- CTA duplo: candidatura (`/#candidatar`) + simulador (`/simulador/`).
- Linkar dos 2 artigos da tarefa 11 e do Footer
  (`site/src/components/Footer.astro` — hoje o link "Polo 1 no ar" aponta
  direto para goiania.roilabs.com.br; avaliar apontar para a página nova).
- Registrar em `sitemap.xml.ts` e `llms.txt.ts` (entradas estáticas, como
  feito para `/modelo/`). URLs sempre com barra final. `npx astro build`
  verde em `site/` antes de commitar (push = deploy).
