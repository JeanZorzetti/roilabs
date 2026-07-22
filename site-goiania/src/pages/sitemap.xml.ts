import type { APIRoute } from 'astro';
import { pages } from '../data/porcelanato';
import { produtos, produtosDaCategoria, imgAbs } from '../data/produtos';
import { guias } from '../data/guias';
import { ambientes, produtosDoAmbiente } from '../data/ambientes';
import { fitas } from '../data/fitas';

const SITE = 'https://goiania.roilabs.com.br';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = () => {
  // Barra final SEMPRE: sem ela o nginx responde 301 (formato directory do Astro) e o
  // Googlebot queima crawl em redirect — foi 46% do rastreamento (GSC 2026-07-03).
  // Extensão image: — porcelanato é compra visual; Google Imagens indexa a partir daqui.
  const urls: { loc: string; imgs?: string[] }[] = [
    { loc: `${SITE}/` },
    // Fitas — barra final obrigatória, como em toda URL nova (FR-021).
    { loc: `${SITE}/fitas/`, imgs: fitas.map((f) => f.imagem) },
    ...fitas.map((f) => ({ loc: `${SITE}/fitas/${f.slug}/`, imgs: [f.imagem] })),
    { loc: `${SITE}/porcelanato/` },
    { loc: `${SITE}/obrigado/` },
    { loc: `${SITE}/devolucoes/` },
    { loc: `${SITE}/sobre/` },
    { loc: `${SITE}/calculadora/` },
    { loc: `${SITE}/comparar/` },
    {
      loc: `${SITE}/inspire-se/`,
      imgs: produtos.flatMap((p) => p.imagensAmbiente ?? []),
    },
    ...ambientes.map((a) => ({
      loc: `${SITE}/inspire-se/${a.slug}/`,
      imgs: produtosDoAmbiente(a.slug).flatMap((p) => p.imagensAmbiente ?? []),
    })),
    { loc: `${SITE}/glossario/` },
    { loc: `${SITE}/guia/` },
    ...guias.map((g) => ({ loc: `${SITE}/guia/${g.slug}/` })),
    ...pages.map((p) => ({
      loc: `${SITE}/porcelanato/${p.slug}/`,
      // Fotos da galeria da categoria (mesmas dos produtos — Google deduplica).
      imgs: produtosDaCategoria(p.slug, p.tipo)
        .map((x) => x.imagens[0])
        .filter(Boolean)
        .slice(0, 5),
    })),
    ...produtos.map((p) => ({
      loc: `${SITE}/porcelanato/produto/${p.slug}/`,
      imgs: [...p.imagens, ...(p.imagensAmbiente ?? [])],
    })),
  ];

  const entry = (u: { loc: string; imgs?: string[] }) => {
    const imgs = (u.imgs ?? [])
      .map((i) => `<image:image><image:loc>${esc(imgAbs(i, SITE))}</image:loc></image:image>`)
      .join('');
    return `  <url><loc>${u.loc}</loc>${imgs}</url>`;
  };

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(entry).join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
