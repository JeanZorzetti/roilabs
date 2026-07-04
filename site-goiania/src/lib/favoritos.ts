// Client-side favorites (localStorage, no login) — same pattern as cart.ts.
// Stores only slugs; product data always comes from the catalog at render time.
const KEY = 'roi_fav_v1';
export const FAV_EVENT = 'roi-fav-change';

export function getFavoritos(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function save(slugs: string[]) {
  localStorage.setItem(KEY, JSON.stringify(slugs));
  window.dispatchEvent(new CustomEvent(FAV_EVENT));
}

export function isFavorito(slug: string): boolean {
  return getFavoritos().includes(slug);
}

/** Toggles a slug in/out of favorites; returns the new state. */
export function toggleFavorito(slug: string): boolean {
  const atual = getFavoritos();
  const idx = atual.indexOf(slug);
  if (idx >= 0) {
    atual.splice(idx, 1);
    save(atual);
    return false;
  }
  atual.push(slug);
  save(atual);
  return true;
}

export function removeFavorito(slug: string) {
  save(getFavoritos().filter((s) => s !== slug));
}

export function countFavoritos(): number {
  return getFavoritos().length;
}
