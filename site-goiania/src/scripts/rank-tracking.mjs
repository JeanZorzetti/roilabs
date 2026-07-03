// Rank tracking semanal da malha pSEO + âncora, contra a SERP real (DataForSEO,
// mesma credencial do open-seo). Leitura de tração ANTES de o GSC maturar.
//
// Uso:  DATAFORSEO_API_KEY=<base64> node site-goiania/src/scripts/rank-tracking.mjs
// Cron: .github/workflows/rank-tracking.yml (semanal, commita o resultado no vault).
//
// Custo REAL (medido 2026-07-03): live regular cobra por profundidade — depth 50
// ≈ $0.01/keyword → ~$0.40/rodada com ~40 keywords. Manter crédito na conta:
// sem saldo a API devolve "Payment Required" (o script registra como erro e segue).
// ponytail: sequencial e live (código simples); migrar p/ task_post em lote (~3× mais
// barato) se o custo semanal passar a importar.
import { readFileSync, appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const KEY = process.env.DATAFORSEO_API_KEY;
if (!KEY) {
  console.error('rank-tracking: defina DATAFORSEO_API_KEY (base64, a mesma do open-seo/.env)');
  process.exit(1);
}

const TARGET = 'goiania.roilabs.com.br';
const CSV = path.join(ROOT, 'Docs/Obsidian/rank-tracking.csv');
const NOTE = path.join(ROOT, 'Docs/Obsidian/rank-tracking.md');
const hoje = new Date().toISOString().slice(0, 10);

// Keywords = termoAlvo de cada página da malha (fonte única) + âncora do Keyword Planner.
const dataTs = readFileSync(path.join(ROOT, 'site-goiania/src/data/porcelanato.ts'), 'utf8');
const keywords = [
  ...new Set([
    'porcelanato goiânia',
    ...[...dataTs.matchAll(/termoAlvo:\s*'([^']+)'/g)].map((m) => m[1]),
  ]),
];

console.log(`rank-tracking ${hoje}: ${keywords.length} keywords, alvo ${TARGET}`);

const results = [];
for (const kw of keywords) {
  const body = JSON.stringify([
    { keyword: kw, location_name: 'Goiania,State of Goias,Brazil', language_code: 'pt', depth: 50 },
  ]);
  try {
    const r = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/regular', {
      method: 'POST',
      headers: { Authorization: `Basic ${KEY}`, 'Content-Type': 'application/json' },
      body,
    });
    const j = await r.json();
    const task = j?.tasks?.[0];
    if (task?.status_code !== 20000) {
      console.error(`  ${kw}: erro API — ${task?.status_message ?? j?.status_message}`);
      results.push({ kw, pos: null, url: '', erro: true });
      continue;
    }
    const items = task.result?.[0]?.items ?? [];
    const hit = items.find((i) => i.domain === TARGET || (i.url ?? '').includes(TARGET));
    results.push({ kw, pos: hit?.rank_absolute ?? null, url: hit?.url ?? '' });
    console.log(`  ${kw}: ${hit ? `#${hit.rank_absolute}` : '—'}`);
  } catch (e) {
    console.error(`  ${kw}: falha de rede — ${e.message}`);
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

> [!info] Atualizado em ${hoje} — ${ranqueadas.length}/${results.length} keywords no top 50 (Google, Goiânia).
> Histórico completo em \`rank-tracking.csv\` (mesma pasta). Fonte: DataForSEO SERP.

## No top 50

| # | Keyword | URL |
|---|---------|-----|
${ranqueadas.map((r) => `| ${r.pos} | ${r.kw} | ${r.url.replace(`https://${TARGET}`, '')} |`).join('\n') || '| — | nenhuma ainda | — |'}

## Fora do top 50 (${fora.length})

${fora.map((r) => `\`${r.kw}\``).join(' · ') || '—'}
${erros.length ? `\n## Erros de consulta (${erros.length})\n\n${erros.map((r) => `\`${r.kw}\``).join(' · ')}\n` : ''}`
);

console.log(`rank-tracking: ${ranqueadas.length}/${results.length} no top 50 → CSV + nota no vault.`);
