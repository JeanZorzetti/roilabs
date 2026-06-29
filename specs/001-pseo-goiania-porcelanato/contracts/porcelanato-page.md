# Contract — Página pSEO `porcelanato/[slug]` (UI/conteúdo)

Template único renderizado por `getStaticPaths` sobre `src/data/porcelanato.ts`. Contrato = seções obrigatórias + dados estruturados.

## Seções obrigatórias (ordem)

1. **Header** (reuso `/site`) + breadcrumb (`Goiânia › Porcelanato › {tipo/ocasião}`).
2. **H1 + intro** local (`titulo`, `intro`).
3. **Características técnicas** — tabela de `atributos` (PEI, acabamento, antiderrapante, dimensão, m²/caixa, ambiente). (FR-004)
4. **Ambientes ideais / ocasião** — quando/onde usar.
5. **Como escolher** — bullets `comoEscolher` (E-E-A-T). (FR-003)
6. **FAQ** — `faq[]` (acordeão ou lista). (FR-005)
7. **CTAs de conversão** — `WhatsappCta` (primário, `wa.me?text=` com `termoAlvo`+bairro) **e** `LeadForm` (`produto`/`pagina` pré-preenchidos). (FR-006)
8. **Relacionados** — links internos para `relacionados` (silo). (FR-007)
9. **Footer** (reuso `/site`).

## `<head>` / SEO

- `<title>` = `titulo`; meta description derivada da `intro`.
- `<link rel="canonical">` = `https://goiania.roilabs.com.br/porcelanato/{slug}`.
- Conteúdo principal **presente sem JS** (FR-010) — Astro estático por padrão.
- Tag de analytics (GA4, ID via env de build) no `Base.astro`.

## JSON-LD (FR-005, AEO)

- `Product` — nome=`termoAlvo`, atributos de `atributos`.
- `FAQPage` — de `faq[]`.
- `BreadcrumbList` — a trilha.
- Hub (`index.astro`): `Organization` + `LocalBusiness` (Goiânia).

## Estado "sem catálogo" (FR-009)

Sem produtos/preços/estoque fabricados. As mesmas URLs ganham listagem real depois sem quebrar (o template aceita um bloco de produtos opcional, vazio na v1).

## Geração / sitemap

- `getStaticPaths` → 1 página por entrada da matriz.
- `sitemap.xml.ts` lista hub + `porcelanato/index` + todos os slugs (espelha o `sitemap.xml.ts` do `/site`).
- Self-check de build falha se algum `slug` repetir ou `volume <= 0`.
