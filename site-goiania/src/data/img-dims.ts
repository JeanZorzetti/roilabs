// Build-time only (frontmatter Astro): lê width/height de arquivos em public/
// para dar dimensão intrínseca a <img> de altura variável (masonry do
// inspire-se) — evita CLS. sharp já é dependência transitiva do Astro.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const cache = new Map<string, { width: number; height: number }>();

export async function imgDims(src: string): Promise<{ width: number; height: number }> {
  const hit = cache.get(src);
  if (hit) return hit;
  const file = fileURLToPath(new URL(`../../public${src}`, import.meta.url));
  const m = await sharp(file).metadata();
  const dims = { width: m.width ?? 0, height: m.height ?? 0 };
  cache.set(src, dims);
  return dims;
}
