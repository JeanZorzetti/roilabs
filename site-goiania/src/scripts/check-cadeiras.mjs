// Verificador do piso de FR-014 (spec 012, T047/T050). Roda no `prebuild` e no `postbuild`.
//
// Piso, por página de cadeira publicada:
//   • ≥ 800 palavras no HTML INICIAL
//   • a pergunta de preço respondida EXPLICITAMENTE no corpo (não só no Offer)
//   • ≥ 6 pares de FAQ
//
// É PISO CONTRA PÁGINA FINA, não promessa de ranking: a medição da Atma provou que esforço
// por artigo não prediz tráfego (o vencedor é o 6º maior de 22). O que ele impede é o
// resultado conhecido de replicar template — 7 páginas finas derrubando a média do domínio.
//
// ⚠️ A ARMADILHA QUE ESTE ARQUIVO EXISTE PARA NÃO REPETIR:
// contar palavra com `sed 's/<script[^>]*>.*<\/script>//g'` NÃO funciona. Em HTML minificado
// — que é o que o Astro emite — o `.*` é GULOSO e come do primeiro `<script>` até o ÚLTIMO
// `</script>` do arquivo, levando o corpo inteiro junto. O resultado é 0 palavra numa página
// que tem `<h1>`, e o verificador aprova a página fina por engano. A correção é o
// quantificador PREGUIÇOSO (`[\s\S]*?`), e é a única razão de a regex abaixo ser assim.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const MIN_PALAVRAS = 800;
const MIN_FAQ = 6;
const DIST = 'dist';

/** Remove script/style/template e comentários. Preguiçoso, NUNCA guloso. */
export function textoVisivel(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function contarPalavras(html) {
  const t = textoVisivel(html);
  if (!t) return 0;
  // Palavra = sequência com ao menos uma letra ou dígito. Assim "—" e "·" não contam,
  // e "R$" conta como um token só — inflar contagem com pontuação é o mesmo autoengano.
  return (t.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;
}

/** FR-014: a pergunta de preço respondida no CORPO, não só no Offer do JSON-LD. */
export function temPrecoNoCorpo(html) {
  return /R\$\s?\d/.test(textoVisivel(html));
}

/** Conta os pares de FAQ pelo JSON-LD — é a mesma fonte que o Google lê. */
export function contarFaq(html) {
  const blocos = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script\s*>/gi) ?? [];
  let total = 0;
  for (const bloco of blocos) {
    const cru = bloco.replace(/^<script[^>]*>/i, '').replace(/<\/script\s*>$/i, '');
    let dados;
    try { dados = JSON.parse(cru); } catch { continue; }
    for (const no of dados['@graph'] ?? [dados]) {
      if (no?.['@type'] === 'FAQPage') total += (no.mainEntity ?? []).length;
    }
  }
  return total;
}

/** Product/Offer com preço — FR-013. */
export function temOfferComPreco(html) {
  const blocos = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script\s*>/gi) ?? [];
  for (const bloco of blocos) {
    const cru = bloco.replace(/^<script[^>]*>/i, '').replace(/<\/script\s*>$/i, '');
    let dados;
    try { dados = JSON.parse(cru); } catch { continue; }
    for (const no of dados['@graph'] ?? [dados]) {
      if (no?.['@type'] === 'Product' && no.offers?.price != null) return true;
    }
  }
  return false;
}

export function verificar(html) {
  const palavras = contarPalavras(html);
  const faq = contarFaq(html);
  const falhas = [];
  if (palavras < MIN_PALAVRAS) falhas.push(`${palavras} palavras (piso ${MIN_PALAVRAS})`);
  if (!temPrecoNoCorpo(html)) falhas.push('preço não aparece no corpo — só no Offer não vale');
  if (faq < MIN_FAQ) falhas.push(`${faq} FAQ (piso ${MIN_FAQ})`);
  if (!temOfferComPreco(html)) falhas.push('sem Product/Offer com preço no @graph (FR-013)');
  return { palavras, faq, falhas };
}

