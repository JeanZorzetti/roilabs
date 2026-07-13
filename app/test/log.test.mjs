// Runnable check for lib/log.ts + the no-console guard over src/.
// Run: node --import tsx test/log.test.mjs
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from '../src/lib/log.ts';

// Capture what the logger writes to stdout instead of printing it.
function capture(fn) {
  const lines = [];
  const real = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => (lines.push(String(chunk)), true);
  try {
    fn();
  } finally {
    process.stdout.write = real;
  }
  return lines.map((l) => JSON.parse(l));
}

// ── shape: one JSON object per line, with level/msg/time ───────────────────────
{
  const [rec] = capture(() => log.info({ pedidoId: 'abc' }, 'pedido pago'));
  assert.equal(rec.level, 'info');
  assert.equal(rec.msg, 'pedido pago');
  assert.equal(rec.pedidoId, 'abc');
  assert.equal(typeof rec.time, 'number', 'time é epoch ms');
}

// ── Error serialization: the whole reason this file exists ────────────────────
// JSON.stringify(new Error('x')) === '{}' — a log that drops the message and the
// stack is worse than no log, because it looks like it worked.
{
  const [rec] = capture(() => log.error({ err: new TypeError('boom') }, 'falhou'));
  assert.equal(rec.err.type, 'TypeError');
  assert.equal(rec.err.message, 'boom');
  assert.match(rec.err.stack, /log\.test\.mjs/, 'stack preservada');
}

// ── LGPD: personal data never reaches the log ─────────────────────────────────
{
  const [rec] = capture(() =>
    log.error(
      { nome: 'Fulano', whatsapp: '62999999999', email: 'f@x.com', cep: '74000-000', pedidoId: 'p1' },
      'checkout falhou'
    )
  );
  for (const k of ['nome', 'whatsapp', 'email', 'cep']) {
    assert.equal(rec[k], '[redacted]', `${k} redigido`);
  }
  assert.equal(rec.pedidoId, 'p1', 'id NÃO é redigido — é a chave de rastreio');
}

// ── guard: src/ stays console-free, so the sweep cannot silently regress ──────
// Replaces an ESLint no-console rule: `next lint` is deprecated in Next 16 and the
// app has no ESLint config — a whole toolchain for one rule is not worth it.
// ponytail: plain text scan, no AST. Ceiling: a `console.` inside a string literal
// or comment would false-positive. Upgrade = ESLint if that ever actually happens.
{
  // fileURLToPath, not .pathname — the repo lives under "ROI Labs", and .pathname
  // hands back the %20 still encoded.
  const SRC = fileURLToPath(new URL('../src/', import.meta.url));
  const offenders = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) {
        walk(p);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry)) continue;
      readFileSync(p, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/\bconsole\.\w+\s*\(/.test(line)) offenders.push(`${p}:${i + 1}`);
        });
    }
  };
  walk(SRC);

  assert.deepEqual(
    offenders,
    [],
    `console.* em src/ — use log de @/lib/log (JSON estruturado + redaction):\n  ${offenders.join('\n  ')}`
  );
}

console.log('log.test.mjs OK');
