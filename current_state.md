---
status: in_progress
next_effort: medium
iteration: 11
updated_at: 2026-07-06T13:35:00.000Z
---

## Last completed
Tarefa 11 (Semana 2, Macro plan 3): **Auditoria schema + breadcrumb** no
site-goiania. Script throwaway (`audit-schema.mjs`, deletado após uso) varreu
as 98 páginas do dist: JSON.parse de todo `<script type="application/ld+json">`,
presença de `BreadcrumbList` e duplicatas de `@id`/`@type` no `@graph`.
Resultado:
- **0 erros de parse e 0 entidades duplicadas** em todo o site.
- Guias (11), hub `/guia/`, `/glossario/`, `/comparar/`, `/calculadora/`,
  `/sobre/` e páginas de produto/malha já tinham `BreadcrumbList` coerente.
- **4 páginas corrigidas** (jsonLdNodes com `BreadcrumbList` via Base, padrão
  do `sobre.astro`): `/inspire-se/` (Início → Inspire-se),
  `/inspire-se/sala/` e `/inspire-se/area-externa/` (3 níveis, via
  `[ambiente].astro`), `/devolucoes/` (indexada e sem breadcrumb).
- Sem breadcrumb de propósito, não corrigidas: home (não precisa),
  `/favoritos/`, `/orcamento/`, `/pedido/` (noindex — schema seria peso
  morto), `/carrinho/` e `/obrigado/` (transacionais, fora do escopo da
  tarefa).
`astro build` verde (98 páginas), atributos confirmados no dist.

## Next step
Tarefa 12 do `macro_plan.md` (Semana 3, `[medium]`): **2 artigos B2B novos no
blog do `/site`** (Astro institucional da ROI Labs, pasta `site/`). Antes de
escrever, conferir os 6 slugs existentes da content collection do blog
(aparecer-chatgpt-perplexity, exclusividade-de-cadeira,
growth-partner-vs-agencia, o-que-e-pseo, quanto-custa-google,
vender-porcelanato-internet) para não repetir ângulo. Criar:
(a) **"Google Shopping para loja de material de construção"** — experiência
real do polo (feed.xml de 30 itens, Merchant Center, exigências do Google:
imagem própria, política de devolução, frete), sem inventar métricas;
(b) **"E-commerce próprio vs entrar num polo pronto: a conta real"** —
CAPEX/OPEX de montar sozinho vs pago-pelo-sucesso, usando a fórmula do
success fee que o `/simulador` do próprio site já replica (ler o simulador
para reusar a fórmula).
Padrão dos artigos existentes: BLUF, FAQPage, `datePublished`/data visível,
CTA para `/simulador` e candidatura, interlink com `/modelo/` e
`/polo-goiania/`. Artigo novo entra automaticamente no llms.txt/sitemap via
content collection (conferir). Rodar `astro build` do `/site` verde antes de
commitar (push deploya direto). Lembrete: `npm install`/`tsc` locais
não-confiáveis (OneDrive, errno -4094); `astro build` funciona.
