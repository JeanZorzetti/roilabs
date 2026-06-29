// Runnable check for the signed-session contract (no framework): node test/session.test.mjs
// Mirrors src/lib/session.ts so a broken sign/verify fails loudly at the security boundary.
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

process.env.AUTH_SECRET = 'test-secret';
const sign = (p) => crypto.createHmac('sha256', process.env.AUTH_SECRET).update(p).digest('base64url');
const make = (exp) => `${exp}.${sign(String(exp))}`;
function verify(token) {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const a = Buffer.from(token.slice(dot + 1));
  const b = Buffer.from(sign(token.slice(0, dot)));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

assert.equal(verify(make(Date.now() + 10_000)), true, 'valid token accepted');
assert.equal(verify(make(Date.now() - 1)), false, 'expired token rejected');
assert.equal(verify(undefined), false, 'missing token rejected');
assert.equal(verify('garbage'), false, 'malformed token rejected');

// tampered signature
const good = make(Date.now() + 10_000);
const tampered = good.slice(0, -1) + (good.endsWith('a') ? 'b' : 'a');
assert.equal(verify(tampered), false, 'tampered signature rejected');

// tampered expiry (extend life without re-signing)
const exp = good.slice(0, good.indexOf('.'));
assert.equal(verify(`${Number(exp) + 1_000_000}.${good.slice(good.indexOf('.') + 1)}`), false, 'expiry forgery rejected');

console.log('session.test.mjs: all assertions passed');
