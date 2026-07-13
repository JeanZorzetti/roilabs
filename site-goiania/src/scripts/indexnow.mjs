// Postbuild: ping IndexNow (Bing + partners, feeds ChatGPT's index) with every
// URL in the generated sitemap so new pages get crawled in hours, not weeks.
// The key is public by design (served at /{KEY}.txt). Non-fatal on purpose:
// an IndexNow hiccup must never break the Docker build/deploy.
// ponytail: pings on every build (including local); IndexNow dedupes, so no gate.
import { readFileSync } from 'node:fs';

const KEY = 'e72cab81d95c41fd915ce3331a10d1ad';
const HOST = 'goiania.roilabs.com.br';

// --check: não lê o sitemap, só pergunta ao IndexNow se o host está autorizado.
// Rodar (`pnpm indexnow:check`) sem precisar de build/deploy — é o gate para saber se o
// Bing voltou a aceitar o host. Ver Docs/Obsidian/80-dev/bing-webmaster.md.
const check = process.argv.includes('--check');

const urlList = check
  ? [`https://${HOST}/`]
  : [...readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

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
  if (res.ok) {
    console.log(`indexnow: ${urlList.length} URLs enviadas (${HOST}), HTTP ${res.status}`);
  } else {
    // Um 403 aqui é mudo e mortal: o deploy fica verde e NENHUMA URL é recrawleada.
    // Logar o corpo — é o corpo que diz o porquê (ex.: UserForbiddedToAccessSite).
    console.error(
      `indexnow: RECUSADO (${HOST}) HTTP ${res.status} — ${(await res.text()).trim()}\n` +
        `indexnow: as ${urlList.length} URLs NÃO foram enviadas; o recrawl está mudo. Build segue.`,
    );
  }
} catch (err) {
  console.warn(`indexnow: ping falhou (${err.message}) — build segue`);
}
