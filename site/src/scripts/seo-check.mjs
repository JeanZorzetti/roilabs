// Guard do crawl budget. Este invariante já regrediu duas vezes (site-goiania, depois
// o roilabs em 29/jun–03/jul): uma URL emitida sem barra final vira 301 no nginx e o
// Googlebot queima o hit em redirect em vez de rastrear a página.
// Roda no dist/ depois do build. Falha = build quebrado, de propósito.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SITE = 'https://roilabs.com.br';
const errors = [];

// Uma URL é "de rota" quando o último segmento não tem extensão (/blog/x/ vs /rss.xml).
const isRoute = (path) => !/\.[a-z0-9]+$/i.test(path);

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
  });

// 1. Sitemap: toda <loc> de rota termina com barra.
const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const path = loc.slice(SITE.length);
  if (isRoute(path) && !loc.endsWith('/')) errors.push(`sitemap: <loc> sem barra final — ${loc}`);
}

// 2. /obrigado/ é noindex (destino do form) — rastreá-la é crawl desperdiçado.
if (sitemap.includes('/obrigado/')) errors.push('sitemap: /obrigado/ é noindex, não pode estar no sitemap');
if (!readFileSync(join(DIST, 'obrigado', 'index.html'), 'utf8').includes('name="robots"'))
  errors.push('obrigado: perdeu o <meta name="robots" content="noindex">');

// 3. Nenhum HTML/feed emite URL absoluta de rota sem barra (JSON-LD, form redirect, links).
for (const file of [...htmlFiles(DIST), join(DIST, 'rss.xml'), join(DIST, 'llms.txt')]) {
  const text = readFileSync(file, 'utf8');
  for (const [, path] of text.matchAll(new RegExp(`${SITE}(/[\\w/-]*[\\w-])(?=["'<)\\s])`, 'g'))) {
    if (isRoute(path)) errors.push(`${file}: URL sem barra final — ${SITE}${path}`);
  }
}

if (errors.length) {
  console.error(`\nseo-check FALHOU (${errors.length}):`);
  for (const e of new Set(errors)) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('seo-check ok — toda URL de rota termina com barra, /obrigado/ fora do sitemap.');
