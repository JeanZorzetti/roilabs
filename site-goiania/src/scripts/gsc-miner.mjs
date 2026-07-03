// GSC miner: minera a Search Console API (grátis) atrás de expansão da malha pSEO —
// substitui a mineração de volume do DataForSEO (sem saldo) quando o GSC maturar (~07-15).
//
// Duas listas, gravadas em Docs/Obsidian/90-medicao/gsc-miner.md:
//   1. Candidatas a PÁGINA NOVA — queries com impressão real cujo melhor resultado NÃO é
//      uma página dedicada (malha/guia/produto): a demanda existe e ninguém é dono dela.
//   2. Quase lá (striking distance) — páginas dedicadas em posição 8–30: interlink/conteúdo
//      empurra pro top; são as vitórias mais baratas.
//
// Auth: service account (JSON inteiro no env GSC_SA_KEY) com acesso de leitura à
// propriedade — setup passo a passo em Docs/Obsidian/80-dev/gsc-miner-setup.md.
// SEM GSC_SA_KEY o script é no-op (exit 0) — o cron roda sem quebrar até a chave existir.
//
// Uso:  GSC_SA_KEY='<json>' node site-goiania/src/scripts/gsc-miner.mjs
// Cron: .github/workflows/rank-tracking.yml (mesmo cron semanal do rank tracking).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createSign } from 'node:crypto';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const NOTE = path.join(ROOT, 'Docs/Obsidian/90-medicao/gsc-miner.md');
const SITE = process.env.GSC_SITE ?? 'https://goiania.roilabs.com.br/'; // propriedade URL-prefix
const MIN_IMPRESSOES_NOVA = 20; // piso p/ candidata a página nova (28 dias)
const MIN_IMPRESSOES_QUASE = 10; // piso p/ striking distance

if (!process.env.GSC_SA_KEY) {
  console.log('gsc-miner: GSC_SA_KEY ausente — no-op (setup em Docs/Obsidian/80-dev/gsc-miner-setup.md)');
  process.exit(0);
}
const sa = JSON.parse(process.env.GSC_SA_KEY);

// ── OAuth de service account sem SDK: JWT RS256 assinado com node:crypto → access token.
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
  iss: sa.client_email,
  scope: 'https://www.googleapis.com/auth/webmasters.readonly',
  aud: 'https://oauth2.googleapis.com/token',
  iat: now,
  exp: now + 3600,
})}`;
const jwt = `${unsigned}.${createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url')}`;

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
});
const token = (await tokenRes.json()).access_token;
if (!token) throw new Error('gsc-miner: falha no token OAuth — service account tem acesso à propriedade?');

// ── Search Analytics: últimos 28 dias (fim D-2, o GSC atrasa ~2 dias), query × page.
const fmt = (d) => d.toISOString().slice(0, 10);
const end = new Date(Date.now() - 2 * 864e5);
const start = new Date(end.getTime() - 28 * 864e5);
const res = await fetch(
  `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: fmt(start),
      endDate: fmt(end),
      dimensions: ['query', 'page'],
      rowLimit: 5000,
    }),
  }
);
const data = await res.json();
if (data.error) throw new Error(`gsc-miner: API ${data.error.code} — ${data.error.message}`);
const rows = data.rows ?? [];
console.log(`gsc-miner: ${rows.length} pares query×page (${fmt(start)} → ${fmt(end)}, ${SITE})`);

// ── Classificação. Página "dedicada" = malha, guia ou produto; o resto (home, hub,
// carrinho, calculadora...) rankeando é sintoma de query órfã.
const dedicada = (url) => /\/(porcelanato\/(produto\/)?[^/]+|guia\/[^/]+)\/?$/.test(url);

// Melhor página por query (mais impressões vence — é a que o Google escolheu de fato).
const porQuery = new Map();
for (const r of rows) {
  const [query, page] = r.keys;
  const atual = porQuery.get(query);
  if (!atual || r.impressions > atual.impressions) porQuery.set(query, { ...r, query, page });
}

const novas = [...porQuery.values()]
  .filter((r) => !dedicada(r.page) && r.impressions >= MIN_IMPRESSOES_NOVA)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 40);

const quaseLa = [...porQuery.values()]
  .filter((r) => dedicada(r.page) && r.position >= 8 && r.position <= 30 && r.impressions >= MIN_IMPRESSOES_QUASE)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 40);

const rel = (u) => u.replace(SITE.replace(/\/$/, ''), '');
const linha = (r) =>
  `| ${r.query} | ${rel(r.page)} | ${r.impressions} | ${r.clicks} | ${r.position.toFixed(1)} |`;

writeFileSync(
  NOTE,
  `---
tipo: medição
status: vivo
data: ${fmt(new Date())}
dono: automático (gsc-miner.mjs, cron semanal)
---

# ⛏️ GSC miner — candidatas de expansão da malha

> [!info] ${fmt(start)} → ${fmt(end)} (28 dias) · ${rows.length} pares query×page · propriedade ${SITE}
> Fonte grátis que substitui a mineração DataForSEO. Critério de página nova continua o
> editorial de sempre: intenção clara + produto real no catálogo (nada de página vazia).

## 1. Candidatas a página nova (query sem página dedicada, ≥ ${MIN_IMPRESSOES_NOVA} impressões)

| Query | Melhor página hoje | Impressões | Cliques | Posição |
|-------|--------------------|-----------:|--------:|--------:|
${novas.map(linha).join('\n') || '| — | nenhuma acima do piso ainda | | | |'}

## 2. Quase lá — striking distance (página dedicada, posição 8–30)

| Query | Página | Impressões | Cliques | Posição |
|-------|--------|-----------:|--------:|--------:|
${quaseLa.map(linha).join('\n') || '| — | nenhuma na faixa ainda | | | |'}
`
);

console.log(`gsc-miner: ${novas.length} candidatas a página nova, ${quaseLa.length} em striking distance → ${path.relative(ROOT, NOTE)}`);
