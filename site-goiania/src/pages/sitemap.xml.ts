import type { APIRoute } from 'astro';
import { pages } from '../data/porcelanato';
import { produtos } from '../data/produtos';

const SITE = 'https://goiania.roilabs.com.br';

export const GET: APIRoute = () => {
  // Barra final SEMPRE: sem ela o nginx responde 301 (formato directory do Astro) e o
  // Googlebot queima crawl em redirect — foi 46% do rastreamento (GSC 2026-07-03).
  const urls = [
    { loc: `${SITE}/` },
    { loc: `${SITE}/porcelanato/` },
    { loc: `${SITE}/obrigado/` },
    { loc: `${SITE}/devolucoes/` },
    { loc: `${SITE}/calculadora/` },
    ...pages.map((p) => ({ loc: `${SITE}/porcelanato/${p.slug}/` })),
    ...produtos.map((p) => ({ loc: `${SITE}/porcelanato/produto/${p.slug}/` })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
