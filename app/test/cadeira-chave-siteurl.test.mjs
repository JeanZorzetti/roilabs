// A chave de casamento do seed passou de `niche` para `siteUrl` (012, item 1 do handoff de
// 07/08). Este teste guarda as duas invariantes que a troca CRIOU — nenhuma delas é
// declarada pelo schema no nível da lista, e as duas falham em silêncio no banco:
//
//   1. `siteUrl` repetido entre projetos ⇒ o seed colapsa dois projetos numa linha só.
//   2. `siteUrl` nulo ⇒ o seed cai no fallback por `niche`, e renomear o rótulo desse
//      projeto volta a DUPLICAR a cadeira — o bug exato que a troca de chave matou.
//
// A #2 não é erro: é o estado honesto de um projeto sem site apurado. O teste a torna
// VISÍVEL, listando quem ainda depende do fallback, em vez de deixar a regressão silenciosa.
import assert from 'node:assert/strict';
import { DEFAULT_SEATS, PROJETOS_CADEIRA } from '../src/lib/seats.ts';
import { carteira } from '../../site/src/data/carteira.ts';
import { nomeExibido, rotuloPublico } from '../src/lib/carteira/produto.ts';

// 1 — siteUrl único entre as cadeiras de projeto.
const urls = PROJETOS_CADEIRA.map((p) => p.siteUrl).filter(Boolean);
assert.equal(new Set(urls).size, urls.length, 'siteUrl repetido em PROJETOS_CADEIRA — o seed colapsaria dois projetos');

// 2 — quem ainda casa por `niche`. Hoje: ninguém.
const semSite = PROJETOS_CADEIRA.filter((p) => !p.siteUrl).map((p) => p.slug);
assert.deepEqual(semSite, [], `projetos sem siteUrl caem no fallback por niche e voltam a duplicar ao renomear: ${semSite}`);

// 3 — o skeleton no-JS da home (arquivo GERADO) tem de espelhar a mesma fonte. Fora de sync,
// o visitante sem JS vê rótulo velho e o card fica byte-idêntico com a API em 200 ou em 500.
// Regerar: `cd app && npm run gen:carteira`.
const nichos = new Set(DEFAULT_SEATS.map((s) => s.niche));
const esperado = PROJETOS_CADEIRA.filter((p) => !nichos.has(p.niche)).map((p, i) => ({
  niche: p.niche,
  estado: p.estado,
  rotulo: rotuloPublico(p),
  nome: nomeExibido(p.status),
  siteUrl: p.siteUrl,
  ordem: DEFAULT_SEATS.length + i,
}));
assert.deepEqual(carteira, esperado, 'site/src/data/carteira.ts desatualizado — rode `npm run gen:carteira`');

// 3b — o nome que a home passou a exibir (07/08). Curadoria com o separador errado produz
// legenda vazia ("No ar · ") ou com o prefixo dentro ("No ar · Ocupada · X"), e as duas
// só apareceriam na tela publicada.
for (const p of PROJETOS_CADEIRA) {
  const nome = nomeExibido(p.status);
  assert.ok(nome.length > 0, `${p.slug}: status "${p.status}" não produz nome exibível`);
  assert.ok(!nome.includes('·'), `${p.slug}: nome "${nome}" ainda carrega o prefixo de estado`);
}

// 4 — FR-010a: o skeleton publica `rotulo` resolvido e NUNCA a marcação interna `daCasa`.
assert.ok(
  carteira.every((c) => !('daCasa' in c) && (c.rotulo === 'casa' || c.rotulo === 'parceiro')),
  'daCasa vazou para o HTML público'
);

console.log(`ok — chave siteUrl: ${urls.length} únicas, 0 no fallback, skeleton com ${carteira.length} cadeiras`);
