// Mapa URL antiga → URL nova do corte de domínio (spec 012, T060/T061 · US4).
// Run: node src/scripts/mapa-301.mjs [novo-host]
//
// ⚠️ ESTA É A FASE QUE PODE DESTRUIR ATIVO. A malha de porcelanato (41 páginas pSEO +
// 5 guias) é a moeda de troca que vende a cadeira vaga (FR-018), e ela tem histórico no
// GSC. Toda URL indexada hoje TEM de responder 301 — nunca 404, nunca 302.
//
// O mapa sai do MESMO `dist/` que o site serve, não de uma lista escrita à mão: lista à mão
// esquece página, e a página esquecida é a que vira 404.
//
// Sem argumento, usa o host ASSUMIDO. O label real é decisão pendente do Jean (T058) e
// trocá-lo aqui é uma linha — enquanto o corte não acontecer, nada quebra.

import { readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ANTIGO = 'goiania.roilabs.com.br';
// ⚠️ UM LABEL SÓ: o cert Universal da Cloudflare cobre apex + um nível. Um segundo nível
// (www.loja.roilabs.com.br) quebra no handshake — é o que já acontece com `www.sirius` e
// `www.goiania`.
const NOVO = process.argv[2] ?? 'loja.roilabs.com.br';

if (NOVO.replace('.roilabs.com.br', '').includes('.')) {
  console.error(`✗ "${NOVO}" tem mais de um label sob roilabs.com.br — o cert Universal não cobre.`);
  process.exit(1);
}

const DIST = 'dist';
if (!existsSync(DIST)) {
  console.error(`✗ ${DIST}/ não existe. Rode \`npm run build\` antes: o mapa sai do que o site SERVE.`);
  process.exit(1);
}

/** Toda rota que o Astro emitiu, como caminho com barra final (formato directory). */
function rotas(dir = DIST) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      saida.push(...rotas(caminho));
    } else if (nome === 'index.html') {
      const rel = relative(DIST, dir).split('\\').join('/');
      saida.push(rel === '' ? '/' : `/${rel}/`);
    }
  }
  return saida;
}

const todas = rotas().sort();

// Agrupa para o operador CONFERIR a contagem contra o que o GSC mostra, em vez de confiar.
const grupo = (p) => {
  if (p === '/') return 'home';
  if (p.startsWith('/porcelanato/')) return 'pSEO porcelanato';
  if (p.startsWith('/guia/')) return 'guias';
  if (p.startsWith('/inspire-se/')) return 'inspire-se';
  if (p.startsWith('/fitas/')) return 'fitas';
  if (p.startsWith('/cadeira/')) return 'cadeiras (012)';
  return 'institucional/ferramentas';
};

const porGrupo = new Map();
for (const p of todas) porGrupo.set(grupo(p), [...(porGrupo.get(grupo(p)) ?? []), p]);

console.log(`mapa 301: ${ANTIGO} → ${NOVO}\n`);
for (const [g, ps] of [...porGrupo].sort()) console.log(`  ${String(ps.length).padStart(3)} · ${g}`);
console.log(`  ${String(todas.length).padStart(3)} · TOTAL\n`);

// ⚠️ 301 1:1 preservando o caminho. Redirecionar tudo para a home é o erro clássico: o
// Google trata 301-para-home como soft-404 e o histórico da URL antiga evapora.
const conf = [
  `# 301 do corte de domínio da spec 012 (FR-015). Gerado por src/scripts/mapa-301.mjs.`,
  `# ${todas.length} URLs, ${ANTIGO} → ${NOVO}, caminho PRESERVADO 1:1.`,
  `#`,
  `# ⚠️ NUNCA trocar por um \`return 301 https://${NOVO}/\` genérico: 301-para-home é lido`,
  `# como soft-404 e o histórico da URL antiga some. O $request_uri é o ponto todo.`,
  `#`,
  `# ⚠️ Conferir o handshake TLS do destino SEM \`curl -k\` antes de ligar isto — a flag`,
  `# esconde exatamente o erro de cert que derruba o browser.`,
  `server {`,
  `  listen 80;`,
  `  listen 443 ssl;`,
  `  server_name ${ANTIGO};`,
  `  # absolute_redirect off evita o 301 para http:// em URL sem barra final.`,
  `  absolute_redirect off;`,
  `  return 301 https://${NOVO}$request_uri;`,
  `}`,
].join('\n');

// Artefatos versionados na spec: o mapa é evidência de entrega, não arquivo temporário.
const SAIDA = '../specs/012-carteira-cadeiras-ecommerce/snapshots';
mkdirSync(SAIDA, { recursive: true });
writeFileSync(join(SAIDA, '301-corte-dominio.conf'), conf + '\n');
writeFileSync(
  join(SAIDA, 'mapa-301.txt'),
  todas.map((p) => `https://${ANTIGO}${p}\thttps://${NOVO}${p}`).join('\n') + '\n',
);

console.log(`gravados em ${SAIDA}/: 301-corte-dominio.conf · mapa-301.txt`);

// ⚠️ A spec estimou "41 páginas pSEO + 5 guias" = 46 URLs. O que o site SERVE é outra
// coisa: 41 slugs de porcelanato viram ~71 URLs (os combos da spec 008) e há 13 guias,
// não 5. Um mapa 301 feito pela contagem da spec deixaria a diferença em 404 — que é
// destruição de ativo, exatamente o que esta fase existe para evitar.
if (todas.length > 60) {
  console.log(`\n⚠️  ${todas.length} URLs — bem acima das 46 que a spec estimou.`);
  console.log('   Confira o mapa contra o GSC antes do corte; a estimativa da spec é velha.');
}
console.log('\nAntes de ligar o corte:');
console.log('  1. handshake TLS do destino verificado SEM curl -k (FR-017)');
console.log('  2. o mapa acima conferido contra as URLs que o GSC mostra indexadas');
console.log('  3. sitemap novo submetido e o CORPO validado (<?xml), nunca o status 200');
