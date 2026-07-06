import type { APIRoute } from 'astro';
import { guias } from '../data/guias';

const SITE = 'https://goiania.roilabs.com.br';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// RSS 2.0 dos guias de decisão — mesma fonte (guias.ts) do sitemap/llms/hub,
// XML na mão (padrão do sitemap.xml.ts), sem dependência nova. NÃO confundir
// com feed.xml.ts, que é feed de PRODUTOS para o Merchant Center.
// ponytail: guias.ts não tem data por guia, então itens sem <pubDate> (válido
// em RSS 2.0); adicionar datas ao registro se um leitor precisar de ordenação.
export const GET: APIRoute = () => {
  const items = [...guias]
    .reverse() // registro é cronológico; RSS quer o mais novo primeiro
    .map(
      (g) => `    <item>
      <title>${esc(g.titulo)}</title>
      <link>${SITE}/guia/${g.slug}/</link>
      <guid isPermaLink="true">${SITE}/guia/${g.slug}/</guid>
      <description>${esc(g.descricao)}</description>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Porcelanato em Goiânia — Guias de decisão | ROI Labs</title>
    <link>${SITE}/guia/</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Guias-resposta sobre porcelanato: como escolher, comparar acabamentos, calcular caixas, assentar e manter — do polo de Goiânia.</description>
    <language>pt-BR</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
