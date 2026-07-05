// Recently viewed products (localStorage, no login) — same pattern as
// favoritos.ts. Stores only slugs, most recent first, capped at 6; product
// data always comes from the catalog at render time.
const KEY = 'roi_vistos_v1';
const MAX = 6;

export function getVistos(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

/** Moves (or adds) a slug to the front of the trail, keeping the last 6. */
export function registrarVisto(slug: string) {
  if (typeof localStorage === 'undefined') return;
  const lista = [slug, ...getVistos().filter((s) => s !== slug)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(lista));
}
