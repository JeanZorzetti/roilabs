// Self-check: matriz de categorias + catálogo de produtos.
// Roda via prebuild e manualmente: node src/scripts/check-matrix.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../data/porcelanato.ts'), 'utf8');

const slugs   = [...src.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
const volumes = [...src.matchAll(/volume:\s*(\d+)/g)].map((m) => parseInt(m[1], 10));
const titulos = [...src.matchAll(/titulo:\s*['"`]([^'"`\n]{4,})/g)].map((m) => m[1]);
// dimensao com valor string existe em toda entrada de dados; a interface usa `dimensao?: string`
// (sem aspas), então não é contada — só os dados.
const dimAll  = [...src.matchAll(/dimensao:\s*['"]/g)];
const faqAll  = [...src.matchAll(/faq:\s*\[/g)];

let errors = 0;

// ── Categorias ──
const n = slugs.length;
if (n === 0) { console.error('[ERRO] Nenhum slug de categoria encontrado'); process.exit(1); }
if (volumes.length !== n) console.warn(`[AVISO] volumes(${volumes.length}) !== slugs(${n})`);

const seen = new Set();
for (const s of slugs) {
  if (seen.has(s)) { console.error(`[ERRO] slug de categoria duplicado: "${s}"`); errors++; }
  seen.add(s);
}
for (let i = 0; i < Math.min(n, volumes.length); i++) {
  if (!volumes[i] || volumes[i] <= 0) {
    console.error(`[ERRO] volume <= 0 em slug[${i}]="${slugs[i]}" (volume=${volumes[i]})`);
    errors++;
  }
}
if (titulos.length !== n) { console.error(`[ERRO] titulos(${titulos.length}) !== slugs(${n})`); errors++; }
if (dimAll.length !== n)  { console.error(`[ERRO] atributos/dimensao(${dimAll.length}) !== slugs(${n})`); errors++; }
if (faqAll.length !== n)  { console.error(`[ERRO] faq(${faqAll.length}) !== slugs(${n})`); errors++; }

// ── Produtos (catálogo minerado) ──
let produtos = [];
try {
  produtos = JSON.parse(readFileSync(join(__dirname, '../../porcelanatos.json'), 'utf8'));
} catch (e) {
  console.error(`[ERRO] não consegui ler/parsear porcelanatos.json: ${e.message}`);
  errors++;
}

const seenP = new Set();
for (const p of produtos) {
  if (!p.slug) { console.error('[ERRO] produto sem slug'); errors++; continue; }
  if (seenP.has(p.slug)) { console.error(`[ERRO] slug de produto duplicado: "${p.slug}"`); errors++; }
  seenP.add(p.slug);
  if (!Array.isArray(p.imagens) || p.imagens.length === 0) {
    console.error(`[ERRO] produto sem imagem: "${p.slug}"`); errors++;
  }
  const preco = p.atributos?.preco;
  if (!(typeof preco === 'number' && preco > 0)) {
    console.error(`[ERRO] produto com preço inválido: "${p.slug}" (preco=${preco})`); errors++;
  }
}

if (errors === 0) {
  console.log(`[OK] ${n} categorias + ${produtos.length} produtos — slugs únicos, volume/preço > 0, imagens e FAQ presentes.`);
  process.exit(0);
} else {
  console.error(`[FALHOU] ${errors} erro(s).`);
  process.exit(1);
}
