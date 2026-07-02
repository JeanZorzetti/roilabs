# Contract: `GET /feed.xml` (goiania.roilabs.com.br)

Interface exposta ao Google Merchant Center (consumidor único). Arquivo estático gerado no build, servido pelo nginx.

- **Content-Type**: `application/xml; charset=utf-8`
- **Status**: 200 (arquivo estático; 404 = build quebrado, nunca deve ir ao ar — gate postbuild)
- **Formato**: RSS 2.0 + `xmlns:g="http://base.google.com/ns/1.0"` (Google Merchant product data spec)

## Shape

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Porcelanato em Goiânia — ROI Labs</title>
    <link>https://goiania.roilabs.com.br</link>
    <description>Catálogo de porcelanato com preço real em Goiânia</description>
    <item>
      <g:id>porcelanato-20x120-carvalho-natural</g:id>
      <title>BIANCOGRES 20x120 Carvalho Natural 20x120cm</title>
      <description>BIANCOGRES 20x120 Carvalho Natural 20x120cm Natural. R$ 98,99/m² em Goiânia. Fale pelo WhatsApp ou solicite orçamento.</description>
      <link>https://goiania.roilabs.com.br/porcelanato/produto/porcelanato-20x120-carvalho-natural</link>
      <g:image_link>https://jurunense.vteximg.com.br/arquivos/ids/2315389/54572.jpg</g:image_link>
      <g:price>98.99 BRL</g:price>
      <g:unit_pricing_measure>1sqm</g:unit_pricing_measure>
      <g:unit_pricing_base_measure>1sqm</g:unit_pricing_base_measure>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>BIANCOGRES</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>Porcelanato</g:product_type>
      <g:google_product_category>Hardware &gt; Building Materials &gt; Flooring &amp; Carpet</g:google_product_category>
    </item>
    <!-- 1 <item> por produto elegível do catálogo -->
  </channel>
</rss>
```

## Invariantes

1. 1 `<item>` por produto elegível (imagem presente e preço > 0); inelegível é omitido e logado no build.
2. `title`, `description`, `g:price` e `g:image_link` idênticos aos exibidos na página do `link` (política de paridade Google) — garantido por helpers compartilhados.
3. Texto escapado para XML (`&amp;`, `&lt;`, `&gt;`); UTF-8 íntegro (acentos, "²").
4. `g:id` estável entre builds (slug do catálogo) — mudar id reseta histórico do item no Google.
