// One-shot (ciclo 11, item 5): baixa fotos de AMBIENTE (cômodo decorado, não
// close-up de textura) dos sites oficiais dos fabricantes, pra public/img/
// ambientes/, e grava em porcelanatos.json como imagensAmbiente[0].
//
// Curadoria manual (não é crawler): cada entrada abaixo foi conferida à mão
// — mesma coleção/acabamento E MESMA DIMENSÃO do produto no catálogo — antes
// de entrar aqui. Cobertura parcial é esperada (ver Docs/Obsidian
// 80-dev/proximos-passos-dev.md, ciclo 11 item 5): a maioria dos fabricantes
// não fotografa ambiente de cada variante, só por coleção/tamanho.
// ponytail: fonte única = Biancogres (mesma marca das fotos de produto já no
// catálogo); ampliar a lista manualmente se surgir mais correspondência.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const CATALOG = 'porcelanatos.json';
const DIR = 'public/img/ambientes';
mkdirSync(DIR, { recursive: true });

const AMBIENTE_POR_SLUG = {
  'porcelanato-marmo-perla-biancogres':
    'https://www.biancogres.com.br/media/17572/conversions/ambiente-porcelanato-marmo-perla-velvet-60x120-thumb_480p.jpg',
  'porcelanato-arezzo-grigrio-biancogres':
    'https://www.biancogres.com.br/media/16824/conversions/ambiente-porcelanato-arezzo-grigio-satin-120x120-arezzo-grigio-ext-120x120-thumb_480p.jpg',
  'porcelanato-arezzo-externo-beige':
    'https://www.biancogres.com.br/media/17742/conversions/ambiente-arezzo-beige-satin-90x90-arezzo-beige-ext-90x90-thumb_480p.jpg',
  'porcelanato-arezzo-beige-biancogres':
    'https://www.biancogres.com.br/media/17601/conversions/ambiente-arezzo-beige-satin-90x90-arezzo-beige-ext-90x90-thumb_480p.jpg',
  'porcelanato-chicago-80x80-grafite-biancogres':
    'https://www.biancogres.com.br/media/9488/conversions/ambiente-biancogres-chicago-grafite-satin-80x80-chicago-grafite-ext-80x80-alta-thumb_480p.jpg',
  'porcelanato-persia-beige-biancogres':
    'https://www.biancogres.com.br/media/17118/conversions/ambiente-porcelanato-pulpis-marrone-lux-60x120-persia-beige-satin-100x100-thumb_480p.jpg',
  // Savane (ciclo 12): só 2/8 com página oficial + dimensão/acabamento batendo
  // exato; os outros 6 foram descontinuados/renomeados no site (ver handoff).
  'porcelanato-56x113cm-pietra-di-matera-natural':
    'https://www.savane.com.br/public/images/products/ambients/pietra-96eca814eb.jpg',
  'porcelanato-90x90cm-urban-branco-polido':
    'https://www.savane.com.br/public/images/products/ambients/urban-branco-f5-8504e32fd6.png',
  // Biancogres (ciclo 12): completando os 12 que faltavam — 5 batem
  // dimensão+acabamento exatos, os outros 7 não têm página oficial viva
  // (descontinuados/renomeados) ou têm página mas sem foto de ambiente
  // (Onix Bianco Lux 60x120: só fotos de textura, ver handoff).
  'porcelanato-20x120-carvalho-natural':
    'https://www.biancogres.com.br/media/11027/conversions/ambiente-biancogres-carvalho-natural-e-moove-grafite-rgb-thumb_480p.jpg',
  'porcelanato-cristallo-quartz-biancogres':
    'https://www.biancogres.com.br/media/17730/conversions/ambiente-porcelanato-cristallo-quartz-velvet-60x120-thumb_480p.jpg',
  'porcelanato-chicago-nebbia-biancogres':
    'https://www.biancogres.com.br/media/17610/conversions/ambiente-porcelanato-chicago-nebbia-100x100-thumb_480p.jpg',
  'porcelanato-chigaco-grigio-biancogres':
    'https://www.biancogres.com.br/media/17748/conversions/ambiente-porcelanato-chicago-grigio-satin-100x100-chicago-grigio-ext-100x100-thumb_480p.jpg',
  'porcelanato-pulpis-grigio-ac-100x100cm-biancogres':
    'https://www.biancogres.com.br/media/17644/conversions/ambiente-porcelanato-pulpis-grigio-lux-100x100-pulpis-grigio-satin-100x100-thumb_480p.jpg',
};

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
let baixadas = 0;

for (const p of catalog) {
  const src = AMBIENTE_POR_SLUG[p.slug];
  if (!src) continue;

  const rel = `/img/ambientes/${p.slug}.jpg`;
  const webp = rel.replace(/\.jpg$/, '.webp');
  const res = await fetch(src);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${src} (${p.slug})`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`public${rel}`, buf);
  await sharp(buf).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`public${webp}`);
  p.imagensAmbiente = [rel];
  baixadas++;
}

writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
console.log(`fetch-ambiente OK — ${baixadas}/${Object.keys(AMBIENTE_POR_SLUG).length} fotos de ambiente`);
