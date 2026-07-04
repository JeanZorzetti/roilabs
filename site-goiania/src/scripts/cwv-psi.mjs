// Core Web Vitals semanal via PageSpeed Insights API (grátis) — Lighthouse rodando
// na infra do Google contra a PROD, a única medição confiável (Lighthouse local em
// Windows/OneDrive varia ±30%). Amostra 1 página por template: home, hub, malha,
// produto, calculadora. Histórico em CSV + snapshot .md no vault (padrão rank-tracking).
//
// PSI_API_KEY obrigatória na prática (anônimo devolve 429 direto — testado 2026-07-04);
// chave grátis: console do Google Cloud → API "PageSpeed Insights" → credencial (25k/dia).
// Sem a env vira no-op, mesmo padrão do gsc-miner.
//
// Uso:  PSI_API_KEY=<key> node site-goiania/src/scripts/cwv-psi.mjs
// Cron: .github/workflows/rank-tracking.yml (semanal, non-fatal, commita no vault).
import { readFileSync, appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SITE = 'https://goiania.roilabs.com.br';
const KEY = process.env.PSI_API_KEY;
if (!KEY) {
  console.log('cwv-psi: sem PSI_API_KEY — pulando (chave grátis no console do Google Cloud).');
  process.exit(0);
}
const CSV = path.join(ROOT, 'Docs/Obsidian/90-medicao/cwv.csv');
const NOTE = path.join(ROOT, 'Docs/Obsidian/90-medicao/cwv.md');
const hoje = new Date().toISOString().slice(0, 10);

// 1 URL por template (medir as 80 páginas seria redundante: o peso vem do template).
const dataTs = readFileSync(path.join(ROOT, 'site-goiania/src/data/porcelanato.ts'), 'utf8');
const malhaSlug = dataTs.match(/slug:\s*'([^']+)'/)?.[1];
const produtoSlug = JSON.parse(
  readFileSync(path.join(ROOT, 'site-goiania/porcelanatos.json'), 'utf8')
)[0]?.slug;

const urls = [
  `${SITE}/`,
  `${SITE}/porcelanato/`,
  ...(malhaSlug ? [`${SITE}/porcelanato/${malhaSlug}/`] : []),
  ...(produtoSlug ? [`${SITE}/porcelanato/produto/${produtoSlug}/`] : []),
  `${SITE}/calculadora/`,
];

async function psi(url) {
  const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  api.searchParams.set('url', url);
  api.searchParams.set('strategy', 'mobile');
  api.searchParams.set('category', 'performance');
  api.searchParams.set('key', KEY);
  const r = await fetch(api);
  if (!r.ok) throw new Error(`PSI HTTP ${r.status}`);
  const j = await r.json();
  const audits = j.lighthouseResult?.audits ?? {};
  const ms = (id) => Math.round(audits[id]?.numericValue ?? -1);
  return {
    score: Math.round((j.lighthouseResult?.categories?.performance?.score ?? -0.01) * 100),
    lcp: ms('largest-contentful-paint'),
    cls: Number((audits['cumulative-layout-shift']?.numericValue ?? -1).toFixed(3)),
    tbt: ms('total-blocking-time'),
    fcp: ms('first-contentful-paint'),
    // Field data (CrUX) só existe com tráfego suficiente — null é esperado no começo.
    fieldLcp: j.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null,
  };
}

console.log(`cwv-psi ${hoje}: ${urls.length} páginas (mobile)`);
const results = [];
for (const url of urls) {
  try {
    const m = await psi(url);
    results.push({ url, ...m });
    console.log(`  ${url}: score ${m.score} · LCP ${m.lcp}ms · CLS ${m.cls} · TBT ${m.tbt}ms`);
  } catch (e) {
    console.error(`  ${url}: erro — ${e.message}`);
    results.push({ url, erro: e.message });
  }
}
if (results.every((r) => r.erro)) {
  console.error('cwv-psi: todas as medições falharam');
  process.exit(1);
}

if (!existsSync(CSV)) appendFileSync(CSV, 'data,url,score,lcp_ms,cls,tbt_ms,fcp_ms,crux_lcp_ms\n');
for (const r of results.filter((r) => !r.erro)) {
  appendFileSync(CSV, `${hoje},${r.url},${r.score},${r.lcp},${r.cls},${r.tbt},${r.fcp},${r.fieldLcp ?? ''}\n`);
}

const linha = (r) =>
  r.erro
    ? `| ${r.url.replace(SITE, '')} | erro | — | — | — | ${r.erro} |`
    : `| ${r.url.replace(SITE, '')} | ${r.score} | ${(r.lcp / 1000).toFixed(1)}s | ${r.cls} | ${r.tbt}ms | ${r.fieldLcp ? `${(r.fieldLcp / 1000).toFixed(1)}s` : '—'} |`;

writeFileSync(
  NOTE,
  `---
tipo: medicao
data: ${hoje}
fonte: PageSpeed Insights API (Lighthouse mobile em prod)
---

# 📉 Core Web Vitals — goiânia (${hoje})

> Lab data (Lighthouse na infra do Google). CrUX (campo) fica "—" até o site ter
> tráfego suficiente no Chrome. Histórico completo em \`cwv.csv\`. Metas: score ≥ 90,
> LCP ≤ 2,5s, CLS ≤ 0,1, TBT ≤ 200ms.

| Página | Score | LCP | CLS | TBT | CrUX LCP |
|---|---|---|---|---|---|
${results.map(linha).join('\n')}
`
);
console.log(`cwv-psi: ${results.filter((r) => !r.erro).length}/${urls.length} ok → cwv.csv + cwv.md`);
