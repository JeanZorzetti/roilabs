// Regressão do "The server does not support SSL connections" em /admin/contratos.
// O roilabs_db não tem TLS e a DATABASE_URL de produção é escrita para o Prisma: o pool
// das telas da Vértice (openPool) tem que conectar com qualquer URL com que o Prisma
// conecta. Um servidor falso faz o papel do roilabs_db: responde "N" ao pedido de TLS e
// aceita a conexão sem TLS, sem pedir senha.
// Run: node --import tsx test/vertice-db-tls.test.mjs
import assert from 'node:assert/strict';
import net from 'node:net';
import { openPool } from '../src/lib/vertice/db.ts';

const SSL_REQUEST = 80877103;
const seen = []; // uma entrada por conexão recebida: 'tls' (pediu TLS) ou 'plain'

const server = net.createServer((socket) => {
  socket.on('error', () => {});
  socket.once('data', (buf) => {
    if (buf.readInt32BE(4) === SSL_REQUEST) {
      seen.push('tls');
      socket.write('N');
      return;
    }
    seen.push('plain');
    // AuthenticationOk + ReadyForQuery: conexão pronta.
    socket.write(Buffer.from([0x52, 0, 0, 0, 8, 0, 0, 0, 0, 0x5a, 0, 0, 0, 5, 0x49]));
  });
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `postgres://u:p@127.0.0.1:${server.address().port}/db`;

// Abre o pool, conecta uma vez e devolve as conexões que o servidor recebeu.
async function connections(query, env = {}) {
  seen.length = 0;
  Object.assign(process.env, env);
  try {
    const pool = await openPool(base + query);
    (await pool.connect()).release();
    await pool.end();
    return [...seen];
  } finally {
    for (const key of Object.keys(env)) delete process.env[key];
  }
}

// ── URLs com que o Prisma conecta: tenta TLS, o servidor recusa, conecta sem ──
for (const query of [
  '?sslmode=prefer',
  '?schema=public&sslmode=prefer',
  '?sslmode=allow',
  '?ssl=true',
  '?sslmode=verify-full',
  '?sslmode=no-verify',
]) {
  assert.deepEqual(await connections(query), ['tls', 'plain'], query);
}
assert.deepEqual(await connections('', { PGSSLMODE: 'require' }), ['tls', 'plain'], 'PGSSLMODE');

// ── TLS não pedido: conecta direto ──
assert.deepEqual(await connections('?sslmode=disable'), ['plain']);
assert.deepEqual(await connections(''), ['plain']);

// ── sslmode=require exige TLS: sem volta, como no Prisma ──
await assert.rejects(connections('?sslmode=require'), /does not support SSL/);
assert.deepEqual(seen, ['tls']);

server.close();
console.log('vertice-db-tls.test.mjs: all assertions passed');
