import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';

// OG dinâmico por artigo: /open-graph/<post.id>.png (Article.astro aponta o og:image).
// Páginas fora do blog seguem no /og-image.jpg estático.
const posts = await getCollection('blog', ({ data }) => !data.draft);
const pages = Object.fromEntries(posts.map((p) => [p.id, p.data]));

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    logo: { path: './public/roilabs-logo.png', size: [280] },
    bgGradient: [[20, 23, 29]], // --ink do site (#14171d)
    border: { color: [255, 77, 0], width: 10, side: 'block-end' }, // laranja hi-vis
    padding: 60,
    font: {
      title: { size: 60, weight: 'Bold', color: [244, 244, 240], lineHeight: 1.2 },
      description: { size: 28, color: [170, 175, 185], lineHeight: 1.4 },
    },
  }),
});
