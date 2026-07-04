# Handoff — site-goiania

## 2026-07-04 — Ciclo 11 item 5: acervo de ambiente — PARCIAL, handoff pra ciclo 12

> Objetivo do item: dar ao catálogo (30 produtos, média 1,1 foto/cada) fotos de ambiente decorado + vídeo. Ciclo 11 fechou com 6/30 — este handoff existe pra ciclo 12 ampliar sem repetir descoberta já feita.

### Feito

- `src/scripts/fetch-ambiente.mjs`: mapa curado manualmente (`AMBIENTE_POR_SLUG`, slug → URL oficial do fabricante), baixa a foto pra `public/img/ambientes/`, gera `.webp` ≤1200px, grava `imagensAmbiente[0]` no `porcelanatos.json`.
- 6 correspondências confirmadas (mesma coleção **e** mesma dimensão do produto, não aproximação): todas **Biancogres** — Marmo Perla (60x120), Arezzo Grigio (120x120), Arezzo Beige EXT (90x90), Arezzo Beige Satin (90x90), Chicago Grafite (80x80), Persia Beige (100x100).
- Renderização: seção "Veja em ambiente" em `ProdutoDetalhe.astro` + hero da malha (`[slug].astro`) usa a foto de ambiente no lugar da foto de produto quando existe.
- Vídeo: capacidade de renderizar (`<iframe>`) implementada, **nenhum vídeo atribuído** — ver "Vídeo" abaixo.

### Cobertura atual por marca (o que falta pro ciclo 12)

| Marca | Cobertos | Faltando |
|---|---|---|
| **SAVANE** | 0/8 | **Nunca pesquisado** — site oficial nem tinha sido identificado até este handoff. |
| **DELTA** | 0/4 | Pesquisado, sem correspondência exata encontrada (ver "Delta" abaixo). |
| **BIANCOGRES** | 6/18 | Pesquisa parcial — método funciona, só faltou tempo. |

Slugs pendentes (pra não repetir o levantamento):

**Biancogres (12 faltando):** `porcelanato-20x120-carvalho-natural` (20x120 Natural) · `porcelanato-cristallo-quartz-biancogres` (60x120 Velvet) · `porcelanato-legado-grigio-ac-biancogres` (20x120 Acetinado) · `porcelanato-bianco-luz-polido-biancogres` (60x120 Polido) · `porcelanato-120x120-tivoli-biancogres` (120x120 Strutturato) · `porcelanato-grigio-externo-biancogres` (100x100 Externo) · `porcelanato-pulpis-grigio-ac-100x100cm-biancogres` (100x100 Mate) · `porcelanato-chicago-nebbia-biancogres` (100x100 Acetinado) · `porcelanato-chigaco-grigio-biancogres` (100x100 Acetinado) · `porcelanato-100x100-lux-biancogres` (100x100 Polido) · `porcelanato-grigio-externo-90x90` (90x90 Rústico) · `porcelanato-castilla-noce-biancogres` (80x80 Externo).

**Delta (4 faltando):** `porcelanato-madrid-bloc-polido-delta` (72x72 Polido) · `porcelanato-nero-polido-delta` (60x120 Polido) · `porcelanato-avorio-polido-delta` (62x62 Polido) · `porcelanato-72x72cm-nero-polido` (72x72 Polido).

**Savane (8 faltando, todos):** `porcelanato-56x113cm-strato-marmo-bege` · `porcelanato-56x113cm-strato-marmo-grigio` · `porcelanato-90x90cm-urban-branco-polido` · `porcelanato-91x91cm-perla-acetinado` · `porcelanato-56x113cm-pietra-di-matera-natural` · `porcelanato-56x113cm-pietra-di-trulli-natural` · `porcelanato-terrazine-91x91cm-savane` · `porcelanato-rock-face-matera-savane`.

### Método que funcionou (repetir no ciclo 12)

- **Biancogres**: página de produto vive em `biancogres.com.br/pt_BR/produto/<slug-do-modelo>`. A listagem `/pt_BR/produtos` **pagina e não mostra o catálogo todo** — não perder tempo navegando ali. O que funciona: busca Google `site:biancogres.com.br "<nome do modelo>"` (ex.: `"legado grigio"`, `"pulpis grigio"`) pra achar a URL direto, depois abrir a página e procurar imagens com `ambiente-` no nome do arquivo (`media/<id>/conversions/ambiente-...-thumb_480p.jpg`) — as sem esse prefixo são close-up de textura, não servem. **Conferir a dimensão no nome do arquivo ou na ficha técnica da página antes de usar** — a mesma coleção pode ter várias fotos de ambiente, uma por tamanho.
- **Delta**: catálogo real é `deltaceramica.com.br` (⚠️ **não** `deltaporcelanatonova.com.br` — esse é de um revendedor específico com catálogo bem menor e desatualizado). Produto individual em `deltaceramica.com.br/produto-in.php?id=N`; achar o `id` via `site:deltaceramica.com.br "<nome do modelo>"`. **Problema real**: a maioria dos produtos Delta pesquisados só tem foto de textura + 1 imagem de "simulador" (`files/simulator/`), que é uma renderização genérica, não uma foto de ambiente real — não vale usar como "veja em ambiente" (seria enganoso). Cobertura Delta pode ficar em 0% mesmo com busca completa; não é falha de método.
- **Savane**: site oficial é `savane.com.br/produtos` — achado agora, mas a estrutura de produto/imagens ainda não foi explorada. Primeiro passo do ciclo 12.

