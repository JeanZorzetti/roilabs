# Handoff — site-goiania

## 2026-07-04 — Ciclo 12: acervo de ambiente — 13/30 (era 6/30), handoff pra ciclo 13

> Continuação do ciclo 11 item 5. Seguiu a ordem recomendada: Savane → completar Biancogres → Delta.

### Resultado

| Marca | Ciclo 11 | Ciclo 12 | Faltando |
|---|---|---|---|
| **BIANCOGRES** | 6/18 | **11/18** | 7 |
| **SAVANE** | 0/8 | **2/8** | 6 |
| **DELTA** | 0/4 | 0/4 (confirmado, não é falha) | 4 |

5 novos matches Biancogres (dimensão+acabamento exatos, foto `ambiente-` específica do tamanho): Carvalho Natural (20x120), Cristallo Quartz Velvet (60x120), Chicago Nebbia (100x100), Chicago Grigio (100x100), Pulpis Grigio (100x100 — slug tem sufixo "-ac", official é "Satin"=Acetinado; catálogo tem o campo `acabamento` como "Mate" pra esse item, inconsistência pré-existente no dado, não travou o match dado nome+dimensão+slug batendo).

2 novos matches Savane (site é SPA — precisou Playwright, WebFetch não renderiza JS): Pietra di Matera (56x113, `savane.com.br/produto/pietra-di-matera-365`), Urban Branco Polido (90x90, `.../urban-branco-polido-480`). Estrutura Savane: 1 foto de ambiente por página em `/public/images/products/ambients/`, sem variação por tamanho (mais simples que Biancogres).

### O que ficou de fora (documentado, não é buraco silencioso)

- **Biancogres — Onix Bianco Lux (60x120 Polido)**: página existe, dimensão bate, mas só tem fotos de textura/peça (`onix-bianco-face-*`), nenhuma com prefixo `ambiente-`. Sem foto disponível, não é erro de busca.
- **Biancogres — Legado Grigio (20x120), Tivoli Strutturato (120x120), Lux (100x100), Grigio Externo (100x100 e 90x90), Castilla Noce (80x80)**: sem página oficial viva encontrada com esse nome exato. Tivoli só existe como Satin/EXT/Rock(45x90) — nenhum com acabamento "Strutturato". Castilla Noce só aparece na revista de lançamentos 2026 (PDF), página individual ainda não indexada/live.
- **Savane — Rock Face Matera/Trulli, Pietra di Trulli, Perla Acetinado, Strato Marmo Bege/Grigio**: sem página oficial encontrada (descontinuados ou renomeados — ex. "Perla" virou "Oásis Pérola", produto diferente). Terrazine tem página mas só em 72x72 Acetinado ou 91x91 **Externo** (não Acetinado) — finish não bate, não forçado.
- **Delta**: confirmado de novo — todas as páginas usam `/files/simulator/` (render genérico) + `/files/faces/` (textura), sem pasta de ambiente real. Mesma conclusão do ciclo 11, não é falha de busca.

### Método (reforça o do ciclo 11)

- **Savane é SPA** (React/Vue) — WebFetch não renderiza, retorna só HTML de template com `{{ }}`. Precisa Playwright (`browser_navigate` + `browser_evaluate` lendo `document.querySelectorAll('img')`). URL de produto: `savane.com.br/produto/<slug>-<id>`; achar via `site:savane.com.br/produto "<nome>"`.
- **Biancogres tem seletor de tamanho na própria página** (`label.product__sizes__button`) — clicar no tamanho certo antes de ler o `Acabamento`/`M²/Caixa`, porque o valor exibido muda por formato selecionado (ex.: Carvalho Natural mostra Acetinado tanto pra 26x106 quanto 20x120, mas `M²/Caixa` muda e é o sinal mais confiável quando o nome do finish não bate literalmente com o campo do catálogo).
- **Slugs "-ac-" no catálogo** = abreviação de "Acetinado" (não confiar cegamente no campo `atributos.acabamento`, que às vezes tem uma segunda categorização inconsistente com o nome do produto/slug).

### Próximos passos (ciclo 13, se for ampliar mais)

1. **2ª foto por produto (textura)** — item 4 do ciclo 11 ainda não feito: Biancogres expõe várias fotos `f02`/`f03` por modelo, dá pra popular `imagens[1]`/`imagens[2]` sem nova busca.
2. **Vídeo por SKU** — decisão do Jean ainda pendente (vídeo genérico de linha rotulado vs. continuar sem vídeo).
3. Biancogres restantes (7) e Savane restantes (6) provavelmente ficam permanentemente sem foto de ambiente — não há mais pistas de busca não tentadas; só valeria revisitar se os sites forem redesenhados.

### Gotchas (novos)

- **`AMBIENTE_POR_SLUG` em `fetch-ambiente.mjs` agora tem 13 entradas** (6 Biancogres ciclo 11 + 5 Biancogres ciclo 12 + 2 Savane ciclo 12) — script rodado, `13/13 fotos de ambiente` baixadas, `porcelanatos.json` atualizado.
- **Onix Bianco Lux é o primeiro caso "dimensão bate mas sem foto"** — vale lembrar que confirmar nome+dimensão não garante existir `ambiente-`; sempre checar a lista de imagens antes de adicionar ao mapa.

---

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
