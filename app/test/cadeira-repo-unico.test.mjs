// Runnable check de FR-011 (012, T068): nenhuma cadeira compartilha repoUrl com outra.
// Run: node --import tsx test/cadeira-repo-unico.test.mjs
//
// ⚠️ É TESTE, não constraint, e a escolha é deliberada: `@@unique` em `repoUrl` proibiria
// PARA SEMPRE um repo servir dois sites legítimos — e `goiania` e `roilabs` são exatamente
// isso hoje. Este arquivo é o lugar onde a decisão reaparece se um dia dois sites do mesmo
// repo forem duas cadeiras de verdade.
import assert from 'node:assert/strict';
import { reposDuplicados } from '../src/lib/carteira/agregados.ts';
import { PROJETOS_CADEIRA } from '../src/lib/seats.ts';

const c = (niche, repoUrl) => ({ niche, repoUrl });

// ── O caso que motiva a regra: card ≠ repositório ────────────────────────────
{
  const dup = reposDuplicados([
    c('Revestimentos / Porcelanato', 'https://github.com/jeanzorzetti/roilabs'),
    c('Institucional', 'https://github.com/jeanzorzetti/roilabs'),
    c('CRM / Solar', 'https://github.com/jeanzorzetti/sirius'),
  ]);
  assert.equal(dup.length, 1, 'contar goiania e roilabs como duas cadeiras INFLA a carteira');
  assert.deepEqual(dup[0].niches.sort(), ['Institucional', 'Revestimentos / Porcelanato']);
}

// ── Carteira sã → lista vazia ────────────────────────────────────────────────
assert.deepEqual(reposDuplicados([c('a', 'https://github.com/x/a'), c('b', 'https://github.com/x/b')]), []);

// ── Nulo é "não apurado", NUNCA duplicata ────────────────────────────────────
// A maioria das cadeiras nasce sem repoUrl; tratá-las como iguais acusaria a carteira
// inteira de duplicada e o teste viraria ruído que ninguém lê.
assert.deepEqual(reposDuplicados([c('a', null), c('b', null), c('c', null)]), []);

// ── Mesma URL escrita diferente É a mesma URL ────────────────────────────────
// Barra no fim, `.git`, maiúscula: o defeito passaria batido por comparação crua.
{
  const dup = reposDuplicados([
    c('a', 'https://github.com/x/repo'),
    c('b', 'https://github.com/x/repo/'),
    c('c', 'https://github.com/X/REPO.git'),
  ]);
  assert.equal(dup.length, 1);
  assert.equal(dup[0].niches.length, 3);
}

// ── Repos diferentes com prefixo comum NÃO colidem ───────────────────────────
assert.deepEqual(reposDuplicados([c('a', 'https://github.com/x/repo'), c('b', 'https://github.com/x/repo-2')]), []);

// ── A carteira REAL, não só casos sintéticos ────────────────────────────────
// Enquanto todo repoUrl era nulo, os casos acima passavam e FR-011 valia por vacuidade:
// não havia par para comparar. Com os 9 preenchidos do roihub (07/08), este bloco é o que
// reprova de verdade quando alguém acrescentar uma cadeira apontando para repo já usado —
// `goiania` e `roilabs` são o caso vivo, e é por isso que nenhum dos dois é cadeira.
{
  assert.deepEqual(
    reposDuplicados(PROJETOS_CADEIRA.map((p) => ({ niche: p.niche, repoUrl: p.repoUrl }))),
    [],
    'duas cadeiras no mesmo repo INFLAM a carteira (card ≠ repositório)',
  );
  // O bloco acima passaria com a lista inteira nula. Este garante que ele tem o que comparar.
  const comRepo = PROJETOS_CADEIRA.filter((p) => p.repoUrl).length;
  assert.ok(comRepo >= 9, `só ${comRepo} cadeira(s) com repoUrl — o dedupe volta a ser vácuo`);
}

console.log('cadeira-repo-unico.test.mjs: all assertions passed');
