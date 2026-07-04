// Postbuild gate: validates dist/feed.xml (Google Merchant feed) against the
// rules in specs/009-merchant-center-feed/data-model.md. Broken feed = broken
// build = Docker deploy stops (a malformed feed silently kills the listing).
// ponytail: regex-level checks over our own template output — swap in a real
// XML parser only if the feed ever grows dynamic structure.
import { readFileSync, existsSync } from 'node:fs';

const FEED = 'dist/feed.xml';
const CATALOG = 'porcelanatos.json';
const REQUIRED_TAGS = [
  'g:id',
  'title',
  'description',
  'link',
  'g:image_link',
  'g:price',
  'g:availability',
  'g:condition',
  'g:brand',
  'g:identifier_exists',
];

const errors = [];

if (!existsSync(FEED)) {
  console.error(`check-feed FAIL: ${FEED} não existe`);
  process.exit(1);
}

const feed = readFileSync(FEED, 'utf8');
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));

// Same eligibility rule as elegivelParaFeed() in src/data/produtos.ts
// (reapplied on the JSON because this script cannot import TS).
const eligible = [];
for (const p of catalog) {
  const missing = [];
  if (!p.imagens?.[0]) missing.push('imagens[0]');
  if (!(p.atributos?.preco > 0)) missing.push('atributos.preco');
  if (missing.length) {
    // Curated 30-item catalog: a broken product is a data bug to fix at the
    // source, not to ship around — fail the build instead of shrinking the feed.
    errors.push(`produto inelegível — ${p.slug} (${missing.join(', ')})`);
  } else {
    eligible.push(p);
  }
}

// 1-2. XML declaration + structure
if (!feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) errors.push('sem declaração XML UTF-8');
if (!/<rss [^>]*xmlns:g="http:\/\/base\.google\.com\/ns\/1\.0"/.test(feed)) errors.push('sem <rss> com xmlns:g');
if (!feed.includes('<channel>')) errors.push('sem <channel>');

// 3. item count matches eligible catalog, > 0
const items = feed.split('<item>').slice(1);
if (items.length === 0) errors.push('feed sem <item> (catálogo vazio?)');
if (items.length !== eligible.length) {
  errors.push(`contagem de <item> (${items.length}) ≠ produtos elegíveis (${eligible.length})`);
}

// 4. required non-empty fields per item
for (const item of items) {
  const id = item.match(/<g:id>([^<]*)<\/g:id>/)?.[1] ?? '(sem g:id)';
  for (const tag of REQUIRED_TAGS) {
    const m = item.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    if (!m || !m[1].trim()) errors.push(`item ${id}: campo obrigatório vazio/ausente — ${tag}`);
  }
  const price = item.match(/<g:price>([^<]*)<\/g:price>/)?.[1] ?? '';
  if (price && !/^\d+\.\d{2} BRL$/.test(price)) errors.push(`item ${id}: g:price fora do formato "NN.NN BRL" — "${price}"`);
  // Ciclo 11: imagem self-hosted — hotlink de CDN de terceiro é regressão.
  const img = item.match(/<g:image_link>([^<]*)<\/g:image_link>/)?.[1] ?? '';
  if (img && !img.startsWith('https://goiania.roilabs.com.br/img/')) {
    errors.push(`item ${id}: g:image_link fora do domínio próprio — "${img}"`);
  }
}

// 5. encoding: no replacement char, no raw & outside entities
if (feed.includes('�')) errors.push('mojibake: caractere U+FFFD presente');
if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(feed)) errors.push('& cru fora de entidade XML');

if (errors.length) {
  console.error(`check-feed FAIL (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`check-feed OK — ${items.length} itens em ${FEED}`);
