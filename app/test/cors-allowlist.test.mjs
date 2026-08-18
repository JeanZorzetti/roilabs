// Runnable check da allowlist de CORS (015 D8) e do open redirect que ela fecha.
// Run: node --import tsx test/cors-allowlist.test.mjs
//
// Por que existe: origem hard-coded duplicada em duas rotas virou allowlist compartilhada,
// e `pedidos/route.ts` confiava em `origin.startsWith('http')` pro redirect pós-checkout —
// qualquer origin de form começando com "http" passava (open redirect). Os dois defeitos
// se fecham com a mesma função: sem prova de que ela reprova o que deve, o fix é só teoria.
import assert from 'node:assert/strict';

const { originValido, corsHeaders } = await import('../src/lib/cors.ts');

// ── Allowlist: só os dois hosts conhecidos ────────────────────────────────────
assert.equal(originValido('https://goiania.roilabs.com.br'), 'https://goiania.roilabs.com.br');
assert.equal(originValido('https://mana.roilabs.com.br'), 'https://mana.roilabs.com.br');
assert.equal(originValido('https://evil.example.com'), null);
assert.equal(originValido(null), null);
assert.equal(originValido(undefined), null);
// O open redirect original: qualquer coisa começando com "http" passava. Isso não pode voltar.
assert.equal(originValido('http://evil.example.com'), null);
assert.equal(originValido('https://goiania.roilabs.com.br.evil.com'), null);

// ── Header: reflete só quando permitido; ausente quando não ──────────────────
assert.deepEqual(corsHeaders('https://mana.roilabs.com.br'), {
  'Access-Control-Allow-Origin': 'https://mana.roilabs.com.br',
});
assert.deepEqual(corsHeaders('https://evil.example.com'), {});
assert.deepEqual(corsHeaders(null), {});

console.log('cors-allowlist: OK');
