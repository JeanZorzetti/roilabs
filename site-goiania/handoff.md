# Handoff — site-goiania

## 2026-07-02 — Feature 009: feed Google Merchant Center (free listings)

### Feito

- `src/pages/feed.xml.ts`: feed RSS 2.0 + namespace `g:` com os 30 produtos do catálogo (contrato: `specs/009-merchant-center-feed/contracts/feed-xml.md`). Gerado no build, servido estático pelo nginx em `/feed.xml`.
- Paridade página↔feed por construção: `tituloProduto()`, `descricaoProduto()` e `elegivelParaFeed()` extraídos para `src/data/produtos.ts`; a página de produto (`porcelanato/produto/[slug].astro`) e o feed consomem os mesmos helpers (política do Google: título/preço/imagem do feed = página).
- Gate pós-build `src/scripts/check-feed.mjs` (`postbuild` no package.json): valida `dist/feed.xml` (declaração XML, estrutura rss/channel, contagem = catálogo, campos obrigatórios por item, formato do preço, encoding sem mojibake/& cru) e derruba o build com produto inelegível (slug + campo).
- Doc ops `docs/merchant-center.md`: conta → verificação de domínio (via Search Console) → cadastro do feed com busca diária → free listings → diagnóstico + troubleshooting.
- `.dockerignore` criado (não existia; acelera build Docker).

### Evidência (Constituição II — local é smoke; prod pendente de deploy)

- `npm run build` verde: `check-feed OK — 30 itens em dist/feed.xml`; primeiro `<item>` conferido manualmente (acentos e "²" íntegros, todos os campos).
- Gate provado: `preco=0` no primeiro produto → build falha exit 1 apontando `porcelanato-20x120-carvalho-natural (preco=0)` (pego já no `check-matrix` prebuild; `check-feed` cobre a camada do artefato). Catálogo restaurado, build verde de novo.

### Decisões (research.md D1–D9)

- Preço = R$/m² (igual à página) + `unit_pricing_measure=1sqm`; fallback documentado = preço por caixa se a revisão do Google reprovar.
- Sem GTIN/MPN → `g:identifier_exists=no` + brand.
- `availability=in_stock` fixo (sem estoque em tempo real); sem frete nesta fase.
- Zero dependência nova; validação regex-level (`ponytail:` no script — parser XML real só se o feed ganhar estrutura dinâmica).
- Produto inelegível = ERRO de build (catálogo curado; corrigir na fonte), não omissão silenciosa.

### Próximos passos

1. **Redeploy do site-goiania na EasyPanel** (tem commit novo → cache busta) e verificar em prod: `curl https://goiania.roilabs.com.br/feed.xml` → 200 + 30 itens (T011).
2. **Ops (Jean)**: seguir `docs/merchant-center.md` — cadastrar o feed no Merchant Center, confirmar processamento sem erro estrutural e acompanhar aprovação ≥ 90% (T012 / SC-002-003).

### Gotchas

- Imagens do feed apontam pra CDN de terceiro (`jurunense.vteximg.com.br`) — se o Google reprovar por imagem não-rastreável, hospedar local (tabela de troubleshooting no doc ops).
- `g:id` = slug: mudar slug de produto reseta o histórico do item no Google — evitar renomear.
- `check-matrix` (prebuild) já valida preço/imagem na FONTE; `check-feed` (postbuild) valida o ARTEFATO — os dois gates são complementares, não redundantes.
