# Handoff — pSEO Regional Porcelanato Goiânia

**Data:** 2026-06-29 | **Status:** código completo, aguardando deploy

---

## O que foi entregue

### `site-goiania/` (app Astro novo)
- **Scaffold completo**: `astro.config.mjs`, `package.json` (com `prebuild` → check-matrix), `tsconfig.json`, `Dockerfile` (node build → nginx), `nginx.conf`, `.env.example`.
- **Design system**: cópia de `Base.astro` (GA4 via `PUBLIC_GA_ID`), `Header.astro`, `Footer.astro`, `global.css` do `/site` — com classes pSEO adicionais (`pseo-hero`, `attrs-table`, `guide-list`, `related-grid`, `wa-cta`, `consent-field`).
- **Matriz de dados**: `src/data/porcelanato.ts` — 30 entradas curadas com `slug` único, `volume > 0`, tipos × ocasiões × dimensões × intenções locais. Interface `PorcelanatoPage` completa.
- **Self-check**: `src/scripts/check-matrix.mjs` — assert slug único + volume > 0 + titulo + atributos + faq. Roda no `prebuild` e manualmente via `node src/scripts/check-matrix.mjs`.
- **Template pSEO**: `src/pages/porcelanato/[slug].astro` — `getStaticPaths` sobre a matriz. Seções: breadcrumb, H1+intro, características técnicas, ambientes/ocasião, como escolher, FAQ, CTAs (WhatsApp + form), relacionados.
- **Componentes**: `Faq.astro` (accordion nativo), `WhatsappCta.astro` (link wa.me com texto pré-preenchido), `LeadForm.astro` (form urlencoded com honeypot+LGPD), `Jsonld.astro` (utilitário `buildJsonLdNodes` — Product + FAQPage + BreadcrumbList).
- **Páginas**: `index.astro` (hub do polo), `porcelanato/index.astro` (silo — lista todas as 30 páginas), `obrigado.astro` (pós-form), `sitemap.xml.ts` (hub + silo + todos os slugs).
- **SEO**: `<title>`, meta description, canonical, og:image, twitter card em cada página. JSON-LD no `<head>` via `@graph` no Base.
- **robots.txt**: whitelist completa de crawlers IA (GPTBot, PerplexityBot, Claude-Web, etc.) + Sitemap.
- **Guia de autoria**: `src/data/README.md` — como adicionar 1 entrada nova.

### `app/` (extensão do backend existente)
- **Schema**: `LeadConsumidor` adicionado em `prisma/schema.prisma` (`@@map("leads_consumidor")`, `consentLGPD`, `status`, índice em status).
- **Rota**: `src/app/api/leads-consumidor/route.ts` — POST público (urlencoded, honeypot, consent obrigatório, 303) + GET admin protegido. Espelha `/api/candidaturas`.
- **Admin**: `src/app/admin/leads/page.tsx` — listagem de leads com nome, WhatsApp, produto, página, status, data.
- **Nav**: `nav.tsx` atualizado com link "Leads Goiânia".

---

## Decisões

- Design system por **cópia** (não pacote compartilhado) — extrair quando surgir o 2º polo.
- **Form cross-origin**: requisição simples urlencoded (sem preflight CORS) — `redirect` hidden → 303. Funciona sem header CORS no `/app`.
- **JSON-LD**: função `buildJsonLdNodes` em `Jsonld.astro` exportada, consumida pelo template — o `@graph` final é montado no `Base.astro` e emitido num único `<script type="application/ld+json">`.
- **Conteúdo**: PT-BR, rico, local (menciona Goiânia em todas as intros). Nenhuma página com volume 0.

---

## Próximos passos — Ops (T024)

> Verificação real = Docker/EasyPanel + navegador (Constituição II).

1. **DB**: rodar `prisma db push` manualmente de máquina que alcança `2.24.207.200:5443`.
   ```sh
   # no diretório app/
   DATABASE_URL="postgresql://..." npx prisma db push
   ```
   Confirma que a tabela `leads_consumidor` foi criada.