// ── Auto-teste do próprio verificador ────────────────────────────────────────
// `node src/scripts/check-cadeiras.mjs --self-test`
// A regra da casa é que lógica não-trivial deixa UM check rodável. Aqui ela é obrigatória:
// um contador de palavras quebrado APROVA página fina, que é exatamente o defeito que este
// arquivo existe para impedir. Um verificador sem verificação não verifica nada.
if (process.argv.includes('--self-test')) {
  const eq = (a, b, msg) => { if (a !== b) { console.error(`✗ ${msg}: ${a} ≠ ${b}`); process.exit(1); } };

  // ⚠️ O CASO QUE MOTIVOU TUDO: HTML MINIFICADO com dois <script>, como o Astro emite.
  // Com o `.*` guloso do sed, tudo entre o 1º <script> e o ÚLTIMO </script> some — e esta
  // página, que tem h1 e parágrafo, devolveria 0 palavra.
  const minificado = '<script>var a=1</script><h1>Preço do plano</h1><p>Custa R$ 199 por mês.</p><script>var b=2</script>';
  eq(contarPalavras(minificado), 8, 'guloso comeu o corpo entre dois <script>');
  eq(temPrecoNoCorpo(minificado), true, 'preço no corpo');

  // Só script → zero mesmo.
  eq(contarPalavras('<script>var a=1;var b=2</script>'), 0, 'script não conta como conteúdo');
  // Shell de SPA: div vazia é 0 — é o defeito de tapevision/potencialarquitetado/pathfinder.
  eq(contarPalavras('<div id="root"></div><script src="/app.js"></script>'), 0, 'shell de SPA');
  // Estilo e comentário também não contam.
  eq(contarPalavras('<style>.a{color:red}</style><!-- oculto --><p>uma duas três</p>'), 3, 'style/comentário');
  // Pontuação não infla: "—" e "·" não são palavra.
  eq(contarPalavras('<p>uma — duas · três</p>'), 3, 'pontuação não conta');
  // Preço só no JSON-LD NÃO vale (FR-014 exige no corpo).
  eq(temPrecoNoCorpo('<script type="application/ld+json">{"offers":{"price":199}}</script><p>Sem preço aqui.</p>'), false, 'preço só no Offer não vale');

  const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
  const faq6 = { '@graph': [{ '@type': 'FAQPage', mainEntity: Array.from({ length: 6 }, (_, i) => ({ name: `p${i}` })) }] };
  eq(contarFaq(ld(faq6)), 6, 'contagem de FAQ');
  eq(contarFaq(ld({ '@graph': [{ '@type': 'FAQPage', mainEntity: [{ name: 'p' }] }] })), 1, 'FAQ abaixo do piso');
  eq(contarFaq('<p>sem json-ld</p>'), 0, 'sem FAQ');
  // JSON-LD quebrado não pode derrubar o script nem virar aprovação silenciosa.
  eq(contarFaq('<script type="application/ld+json">{quebrado</script>'), 0, 'json-ld inválido');
  eq(temOfferComPreco(ld({ '@graph': [{ '@type': 'Product', offers: { price: 199 } }] })), true, 'Offer com preço');
  eq(temOfferComPreco(ld({ '@graph': [{ '@type': 'Product' }] })), false, 'Product sem preço');

  // O portão inteiro: página fina reprova, e diz por quê.
  const fina = verificar('<h1>Plano</h1><p>Bom.</p>');
  eq(fina.falhas.length, 4, 'página fina reprova em tudo');

  console.log('check-cadeiras --self-test: all assertions passed');
  process.exit(0);
}

// ── Execução ─────────────────────────────────────────────────────────────────
// Valida o HTML SERVIDO em `dist/`. ⚠️ Validar o dado não substitui validar o HTML: o que o
// Googlebot lê é o HTML, e é lá que o shell de SPA aparece.
const alvo = process.argv[2] ?? DIST;

// Leitura textual do .ts — `node` puro não importa TypeScript, e um parse de `slug:` +
// `publicado:` basta para saber quais páginas TÊM de existir.
const fonte = readFileSync('src/data/cadeiras.ts', 'utf8');
const slugs = fonte
  .split(/\bslug:\s*'/)
  .slice(1)
  .map((bloco) => ({
    slug: bloco.slice(0, bloco.indexOf("'")),
    publicado: /publicado:\s*true/.test(bloco.split(/\bslug:\s*'/)[0]),
  }))
  .filter((c) => c.publicado)
  .map((c) => c.slug);

if (slugs.length === 0) {
  // ⚠️ Zero páginas NÃO é aprovação: é ausência de medição. Dizer isso em voz alta evita
  // que "o check passou" seja lido como "as páginas estão boas" — é a mesma diferença
  // entre 200 no sitemap e sitemap válido.
  console.log('check-cadeiras: nenhuma cadeira publicada — NADA foi medido (não é aprovação).');
  process.exit(0);
}

let reprovadas = 0;
for (const slug of slugs) {
  const arquivo = join(alvo, 'cadeira', slug, 'index.html');
  if (!existsSync(arquivo)) {
    console.error(`✗ ${slug}: ${arquivo} não existe — a página publicada não foi gerada`);
    reprovadas++;
    continue;
  }
  const { palavras, faq, falhas } = verificar(readFileSync(arquivo, 'utf8'));
  if (falhas.length) {
    console.error(`✗ ${slug}: ${falhas.join(' · ')}`);
    reprovadas++;
  } else {
    console.log(`✓ ${slug}: ${palavras} palavras · ${faq} FAQ · preço no corpo · Offer ok`);
  }
}

if (reprovadas) {
  console.error(`\ncheck-cadeiras: ${reprovadas}/${slugs.length} abaixo do piso de FR-014 (SC-006).`);
  process.exit(1);
}
console.log(`check-cadeiras: ${slugs.length}/${slugs.length} acima do piso de FR-014.`);
