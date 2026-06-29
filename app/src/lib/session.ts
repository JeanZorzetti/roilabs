import crypto from 'node:crypto';

// Single internal login: an HMAC-signed cookie, no DB sessions, no NextAuth.
// ponytail: one shared credential; add per-user sessions only if roles arrive.
export const SESSION_COOKIE = 'roilabs_admin';
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function sign(payload: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSession(): string {
  const exp = Date.now() + TTL_MS;
  return `${exp}.${sign(String(exp))}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sign(expStr);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Constant-time password check at the trust boundary.
export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? '';
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
