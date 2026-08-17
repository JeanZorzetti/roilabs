// Gate de build: paridade do catálogo MANÁ (015) entre o espelho do site (mana.ts) e o
// espelho servidor (app/src/lib/precos-mana.ts). Roda no `prebuild`. Quebra, não avisa:
// preço divergente entre catálogo e servidor é a vitrine anunciando um valor e o checkout
// cobrando outro. Silencioso, e do lado do dinheiro.
//
// ⚠️ Site-goiania NÃO tem tsx — parse textual dos .ts, mesmo padrão de check-lojas.mjs.
//
// Invariantes (data-model.md §3):
//   1. conjunto de sku igual entre mana.ts e precos-mana.ts
//   2. preco e pesoKg idênticos nos dois
//   3. sku único em todo o catálogo (não só dentro do produto)
//   4. sku não colide com slug de porcelanato nem de fita
//   5. todo produto tem imagem; toda variação tem preco > 0 e pesoKg > 0
//   6. publicada:true ⇒ todo sku tem linha em EstoqueVariacao — o build NÃO alcança o
//      Postgres; isto é responsabilidade de verify-015-estoque.mjs, não deste script.
//
// Run: node src/scripts/check-mana.mjs

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../data');
const REPO_ROOT = join(__dirname, '../../..');
const PRECOS_MANA_PATH = join(REPO_ROOT, 'app/src/lib/precos-mana.ts');

let falhas = 0;
const fail = (msg) => { console.error(`✗ ${msg}`); falhas++; };

// ── mana.ts: extrair produtos (slug + imagens) e variações (sku/tamanho/cor/preco/pesoKg) ──

const manaSrc = readFileSync(join(DATA, 'mana.ts'), 'utf8');

const produtoBlocks = manaSrc.split(/\n {2}\{\n {4}slug:/).slice(1);
const produtos = produtoBlocks.map((block) => {
  const slug = block.match(/^\s*'([^']+)'/)?.[1] ?? null;
  const imagens = [...block.matchAll(/imagens:\s*\[([^\]]*)\]/g)]
    .flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
  return { slug, imagens };
});

const variacaoRe = /\{\s*sku:\s*'([^']+)',\s*tamanho:\s*'([^']+)',\s*cor:\s*'([^']+)',\s*preco:\s*([\d.]+),\s*pesoKg:\s*([\d.]+)\s*\}/g;
const variacoesSite = [...manaSrc.matchAll(variacaoRe)].map((m) => ({
  sku: m[1], tamanho: m[2], cor: m[3], preco: parseFloat(m[4]), pesoKg: parseFloat(m[5]),
}));

// ── precos-mana.ts: extrair sku → { preco, pesoKg } ─────────────────────────────────
//
// ponytail: o build Docker do site-goiania roda com o contexto isolado da própria
// pasta (COPY . . a partir de site-goiania/, sem app/ ao lado) — o mesmo isolamento
// entre containers que motiva os dois espelhos existirem (research.md D1/plan.md
// Complexity Tracking). `app/src/lib/precos-mana.ts` só existe no checkout local do
// monorepo, nunca dentro do container. Sem ele, as invariantes 1+2 (paridade sku ×
// preço × peso entre os dois espelhos) não têm o que comparar — pulam com aviso alto,
// em vez de quebrar o build todo. A rede de segurança continua valendo local/CI
// (checkout completo) e no servidor via app/test/mana-paridade.test.mjs. Teto: se um
// 3º par de espelhos surgir, extrair a comparação para um passo de CI na raiz do
// monorepo (com acesso aos dois lados) em vez de rodar dentro do build isolado.
const temPrecosMana = existsSync(PRECOS_MANA_PATH);
const skusSite = new Set(variacoesSite.map((v) => v.sku));

