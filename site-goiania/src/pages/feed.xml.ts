import type { APIRoute } from 'astro';
import { produtos, tituloProduto, descricaoProduto, elegivelParaFeed } from '../data/produtos';

// Google Merchant Center product feed (RSS 2.0 + g: namespace).
// Contract: specs/009-merchant-center-feed/contracts/feed-xml.md
// Parity rule (Google policy): title/description/price/image must match the
// product page — enforced by sharing tituloProduto/descricaoProduto helpers.

const SITE = 'https://goiania.roilabs.com.br';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = () => {
  const items = produtos.filter(elegivelParaFeed).map((p) => {
    const a = p.atributos;
    const link = `${SITE}/porcelanato/produto/${p.slug}`;
    return `    <item>
      <g:id>${esc(p.slug)}</g:id>
      <title>${esc(`${tituloProduto(p)} ${a.dimensao}`)}</title>
      <description>${esc(descricaoProduto(p))}</description>
      <link>${link}</link>
      <g:image_link>${esc(p.imagens[0])}</g:image_link>
      <g:price>${a.preco.toFixed(2)} BRL</g:price>
      <g:unit_pricing_measure>1sqm</g:unit_pricing_measure>
      <g:unit_pricing_base_measure>1sqm</g:unit_pricing_base_measure>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${esc(a.marca)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>Porcelanato</g:product_type>
      <g:google_product_category>Hardware &gt; Building Materials &gt; Flooring &amp; Carpet</g:google_product_category>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Porcelanato em Goiânia — ROI Labs</title>
    <link>${SITE}</link>
    <description>Catálogo de porcelanato com preço real em Goiânia</description>
${items.join('\n')}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
