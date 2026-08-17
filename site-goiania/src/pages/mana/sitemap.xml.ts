import type { APIRoute } from 'astro';
import { produtosMana } from '../../data/mana';

// Sitemap PRÓPRIO da Maná (015 T018) — o root do nginx é compartilhado, então SÓ URLs
// da Maná podem entrar aqui. Nenhuma URL de porcelanato pode vazar (research.md D1).
// URLs entram independente de `publicada`: a página é conteúdo real em 200 desde a
// Fase 2 (só o botão de compra e o Offer do JSON-LD esperam a Fase 7) — mesmo padrão
// de porcelanato/fitas, cujo sitemap nunca checou um flag de venda ativa.
const SITE = 'https://mana.roilabs.com.br';

export const GET: APIRoute = () => {
  const urls = [
    { loc: `${SITE}/mana/` },
    ...produtosMana.map((p) => ({ loc: `${SITE}/mana/${p.slug}/`, imgs: p.imagens })),
  ];

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const imgAbs = (i: string) => (i.startsWith('http') ? i : `${SITE}${i}`);

  const entry = (u: { loc: string; imgs?: string[] }) => {
    const imgs = (u.imgs ?? [])
      .map((i) => `<image:image><image:loc>${esc(imgAbs(i))}</image:loc></image:image>`)
      .join('');
    return `  <url><loc>${u.loc}</loc>${imgs}</url>`;
  };

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(entry).join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
