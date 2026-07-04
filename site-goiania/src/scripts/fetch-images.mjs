// One-shot (ciclo 11): baixa as fotos do catálogo — hoje hotlink de CDN de
// terceiro (jurunense.vteximg.com.br), ponto único de falha e suspeito nº 1 do
// Merchant Center — para public/img/produtos/ e reescreve porcelanatos.json
// com o caminho local. Gera também a variante de exibição .webp (≤900px,
// usada por imgDisplay em src/data/produtos.ts); o original fica para
// feed/OG/zoom. Idempotente: entrada já local só regenera o .webp que faltar.
// Catálogo curado: download quebrado = bug de dado → falha, não encolhe.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import sharp from 'sharp';

const CATALOG = 'porcelanatos.json';
const DIR = 'public/img/produtos';
mkdirSync(DIR, { recursive: true });

const webpDe = (file) => file.replace(/\.\w+$/, '.webp');
const gerarWebp = (input, out) =>
  sharp(input).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
let baixadas = 0;
let webps = 0;

for (const p of catalog) {
  for (let i = 0; i < p.imagens.length; i++) {
    const src = p.imagens[i];

    if (src.startsWith('/img/')) {
      const orig = `public${src}`;
      if (!existsSync(orig)) throw new Error(`imagem local sumiu: ${orig} (${p.slug})`);
      if (!existsSync(webpDe(orig))) {
        await gerarWebp(orig, webpDe(orig));
        webps++;
      }
      continue;
    }

    const ext = (new URL(src).pathname.match(/\.\w+$/)?.[0] ?? '.jpg').toLowerCase();
    const rel = `/img/produtos/${p.slug}-${i + 1}${ext}`;
    const file = `public${rel}`;
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${src} (${p.slug})`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(file, buf);
    await gerarWebp(buf, webpDe(file));
    p.imagens[i] = rel;
    baixadas++;
    webps++;
  }
}

writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
console.log(`fetch-images OK — ${baixadas} baixadas, ${webps} webp geradas`);