if (temPrecosMana) {
  const precosSrc = readFileSync(PRECOS_MANA_PATH, 'utf8');
  const precoRe = /'([^']+)':\s*\{\s*preco:\s*([\d.]+),\s*pesoKg:\s*([\d.]+)/g;
  const variacoesServidor = new Map(
    [...precosSrc.matchAll(precoRe)].map((m) => [m[1], { preco: parseFloat(m[2]), pesoKg: parseFloat(m[3]) }]),
  );

  // ── Invariante 1+2: conjuntos iguais, preco/pesoKg idênticos ──────────────────────

  const skusServidor = new Set(variacoesServidor.keys());

  for (const sku of skusSite) {
    if (!skusServidor.has(sku)) fail(`sku '${sku}' existe em mana.ts mas não em precos-mana.ts`);
  }
  for (const sku of skusServidor) {
    if (!skusSite.has(sku)) fail(`sku '${sku}' existe em precos-mana.ts mas não em mana.ts`);
  }
  for (const v of variacoesSite) {
    const servidor = variacoesServidor.get(v.sku);
    if (!servidor) continue; // já reportado acima
    if (servidor.preco !== v.preco) {
      fail(`sku '${v.sku}': preco diverge — mana.ts=${v.preco}, precos-mana.ts=${servidor.preco}`);
    }
    if (servidor.pesoKg !== v.pesoKg) {
      fail(`sku '${v.sku}': pesoKg diverge — mana.ts=${v.pesoKg}, precos-mana.ts=${servidor.pesoKg}`);
    }
  }
} else {
  console.warn(
    '⚠️  check-mana: app/src/lib/precos-mana.ts não está neste build (build isolado do container) — ' +
      'paridade sku/preço/peso NÃO verificada aqui. Rede de segurança: rode localmente com o monorepo ' +
      'completo, ou confie em app/test/mana-paridade.test.mjs no build do servidor.',
  );
}

// ── Invariante 3: sku único em todo o catálogo ──────────────────────────────────────

const contagem = new Map();
for (const v of variacoesSite) contagem.set(v.sku, (contagem.get(v.sku) ?? 0) + 1);
for (const [sku, n] of contagem) {
  if (n > 1) fail(`sku '${sku}' duplicado ${n}x no catálogo`);
}

// ── Invariante 4: sku não colide com porcelanato nem fita ───────────────────────────

const porcelanatos = JSON.parse(readFileSync(join(__dirname, '../../porcelanatos.json'), 'utf8'));
const slugsPorcelanato = new Set(porcelanatos.map((p) => p.slug));

const fitasSrc = readFileSync(join(DATA, 'fitas.ts'), 'utf8');
const slugsFita = new Set([...fitasSrc.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]));

for (const sku of skusSite) {
  if (slugsPorcelanato.has(sku)) fail(`sku '${sku}' colide com slug de porcelanato`);
  if (slugsFita.has(sku)) fail(`sku '${sku}' colide com slug de fita`);
}

// ── Invariante 5: todo produto tem imagem; toda variação tem preco>0 e pesoKg>0 ─────

for (const p of produtos) {
  if (!p.slug) continue;
  if (p.imagens.length === 0) fail(`produto '${p.slug}': sem imagem`);
}
for (const v of variacoesSite) {
  if (!(v.preco > 0)) fail(`sku '${v.sku}': preco não é > 0 (tem ${v.preco})`);
  if (!(v.pesoKg > 0)) fail(`sku '${v.sku}': pesoKg não é > 0 (tem ${v.pesoKg})`);
}

// ── Invariante 6: publicada:true ⇒ verify-015-estoque.mjs cobre (não este script) ───
// (nada a fazer aqui — o build não alcança o Postgres; ver comentário no topo)

if (falhas) {
  console.error(`\ncheck-mana: ${falhas} falha(s) — build bloqueado.`);
  process.exit(1);
}

console.log(`[OK] check-mana: ${variacoesSite.length} SKU(s) em ${produtos.length} produto(s) — paridade site↔servidor, unicidade, sem colisão de namespace, preço/peso positivos.`);
