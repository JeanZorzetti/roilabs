// Postbuild: ping IndexNow (Bing + partners, feeds ChatGPT's index) with every
// URL in the generated sitemap so new pages get crawled in hours, not weeks.
// The key is public by design (served at /{KEY}.txt). Non-fatal on purpose:
// an IndexNow hiccup must never break the Docker build/deploy.
// ponytail: pings on every build (including local); IndexNow dedupes, so no gate.
import { readFileSync } from 'node:fs';

const KEY = 'e72cab81d95c41fd915ce3331a10d1ad';
const HOST = 'roilabs.com.br';

const xml = readFileSync('dist/sitemap.xml', 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (urlList.length === 0) {
  console.warn('indexnow: sitemap sem URLs, nada a enviar');
  process.exit(0);
}

try {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList,
    }),
  });
  console.log(`indexnow: ${urlList.length} URLs enviadas (${HOST}), HTTP ${res.status}`);
} catch (err) {
  console.warn(`indexnow: ping falhou (${err.message}) — build segue`);
}