### Próximos passos (ciclo 12, em ordem de retorno)

1. **Savane primeiro** (0/8, zero esforço já investido) — mapear a estrutura de `savane.com.br/produtos`, repetir o método de busca por nome de modelo.
2. **Completar Biancogres** (12 faltando, método já validado — é só tempo): repetir `site:biancogres.com.br "<modelo>"` pros 12 slugs da lista acima.
3. **Delta**: 1–2 tentativas adicionais por nome exato; se não achar, aceitar 0% de cobertura pra essa marca (documentado, não é buraco silencioso).
4. **2ª foto por produto (textura, não ambiente)**: as próprias páginas da Biancogres já expõem várias fotos de close-up por modelo (`f02`, `f03`... no nome do arquivo) que ciclo 11 viu mas não usou (o item 5 só filtrou "ambiente"). Reaproveitar essas listas já levantadas pra popular `imagens[1]`, `imagens[2]` sem nova busca — ganho rápido.
5. **Vídeo por SKU**: nenhum encontrado ainda. O que existe é vídeo genérico de marca no YouTube (ex.: "PORCELANATO #BIANCOGRES POLIDO E ACETINADO 90X90") — não é do produto específico. Decisão de escopo do Jean: usar vídeo genérico rotulado como "sobre esta linha" (transparente sobre não ser do SKU exato) ou continuar sem vídeo até achar um específico.

### Gotchas

- **Mineração é 100% manual/curada** — `WebSearch` + `WebFetch`, um produto por vez, sem crawler automático. Cada entrada exige confirmar visualmente que dimensão/acabamento batem antes de entrar no mapa; forçar uma foto de coleção/tamanho diferente é pior que não ter foto (mostra o produto errado pro cliente).
- **`AMBIENTE_POR_SLUG` está hard-coded dentro de `fetch-ambiente.mjs`** — pra 6 itens está bom; se o ciclo 12 for adicionar os ~24 restantes, considerar extrair pra um JSON externo (`ambiente-map.json`) só se a manutenção do array inline ficar incômoda — não vale a abstração antes disso.
- **Risco de direito autoral já decidido e registrado** — memória `roilabs-scraped-media-risk-accepted`: Jean aceitou publicar imagens oficiais dos fabricantes sem autorização formal por escrito, mas **só pra marcas que a ROI Labs já revende** (Biancogres/Delta/Savane no catálogo atual). Não generalizar pra fotos de terceiros (Pinterest, Instagram alheio, blogs de decoração) sem uma nova confirmação do Jean.

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

1. ~~Redeploy + verificação em prod~~ **FEITO 2026-07-02**: deploy automático por push; `feed.xml` em prod com 30 itens íntegros (T011).
2. ~~Cadastro no Merchant Center~~ **FEITO 2026-07-02** (T012): conta criada, feed cadastrado com busca diária, 30/30 processados sem erro estrutural (SC-002 ✓). Entrega configurada (corte 14h BRT, separação 0–1, trânsito 2–6, frete por destino R$150–220) e política de devolução exigida pelo MC → página `/devolucoes` criada (CDC: 7d arrependimento, 90d defeito, reembolso 7d, sem taxa).
3. ⏳ **Acompanhar a revisão do Google (~3 dias)**: Produtos → Diagnóstico, meta ≥ 90% aprovados (SC-003). Reprovações prováveis e ações na tabela de troubleshooting do `docs/merchant-center.md` (imagem em CDN de terceiro é o suspeito nº 1).

### Gotchas

- Imagens do feed apontam pra CDN de terceiro (`jurunense.vteximg.com.br`) — se o Google reprovar por imagem não-rastreável, hospedar local (tabela de troubleshooting no doc ops).
- `g:id` = slug: mudar slug de produto reseta o histórico do item no Google — evitar renomear.
- `check-matrix` (prebuild) já valida preço/imagem na FONTE; `check-feed` (postbuild) valida o ARTEFATO — os dois gates são complementares, não redundantes.
