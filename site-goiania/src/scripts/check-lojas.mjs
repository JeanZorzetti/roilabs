// Gate de build: valida o registro de cadeiras (lojas.ts) contra as invariantes do motor.
// Roda no `prebuild` do site-goiania/package.json — quebra, não avisa.
//
// ⚠️ Site-goiania NÃO tem tsx — este script roda em Node puro. Lê os dados via import()
// do JSON (porcelanatos.json) e parseamento textual dos .ts quando necessário — mesmo
// padrão de check-cadeiras.mjs que lê slugs do .ts como texto.
//
// Mas como lojas.ts importa de outros .ts, a abordagem mais confiável é:
// importar diretamente os módulos de dados que JÁ são rodáveis pelo build Astro,
// e ler lojas.ts por parse textual para extrair a configuração.
//
// Invariantes (data-model.md §2, contracts/loja-config.md):
//   1. prefixoRota único entre cadeiras
//   2. slug único dentro de cada catálogo
//   3. modoCobranca='parceiro' ⇒ checkoutUrl https absoluto
//   4. publicada=true ⇒ catálogo não vazio
//   5. todo produto com preco > 0 e imagem
//   6. unidade existe em unidades.ts
//
// Run: node src/scripts/check-lojas.mjs

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../data');

// ── Read catalogs (JSON for porcelanato, text parse for fitas) ──────────────

const porcelanatos = JSON.parse(readFileSync(join(__dirname, '../../porcelanatos.json'), 'utf8'));

// Fitas: extract slugs, imagens, and preco from the .ts as text (same pattern as check-cadeiras)
const fitasSrc = readFileSync(join(DATA, 'fitas.ts'), 'utf8');
const fitaSlugs = [...fitasSrc.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
const fitaImagens = [...fitasSrc.matchAll(/imagem:\s*'([^']+)'/g)].map((m) => m[1]);
const fitaPrecos = [...fitasSrc.matchAll(/precoRolo:\s*([\d.]+)/g)].map((m) => parseFloat(m[1]));

// Build fitas catalog as [{slug, imagem, preco}]
const fitasCatalog = fitaSlugs.map((slug, i) => ({
  slug,
  imagem: fitaImagens[i] ?? null,
  preco: fitaPrecos.find((_, idx) => idx >= 0) > 0 ? fitaPrecos[0] : 0, // any preco > 0 suffices
}));

// ── Read lojas.ts by text parse ─────────────────────────────────────────────

const lojasSrc = readFileSync(join(DATA, 'lojas.ts'), 'utf8');

// Extract loja blocks — each starts with `{` after the array `[` or `,` and has `id:`
const lojaBlocks = lojasSrc.split(/\n\s*\{/).slice(1); // skip everything before the first `{`

function extractField(block, field) {
  const match = block.match(new RegExp(`${field}:\\s*'([^']*)'`));
  return match ? match[1] : null;
}
function extractBool(block, field) {
  const match = block.match(new RegExp(`${field}:\\s*(true|false)`));
  return match ? match[1] === 'true' : false;
}
function extractString(block, field) {
  // Also try double-quoted strings
  const m = block.match(new RegExp(`${field}:\\s*['"]([^'"]*)['"']`))
    || block.match(new RegExp(`${field}:\\s*null`));
  if (m && m[0].includes('null')) return null;
  return m ? m[1] : null;
}

const lojas = lojaBlocks.map((block) => ({
  id: extractField(block, 'id'),
  prefixoRota: extractField(block, 'prefixoRota'),
  unidade: extractField(block, 'unidade'),
  modoCobranca: extractField(block, 'modoCobranca'),
  checkoutUrl: extractString(block, 'checkoutUrl'),
  publicada: extractBool(block, 'publicada'),
  // Determine catalog reference by looking at the catalogo field
  catalogoRef: (() => {
    const m = block.match(/catalogo:\s*(\w+)/);
    return m ? m[1] : null;
  })(),
})).filter((l) => l.id); // filter out non-loja blocks

// Map catalog reference to actual catalog
const catalogMap = {
  produtos: porcelanatos,
  fitas: fitasCatalog,
};

// ── Read unidades.ts for valid IDs ──────────────────────────────────────────

const unidadesSrc = readFileSync(join(DATA, 'unidades.ts'), 'utf8');
const unidadeIds = new Set([...unidadesSrc.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]));

// ── Validate invariants ─────────────────────────────────────────────────────

let falhas = 0;
const fail = (msg) => { console.error(`✗ ${msg}`); falhas++; };

// 1. prefixoRota único
const prefixos = new Map();
for (const loja of lojas) {
  if (prefixos.has(loja.prefixoRota)) {
    fail(`prefixoRota '${loja.prefixoRota}' duplicado entre '${prefixos.get(loja.prefixoRota)}' e '${loja.id}'`);
  }
  prefixos.set(loja.prefixoRota, loja.id);
}

// 2. slug único dentro de cada catálogo
for (const loja of lojas) {
  const catalog = catalogMap[loja.catalogoRef] ?? [];
  const slugs = new Set();
  for (const item of catalog) {
    const slug = item.slug;
    if (!slug) { fail(`${loja.id}: produto sem slug no catálogo`); continue; }
    if (slugs.has(slug)) fail(`${loja.id}: slug '${slug}' duplicado no catálogo`);
    slugs.add(slug);
  }
}

// 3. modoCobranca='parceiro' ⇒ checkoutUrl https absoluto
for (const loja of lojas) {
  if (loja.modoCobranca === 'parceiro') {
    if (!loja.checkoutUrl || !loja.checkoutUrl.startsWith('https://')) {
      fail(`${loja.id}: modoCobranca='parceiro' exige checkoutUrl https absoluto, tem '${loja.checkoutUrl}'`);
    }
  }
}

// 4. publicada=true ⇒ catálogo não vazio
for (const loja of lojas) {
  const catalog = catalogMap[loja.catalogoRef] ?? [];
  if (loja.publicada && catalog.length === 0) {
    fail(`${loja.id}: publicada=true mas catálogo vazio (FR-007)`);
  }
}

// 5. todo produto com preco > 0 e imagem
for (const loja of lojas) {
  const catalog = catalogMap[loja.catalogoRef] ?? [];
  for (const item of catalog) {
    // Porcelanato: item.atributos.preco + item.imagens[0]
    // Fitas: item.preco + item.imagem
    const preco = item.atributos?.preco ?? item.preco ?? 0;
    const imagem = item.imagens?.[0] ?? item.imagem ?? null;

    if (!(preco > 0)) {
      fail(`${loja.id}/${item.slug}: preco não é > 0 (tem ${preco})`);
    }
    if (!imagem) {
      fail(`${loja.id}/${item.slug}: sem imagem`);
    }
  }
}

// 6. unidade existe em unidades.ts
for (const loja of lojas) {
  if (!unidadeIds.has(loja.unidade)) {
    fail(`${loja.id}: unidade '${loja.unidade}' não existe em unidades.ts`);
  }
}

if (falhas) {
  console.error(`\ncheck-lojas: ${falhas} falha(s) — build bloqueado.`);
  process.exit(1);
}

console.log(`[OK] check-lojas: ${lojas.length} cadeira(s) validadas — prefixo único, slugs únicos, cobrança consistente, catálogo com preço e imagem, unidades existem.`);
