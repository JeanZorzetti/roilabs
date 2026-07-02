# Research: Feed Google Merchant Center (009)

Nenhum NEEDS CLARIFICATION no Technical Context; decisões abaixo consolidam os defaults da spec com rationale.

## D1 — Formato do feed: RSS 2.0 + namespace `g:`

- **Decision**: RSS 2.0 (`<rss><channel><item>`) com atributos no namespace `xmlns:g="http://base.google.com/ns/1.0"`.
- **Rationale**: é o formato canônico de arquivo do Google Merchant, aceito por URL com busca agendada (fetch), legível pra debug e trivial de gerar por template string — mesmo padrão do `sitemap.xml.ts` existente.
- **Alternatives considered**: TSV (frágil com texto livre/acentos), Atom (equivalente, sem vantagem), Content API (exige OAuth/projeto Google — overkill para 30 itens estáticos).

## D2 — Preço: R$/m² + medida unitária

- **Decision**: `g:price` = preço do catálogo (R$/m², ex.: `98.99 BRL`) + `g:unit_pricing_measure` = `1sqm` e `g:unit_pricing_base_measure` = `1sqm`.
- **Rationale**: a política do Google exige preço do feed = preço da landing page; a página exibe R$/m². Declarar a base de medida evita reprovação por divergência e mostra o unitário correto no anúncio.
- **Alternatives considered**: preço por caixa (`preco × m2_caixa`) — rejeitado: divergiria do valor destacado na página. Vira fallback documentado se a revisão do Google reprovar a base atual (Assumption da spec).

## D3 — Identificadores: `g:identifier_exists = no`

- **Decision**: sem `g:gtin`/`g:mpn`; cada item declara `g:identifier_exists = no` e envia `g:brand`.
- **Rationale**: o catálogo não tem GTIN/MPN; é o mecanismo oficial do Google para produtos sem identificador universal. Inventar MPN a partir do slug arriscaria reprovação por identificador inválido.
- **Alternatives considered**: coletar GTINs reais dos fabricantes — trabalho manual de campo, fora do escopo; upgrade futuro se itens forem reprovados/limitados por performance.

## D4 — Disponibilidade e frete

- **Decision**: `g:availability = in_stock` fixo para todo item publicado; sem `g:shipping`.
- **Rationale**: não há estoque em tempo real (venda consultiva fechada por orçamento — o anúncio na página implica disponibilidade via fornecedor). Free listings aceitam feed sem frete (pode gerar advertência não-bloqueante).
- **Alternatives considered**: `preorder`/`backorder` — semanticamente errados; campo de frete com valor fictício — pior que omitir (política de paridade).

## D5 — Paridade título/descrição: extrair helpers

- **Decision**: extrair `tituloProduto(p)` (`marca + nome`) e `descricaoProduto(p)` (string hoje inline no `[slug].astro`) para `src/data/produtos.ts`; página e feed consomem os mesmos helpers. Feed usa `title` = `tituloProduto + dimensão` (igual ao prefixo do `<title>` da página), `g:image_link` = `imagens[0]`.
- **Rationale**: paridade exigida pelo Google garantida por construção — um só lugar para o texto; segunda utilização real justifica a extração (não é abstração especulativa).
- **Alternatives considered**: duplicar as strings no feed — rejeitado (drift silencioso = reprovação futura).

## D6 — Validação: script pós-build sem dependência

- **Decision**: `check-feed.mjs` (Node puro) roda como `postbuild` sobre `dist/feed.xml`: arquivo existe, declaração XML + canal presentes, nº de `<item>` = nº de produtos elegíveis do `porcelanatos.json`, > 0, cada item com os campos obrigatórios não-vazios, sem `&` cru fora de entidade. Falha = exit 1 = build quebra (Docker para o deploy).
- **Rationale**: valida o ARTEFATO real que o Google vai buscar (não a fonte), no mesmo padrão do gate existente (`prebuild` → `check-matrix.mjs`). Node não tem parser XML no stdlib e o feed é gerado por template — checagem estrutural direcionada cobre os modos de falha reais.
- **Alternatives considered**: parser XML de verdade (`fast-xml-parser`) — dependência nova para validar um template nosso; `ponytail:` teto documentado — adotar parser se o feed ganhar estrutura dinâmica complexa.

## D7 — Exclusão de item incompleto

- **Decision**: produto sem imagem ou com preço ausente/≤ 0 é omitido do feed pela rota E derruba o build no `check-feed.mjs` (erro com slug+campo — cenário 2 da US2). Catálogo curado de 30 itens: dado quebrado se corrige na fonte, não se contorna. A omissão na rota fica como defesa em profundidade.
- **Rationale**: item incompleto reprova individualmente no Google e suja a conta; a fonte deve ser corrigida no JSON, não mascarada no feed.

## D8 — Campos opcionais incluídos

- **Decision**: incluir `g:product_type = Porcelanato` e `g:google_product_category = Hardware > Building Materials > Flooring & Carpet`. Nada além disso nesta fase.
- **Rationale**: categoria ajuda o matching do Shopping a custo zero; demais opcionais (cor, material, tamanho) podem ser derivados depois se o painel pedir.

## D9 — Ops: verificação de domínio e cadastro

- **Decision**: `docs/merchant-center.md` documenta: conta Merchant Center → verificação do site `goiania.roilabs.com.br` (via Search Console — sinergia com o item GSC já pendente no backlog: uma verificação serve aos dois) → cadastro do feed por URL com busca agendada diária → habilitar free listings → onde acompanhar aprovação (Produtos → Diagnóstico).
- **Rationale**: passo externo obrigatório e não-automatizável; documentar evita redescobrir e amarra com o item GSC do backlog.
