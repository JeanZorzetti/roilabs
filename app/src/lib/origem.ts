// First-touch attribution: os sites gravam a página de entrada (query preserva UTMs)
// + referrer externo em localStorage.rlft, e TODO caminho de lead envia como `origem`.
// Sem coluna no DB (inalcançável daqui): a rota grava como sufixo `[origem] ...` na
// mensagem. Upgrade pra coluna real no próximo `db push` manual.

export const origemDe = (mensagem: string | null | undefined) =>
  mensagem?.match(/^\[origem\] (.+)$/m)?.[1];

// Agrupa por página de entrada (pathname), preservando utm_source e referrer externo —
// é o que responde "qual canal/página gera lead": /guia/x, / (utm:instagram), / ← google.com…
export function bucketOrigem(mensagem: string | null | undefined): string {
  const raw = origemDe(mensagem);
  if (!raw) return 'sem origem';
  const [page, ref] = raw.split(' ← ');
  const [path, query] = page.split('?');
  const utm = query ? new URLSearchParams(query).get('utm_source') : null;
  return path + (utm ? ` (utm:${utm})` : '') + (ref ? ` ← ${ref}` : '');
}

/** Contagem por bucket, mais frequente primeiro. */
export function breakdownOrigem(leads: { mensagem: string | null }[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const l of leads) {
    const key = bucketOrigem(l.mensagem);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
