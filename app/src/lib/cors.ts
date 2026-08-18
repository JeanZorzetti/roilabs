// Allowlist de origem para as rotas lidas cross-origin pelos sites estáticos (015 D8).
// Substitui os `SITE_ORIGIN` hard-coded que existiam duplicados em /api/cupom/validar e
// /api/frete/cotar — cada host novo não soma uma 3ª cópia, entra aqui.
//
// ⚠️ Nunca '*': cupom, frete e estoque não são conteúdo público para qualquer origem.
const ALLOWLIST = new Set([
  'https://goiania.roilabs.com.br',
  'https://mana.roilabs.com.br',
]);

/** Origem na allowlist ⇒ ela mesma (pra refletir no header). Fora ⇒ null. */
export function originValido(origin: string | null | undefined): string | null {
  return origin && ALLOWLIST.has(origin) ? origin : null;
}

/** Origem fora da allowlist não ganha o header — o browser barra a leitura sozinho. */
export function corsHeaders(origin: string | null | undefined): Record<string, string> {
  const o = originValido(origin);
  return o ? { 'Access-Control-Allow-Origin': o } : {};
}
