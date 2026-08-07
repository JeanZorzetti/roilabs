// Rank tracking semanal da malha pSEO + âncora, contra a SERP real.
// Leitura de tração ANTES de o GSC maturar (GSC vira a fonte grátis definitiva depois).
//
// Fonte (na ordem): SERPER_API_KEY (serper.dev — 2.500 buscas grátis no cadastro,
// sem cartão) → DATAFORSEO_API_KEY (fallback; ~$0.01/keyword em depth 50, precisa
// de saldo — 2026-07-03 a conta zerou no meio da rodada).
//
// Uso:  SERPER_API_KEY=<key> node site-goiania/src/scripts/rank-tracking.mjs
// Cron: .github/workflows/rank-tracking.yml (semanal, commita o resultado no vault).
import { readFileSync, appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
// strip de BOM/espaço: secret colado com U+FEFF invisível quebra o header do fetch
// (40/40 "erros de consulta" de 06/07 a 11/07 — ByteString error)
const clean = (v) => v?.replace(/^﻿/, '').trim() || undefined;
const SERPER = clean(process.env.SERPER_API_KEY);
const DFS = clean(process.env.DATAFORSEO_API_KEY);
if (!SERPER && !DFS) {
  console.error('rank-tracking: defina SERPER_API_KEY (grátis em serper.dev) ou DATAFORSEO_API_KEY');
  process.exit(1);
}

const TARGET = 'goiania.roilabs.com.br';
const CSV = path.join(ROOT, 'Docs/Obsidian/90-medicao/rank-tracking.csv');
const NOTE = path.join(ROOT, 'Docs/Obsidian/90-medicao/rank-tracking.md');
const hoje = new Date().toISOString().slice(0, 10);

// Keywords = termoAlvo de cada página (fonte única) + âncora do Keyword Planner.
// Os DOIS verticais entram: porcelanato (B2C local) e fitas (B2B nacional). Até 07/08/2026
// só porcelanato era lido, e o vertical que assumiu a home ficava sem veredito nenhum.
// A localização é parte da keyword: medir fita geolocalizado em Goiânia mede a SERP errada.
const GOIANIA = 'Goiania, State of Goias, Brazil';
const BRASIL = 'Brazil';
const termosDe = (arquivo) =>
  [...readFileSync(path.join(ROOT, arquivo), 'utf8').matchAll(/termoAlvo:\s*'([^']+)'/g)].map(
    (m) => m[1]
  );
const keywords = [
  // Map dedupa por keyword mantendo a 1ª localização declarada.
  ...new Map([
    ['porcelanato goiânia', GOIANIA],
    ...termosDe('site-goiania/src/data/porcelanato.ts').map((k) => [k, GOIANIA]),
    ...termosDe('site-goiania/src/data/fitas.ts').map((k) => [k, BRASIL]),
  ]),
].map(([kw, location]) => ({ kw, location }));

const nLocal = keywords.filter((k) => k.location === GOIANIA).length;
console.log(
  `rank-tracking ${hoje}: ${keywords.length} keywords (${nLocal} Goiânia · ${keywords.length - nLocal} Brasil), alvo ${TARGET}, fonte ${SERPER ? 'serper.dev' : 'dataforseo'}`
);

// Cada provider devolve { pos, url } (null = fora do top 50) ou lança.
async function viaSerper(kw, location) {
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': SERPER, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: kw, gl: 'br', hl: 'pt-br', location, num: 50 }),
  });
  if (!r.ok) throw new Error(`serper HTTP ${r.status}`);
  const j = await r.json();
  const hit = (j.organic ?? []).find((i) => (i.link ?? '').includes(TARGET));
  return { pos: hit?.position ?? null, url: hit?.link ?? '' };
}

async function viaDataForSeo(kw, location) {
  const r = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/regular', {
    method: 'POST',
    headers: { Authorization: `Basic ${DFS}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      // DFS escreve location_name sem espaço depois da vírgula; serper com.
      { keyword: kw, location_name: location.replace(/,\s+/g, ','), language_code: 'pt', depth: 50 },
    ]),
  });
  const j = await r.json();
  const task = j?.tasks?.[0];
  if (task?.status_code !== 20000) throw new Error(task?.status_message ?? j?.status_message ?? 'erro API');
  const hit = (task.result?.[0]?.items ?? []).find((i) => i.domain === TARGET || (i.url ?? '').includes(TARGET));
  return { pos: hit?.rank_absolute ?? null, url: hit?.url ?? '' };
}

const check = SERPER ? viaSerper : viaDataForSeo;
const results = [];
for (const { kw, location } of keywords) {
  try {
    const { pos, url } = await check(kw, location);
    results.push({ kw, pos, url });
    console.log(`  ${kw}: ${pos ? `#${pos}` : '—'}`);
  } catch (e) {
    console.error(`  ${kw}: erro — ${e.message}`);
    results.push({ kw, pos: null, url: '', erro: true });
  }
}

// CSV acumulativo (1 linha por keyword por rodada) — histórico p/ ler tendência.
if (!existsSync(CSV)) writeFileSync(CSV, 'data,keyword,posicao,url\n');
appendFileSync(
  CSV,
  results.map((r) => `${hoje},"${r.kw}",${r.pos ?? ''},${r.url}`).join('\n') + '\n'
);

// Nota do vault (sobrescrita a cada rodada): snapshot atual ordenado por posição.
const ranqueadas = results.filter((r) => r.pos != null).sort((a, b) => a.pos - b.pos);
const fora = results.filter((r) => r.pos == null && !r.erro);
const erros = results.filter((r) => r.erro);
writeFileSync(
  NOTE,
  `---
tipo: medição
status: vivo
data: ${hoje}
dono: automático (rank-tracking.mjs, cron semanal)
---

# 📈 Rank tracking — ${TARGET}

> [!info] Atualizado em ${hoje} — ${ranqueadas.length}/${results.length} keywords no top 50.
> ${nLocal} medidas na SERP de **Goiânia** (porcelanato, B2C local) e ${results.length - nLocal} na SERP **nacional** (fitas, B2B).
> Histórico completo em \`rank-tracking.csv\` (mesma pasta). Fonte: ${SERPER ? 'serper.dev' : 'DataForSEO'} SERP.

## No top 50

| # | Keyword | URL |
|---|---------|-----|
${ranqueadas.map((r) => `| ${r.pos} | ${r.kw} | ${r.url.replace(`https://${TARGET}`, '')} |`).join('\n') || '| — | nenhuma ainda | — |'}

## Fora do top 50 (${fora.length})

${fora.map((r) => `\`${r.kw}\``).join(' · ') || '—'}
${erros.length ? `\n## Erros de consulta (${erros.length})\n\n${erros.map((r) => `\`${r.kw}\``).join(' · ')}\n` : ''}`
);

console.log(`rank-tracking: ${ranqueadas.length}/${results.length} no top 50 → CSV + nota no vault.`);
