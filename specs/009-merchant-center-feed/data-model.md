# Data Model: Feed Google Merchant Center (009)

## Entidades

### Produto (existente — `src/data/produtos.ts`, fonte `porcelanatos.json`)

| Campo | Tipo | Uso no feed |
|---|---|---|
| `slug` | string | `g:id` e URL da página (`/porcelanato/produto/{slug}`) |
| `imagens[]` | string[] | `g:image_link` = `imagens[0]` (URLs absolutas, CDN do fornecedor) |
| `atributos.marca` | string | `g:brand`; compõe o título |
| `atributos.preco` | number (R$/m²) | `g:price` (`NN.NN BRL`) |
| `atributos.dimensao` | string | compõe título e descrição |
| `atributos.acabamento` | string | compõe descrição |
| `atributos.m2_caixa` | number | não vai ao feed nesta fase (D2) |
| `atributos.retificado` / `classe_ad` | opcional | não vão ao feed |

### FeedItem (derivado — nunca persistido nem editado)

| Atributo Google | Derivação | Regra |
|---|---|---|
| `g:id` | `slug` | único e estável (slug já é chave do catálogo) |
| `title` | `tituloProduto(p) + ' ' + dimensao` | = prefixo do `<title>` da página (paridade) |
| `description` | `descricaoProduto(p)` | = meta description da página (helper único, D5) |
| `link` | `https://goiania.roilabs.com.br/porcelanato/produto/{slug}` | página existente com Product schema |
| `g:image_link` | `imagens[0]` | obrigatório; sem imagem → item excluído (D7) |
| `g:price` | `preco.toFixed(2) + ' BRL'` | > 0; senão item excluído (D7) |
| `g:unit_pricing_measure` | `1sqm` | preço é por m² (D2) |
| `g:unit_pricing_base_measure` | `1sqm` | idem |
| `g:availability` | `in_stock` | fixo (D4) |
| `g:condition` | `new` | fixo |
| `g:brand` | `marca` | obrigatório |
| `g:identifier_exists` | `no` | catálogo sem GTIN/MPN (D3) |
| `g:product_type` | `Porcelanato` | fixo (D8) |
| `g:google_product_category` | `Hardware > Building Materials > Flooring & Carpet` | fixo (D8) |

## Regras de validação (check-feed.mjs, D6/D7)

1. `dist/feed.xml` existe e começa com declaração XML UTF-8.
2. Estrutura: `<rss>` com `xmlns:g`, 1 `<channel>`, ≥ 1 `<item>`.
3. Contagem de `<item>` = contagem de produtos ELEGÍVEIS no JSON (elegível = tem `imagens[0]` e `preco > 0`).
4. Todo `<item>` tem, não-vazios: `g:id`, `title`, `description`, `link`, `g:image_link`, `g:price`, `g:availability`, `g:condition`, `g:brand`, `g:identifier_exists`.
5. Encoding: presença dos caracteres acentuados esperados (nenhum `�`) e nenhum `&` cru fora de entidade (`&amp;` etc.).
6. Produto inelegível: ERRO no build com slug + campo faltante (catálogo curado — corrigir na fonte, não encolher o feed silenciosamente). A rota ainda omite o item (defesa em profundidade caso o gate seja pulado).

## Transições de estado

Nenhuma — saída derivada e stateless; regenerada a cada build.