2. **EasyPanel — 3º app** (`site-goiania`):
   - Repo: `JeanZorzetti/roilabs`, build context: `site-goiania`
   - Dockerfile: `site-goiania/Dockerfile`
   - Domínio: `goiania.roilabs.com.br`
   - Envs: `PUBLIC_GA_ID`, `PUBLIC_WHATSAPP`, `PUBLIC_APP_URL=https://app.roilabs.com.br`

3. **DNS**: apontar `goiania.roilabs.com.br` para o IP do EasyPanel.

4. **EasyPanel — redeploy `/app`**: novo endpoint e schema.

5. **Verificações no navegador** (quickstart.md):
   - `https://goiania.roilabs.com.br/sitemap.xml` → lista ≥30 slugs
   - `/porcelanato/porcelanato-amadeirado` → H1 + atributos + FAQ sem JS (ver fonte)
   - JSON-LD válido no Rich Results Test
   - Form sem checkbox → bloqueado; com checkbox → 303 `/obrigado`; lead em `/admin/leads`
   - CTA WhatsApp → abre wa.me com texto pré-preenchido

6. **Search Console**: submeter `https://goiania.roilabs.com.br/sitemap.xml`.

---

## Gotchas

- `prebuild` roda `check-matrix.mjs` — qualquer entrada com `volume: 0` **quebra o build**.
- `prisma db push` deve ser feito **antes** do deploy do `/app` — o endpoint usa `prisma.leadConsumidor`.
- GA4 só aparece se `PUBLIC_GA_ID` estiver setado no EasyPanel — sem ele, o script não é emitido (condicional no Base.astro).
- O `redirect` hidden no formulário aponta para `{PUBLIC_APP_URL}/obrigado` — mas o 303 redireciona para `/obrigado` do **site-goiania**, não do app. Verifique que a URL no hidden input termina em `https://goiania.roilabs.com.br/obrigado`.

---

## Catálogo de produtos reais (update pós-mineração)

Silo agora tem **2 tipos de página**, cruzadas:
- **Categorias** (`/porcelanato/{slug}`) — 30 páginas SEO por keyword. Cada uma exibe galeria dos produtos reais que casam (match heurístico por tipo/acabamento/dimensão em `produtos.ts` → `tagsDoProduto`).
- **Produtos** (`/porcelanato/produto/{slug}`) — 30 SKUs reais minerados (`porcelanatos.json`), com imagem, marca, preço/m², dimensão, acabamento, `classe_ad` real, retificado, m²/caixa. JSON-LD `Product` + `Offer` (preço BRL).

**Dado honesto:** `pei` (que era inventado nas categorias) foi removido. A classe de abrasão (`classe_ad`) só aparece onde é real — nas páginas de produto, vinda do catálogo. Campo da interface renomeado `pei` → `classeAd`. Menções a "PEI" na prosa educativa foram mantidas (termo conhecido pelo consumidor, valor SEO).

**Gotchas catálogo:**
- `porcelanatos.json` fica na raiz do `site-goiania/` e é importado por `produtos.ts`. Re-minerar = sobrescrever o arquivo (slug único, ≥1 imagem, `preco > 0`).
- Imagens são **hotlink** do CDN da Jurunense (`jurunense.vteximg.com.br`). Se bloquearem referer, baixar para `public/` e trocar as URLs. <!-- ponytail: hotlink + preço estático; refresh por re-mineração -->
- Match categoria↔produto é heurístico — refinar `tagsDoProduto` se o casamento errar.

## Escala futura

- **Nova página**: adicionar 1 entrada em `src/data/porcelanato.ts` → build gera automaticamente a página, o sitemap e os links de relacionados.
- **Novo nicho** (ex: cerâmica): nova pasta `src/pages/ceramica/` + novo arquivo de dados `src/data/ceramica.ts` no mesmo `site-goiania`.
- **2º polo**: novo app Astro separado + extrair pacote `@roilabs/ui` nesse momento.
