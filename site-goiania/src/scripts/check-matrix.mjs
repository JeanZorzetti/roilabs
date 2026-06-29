// Self-check da matriz: slug único, volume > 0, campos obrigatórios.
// Roda via prebuild e manualmente: node src/scripts/check-matrix.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../data/porcelanato.ts'), 'utf8');

const slugs    = [...src.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
const volumes  = [...src.matchAll(/volume:\s*(\d+)/g)].map((m) => parseInt(m[1], 10));
const titulos  = [...src.matchAll(/titulo:\s*['"`]([^'"`\n]{4,})/g)].map((m) => m[1]);
const intros   = [...src.matchAll(/intro:\s*\n?\s*['"`]([\s\S]{10,?}?)['"`]/g)].map((m) => m[1].trim());
// pei:\s*\d matches data entries (pei: 4) but NOT the interface (pei?: number)
const atribAll = [...src.matchAll(/pei:\s*\d/g)];
const faqAll   = [...src.matchAll(/faq:\s*\[/g)];

let errors = 0;

// 1. contagens devem bater
const n = slugs.length;
if (n === 0) { console.error('[ERRO] Nenhum slug encontrado no arquivo'); process.exit(1); }
if (volumes.length !== n) console.warn(`[AVISO] volumes(${volumes.length}) !== slugs(${n}) — verifique o arquivo`);

// 2. slug único
const seen = new Set();
for (const s of slugs) {
  if (seen.has(s)) { console.error(`[ERRO] slug duplicado: "${s}"`); errors++; }
  seen.add(s);
}

// 3. volume > 0
for (let i = 0; i < Math.min(n, volumes.length); i++) {
  if (!volumes[i] || volumes[i] <= 0) {
    console.error(`[ERRO] volume <= 0 em slug[${i}]="${slugs[i]}" (volume=${volumes[i]})`);
    errors++;
  }
}

// 4. titulo presente
if (titulos.length !== n) {
  console.error(`[ERRO] titulos(${titulos.length}) !== slugs(${n})`);
  errors++;
}

// 5. atributos e faq presentes (1 por entrada)
if (atribAll.length !== n) {
  console.error(`[ERRO] atributos(${atribAll.length}) !== slugs(${n})`);
  errors++;
}
if (faqAll.length !== n) {
  console.error(`[ERRO] faq(${faqAll.length}) !== slugs(${n})`);
  errors++;
}

if (errors === 0) {
  console.log(`[OK] matriz: ${n} entradas — slug único, volume > 0, titulo+atributos+faq presentes.`);
  process.exit(0);
} else {
  console.error(`[FALHOU] ${errors} erro(s) na matriz de porcelanato.`);
  process.exit(1);
}
