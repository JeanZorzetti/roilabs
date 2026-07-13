// Structured JSON logging to stdout — Docker/EasyPanel already captures stdout, so
// the platform IS the log transport (Constitution III: plataforma antes de dependência).
//
// ponytail: zero-dep instead of pino. Ceiling: no transports, no child loggers, no
// level filtering, no sampling. Upgrade path: the API below is pino's on purpose —
// swap for `import pino from 'pino'` and delete this file. Pino was rejected today
// because `output: 'standalone'` (next.config.ts) does not reliably trace
// thread-stream's worker files into the bundle, and Constitution II forbids shipping
// what we cannot verify locally — a logger must never be what breaks the deploy.

type Level = 'error' | 'warn' | 'info';

// LGPD: an order carries nome/whatsapp/email/cep. These never reach the log.
// Identify records by id (pedidoId/faturaId) instead — traceable, not personal.
const REDACT = new Set(['nome', 'whatsapp', 'email', 'cep', 'to']);

// JSON.stringify(new Error('x')) === '{}' — the #1 cause of useless error logs.
const serialize = (v: unknown): unknown =>
  v instanceof Error ? { type: v.name, message: v.message, stack: v.stack } : v;

function emit(level: Level, obj: Record<string, unknown>, msg: string): void {
  const rec: Record<string, unknown> = { level, time: Date.now(), msg };
  for (const [k, v] of Object.entries(obj)) {
    rec[k] = REDACT.has(k) ? '[redacted]' : serialize(v);
  }
  // process.stdout, not console.* — Next reformats console output, and the guard in
  // test/log.test.mjs treats src/ as console-free by contract.
  process.stdout.write(JSON.stringify(rec) + '\n');
}

export const log = {
  error: (obj: Record<string, unknown>, msg: string) => emit('error', obj, msg),
  warn: (obj: Record<string, unknown>, msg: string) => emit('warn', obj, msg),
  info: (obj: Record<string, unknown>, msg: string) => emit('info', obj, msg),
};
