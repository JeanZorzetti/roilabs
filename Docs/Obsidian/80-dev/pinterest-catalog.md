---
tipo: ops-doc
status: vivo
data: 2026-07-03
dono: Duda (ops)
---

# Pinterest Catalogs — reusando o feed do Merchant Center

Terceiro canal grátis com o MESMO feed (`https://goiania.roilabs.com.br/feed.xml`):
o Pinterest aceita fontes de dados em XML (RSS 2.0) com os campos do formato Google
Shopping (namespace `g:`). Porcelanato é produto visual e Pinterest é O canal de
home decor/reforma — os 30 itens viram **Product Pins** (foto, preço, link direto
pra página do produto), buscáveis dentro do Pinterest.

Custo: R$ 0. Dev: zero mudança esperada (validar na 1ª ingestão, ver watch-points).

## Passo a passo (ops — Duda)

1. **Conta Business**: criar/converter em [business.pinterest.com](https://business.pinterest.com)
   (pode usar o e-mail comercial da ROI Labs).
2. **Reivindicar o domínio** `goiania.roilabs.com.br`: Settings → Claimed accounts →
   Claim website. Escolher o método **HTML tag** e **me acionar (Jean)** — eu adiciono a
   meta tag no `Base.astro` e faço o deploy (é 1 linha; DNS TXT também serve se preferir).
3. **Catalogs → Create catalog → Add data source**:
   - URL: `https://goiania.roilabs.com.br/feed.xml`
   - Formato: detecção automática (XML/RSS 2.0)
   - Frequência: **diária**
   - Moeda padrão: BRL · País: BR · Idioma: pt-BR
4. Conferir a 1ª ingestão no diagnóstico: meta **30/30 itens** aceitos. Reprovações por
   campo → tabela abaixo.
5. Depois de aprovado: os Product Pins ficam disponíveis; criar 2–3 boards
   ("Porcelanato amadeirado", "Porcelanato marmorizado", "Banheiros e cozinhas") e
   pinar os produtos + fotos de ambientes para dar contexto de busca.

## Compatibilidade do feed (campos exigidos pelo Pinterest)

| Campo Pinterest (obrigatório) | No nosso feed | OK |
|---|---|---|
| `id` | `g:id` (slug) | ✅ |
| `title` | `<title>` (nome + dimensão) | ✅ |
| `description` | `<description>` | ✅ |
| `link` | `<link>` (página do produto, https) | ✅ |
| `image_link` | `g:image_link` (https) | ✅ |
| `price` | `g:price` = `NN.NN BRL` | ✅ |
| `availability` | `g:availability` = `in_stock` | ✅ |
| `condition` (recomendado) | `g:condition` = `new` | ✅ |
| `brand` (recomendado) | `g:brand` | ✅ |

## Watch-points

- **Validar na 1ª ingestão**: a compatibilidade acima foi checada contra a doc do
  Pinterest, não contra uma ingestão real (diferente do Meta Catalog, que já está
  cadastrado). Se o parser reclamar do namespace `g:`, o fallback é 1 rota nova
  `feed-pinterest.xml` com os mesmos dados sem prefixo — me acionar (Jean), é ~30 min.
- Imagens em CDN de terceiro (vteximg) — mesmo suspeito nº 1 do Merchant Center; se
  reprovar por imagem, o diagnóstico por item aponta.
- O **Verified Merchant Program** (selo azul) é opcional e pede política de devolução e
  frete visíveis — já temos `/devolucoes/`; deixar para depois da 1ª venda pelo canal.
- Preço/estoque muda no site → feed atualiza no próximo build; Pinterest relê 1×/dia.

Ver também: [[meta-catalog]] (mesmo feed no Instagram/WhatsApp) e [[merchant-center]].
