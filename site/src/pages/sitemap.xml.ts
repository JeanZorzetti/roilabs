import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://roilabs.com.br';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  // Barra final SEMPRE: sem ela o nginx responde 301 http:// (mesmo bug do site-goiania,
  // GSC 2026-07-03) e o Googlebot queima crawl em redirect.
  const urls = [
    { loc: `${SITE}/` },
    { loc: `${SITE}/modelo/` },
    { loc: `${SITE}/polo-goiania/` },
    { loc: `${SITE}/blog/` },
    { loc: `${SITE}/simulador/` },
    { loc: `${SITE}/obrigado/` },
    ...posts.map((p) => ({
      loc: `${SITE}/blog/${p.id}/`,
      lastmod: (p.data.updatedDate ?? p.data.pubDate).toISOString().slice(0, 10),
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${'lastmod' in u && u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
