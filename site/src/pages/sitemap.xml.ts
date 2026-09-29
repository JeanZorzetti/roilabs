import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';
import { AUTORES } from '../data/autores';

const SITE = 'https://roilabs.com.br';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  // Barra final SEMPRE: sem ela o nginx responde 301 http:// (mesmo bug do site-goiania,
  // GSC 2026-07-03) e o Googlebot queima crawl em redirect.
  const urls: { loc: string; lastmod?: string; images?: string[] }[] = [
    { loc: `${SITE}/` },
    { loc: `${SITE}/modelo/` },
    { loc: `${SITE}/blog/` },
    { loc: `${SITE}/simulador/` },
    // /obrigado/ fica fora: é noindex (destino do form), rastreá-la é crawl desperdiçado.
    ...(await Promise.all(
      posts.map(async (p) => ({
        loc: `${SITE}/blog/${p.id}/`,
        lastmod: (p.data.updatedDate ?? p.data.pubDate).toISOString().slice(0, 10),
        // Mesma URL (1600 px) que o ImageObject do Article.astro. Só image:loc: o Google
        // deixou de ler legenda/título/licença dentro do sitemap em 2022.
        images: p.data.cover ? [new URL((await getImage({ src: p.data.cover, width: 1600 })).src, SITE).toString()] : [],
      })),
    )),
    // Página de autor (mesma regra do [slug].astro: só quem tem post). lastmod = post mais recente dele.
    ...AUTORES.flatMap((a) => {
      const datas = posts.filter((p) => p.data.author === a.nome).map((p) => p.data.updatedDate ?? p.data.pubDate);
      if (datas.length === 0) return [];
      const ultima = new Date(Math.max(...datas.map((d) => d.valueOf())));
      return [{ loc: `${SITE}/autor/${a.slug}/`, lastmod: ultima.toISOString().slice(0, 10) }];
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}${(u.images ?? [])
        .map((src) => `<image:image><image:loc>${src}</image:loc></image:image>`)
        .join('')}</url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
