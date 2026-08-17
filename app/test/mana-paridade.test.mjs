// Runnable check de data-model.md §3 (015, T010): a MESMA checagem do gate de build
// (site-goiania/src/scripts/check-mana.mjs), do lado do servidor. Cobre o que o gate de
// build não pode: rodar como parte de `npm test`, sem depender do pipeline do Astro.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { listarSkus, getVariacao } from '../src/lib/precos-mana.ts';
import { listarProdutos } from '../src/lib/precos.ts';
import { listarFitas } from '../src/lib/precos-fitas.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../..');

// ── Ler mana.ts (site) como texto — mesmo parser do check-mana.mjs ─────────────────
const manaSrc = readFileSync(join(REPO_ROOT, 'site-goiania/src/data/mana.ts'), 'utf8');
const variacaoRe = /\{\s*sku:\s*'([^']+)',\s*tamanho:\s*'([^']+)',\s*cor:\s*'([^']+)',\s*preco:\s*([\d.]+),\s*pesoKg:\s*([\d.]+)\s*\}/g;
const variacoesSite = [...manaSrc.matchAll(variacaoRe)].map((m) => ({
  sku: m[1], preco: parseFloat(m[4]), pesoKg: parseFloat(m[5]),
}));

// ── (1) conjuntos de SKU iguais entre site e servidor ───────────────────────────────
const skusSite = new Set(variacoesSite.map((v) => v.sku));
const skusServidor = new Set(listarSkus());
assert.deepEqual([...skusSite].sort(), [...skusServidor].sort(), 'conjunto de SKU idêntico entre mana.ts e precos-mana.ts');

// ── (2) preco e pesoKg idênticos nos dois ───────────────────────────────────────────
for (const v of variacoesSite) {
  const servidor = getVariacao(v.sku);
  assert.ok(servidor, `sku '${v.sku}' resolve no servidor`);
  assert.equal(servidor.preco, v.preco, `sku '${v.sku}': preco idêntico`);
  assert.equal(servidor.pesoKg, v.pesoKg, `sku '${v.sku}': pesoKg idêntico`);
}

// ── (3) sku único em todo o catálogo ────────────────────────────────────────────────
const contagem = new Map();
for (const sku of listarSkus()) contagem.set(sku, (contagem.get(sku) ?? 0) + 1);
for (const [sku, n] of contagem) {
  assert.equal(n, 1, `sku '${sku}' aparece ${n}x — precisa ser único`);
}

// ── (4) sem colisão de namespace com porcelanato nem fita ──────────────────────────
const slugsPorcelanato = new Set(listarProdutos().map((p) => p.slug));
const slugsFita = new Set(listarFitas().map((f) => f.slug));
for (const sku of skusServidor) {
  assert.ok(!slugsPorcelanato.has(sku), `sku '${sku}' não colide com slug de porcelanato`);
  assert.ok(!slugsFita.has(sku), `sku '${sku}' não colide com slug de fita`);
}

console.log(`[OK] mana-paridade: ${skusServidor.size} SKU(s) — paridade site↔servidor, unicidade, sem colisão de namespace com porcelanato/fitas`);
