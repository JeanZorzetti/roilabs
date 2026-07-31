// Default Goiânia chair map — SEED + display fallback. The DB is the source of truth:
// the site fetches /api/cadeiras live in the browser and overwrites its static skeleton,
// so /admin edits reflect without a rebuild. This list seeds the DB and mirrors the
// site's no-JS fallback in site/src/pages/index.astro; live data wins when JS runs.
export const DEFAULT_SEATS = [
  { niche: 'Revestimentos / Porcelanato', status: 'Curadoria aberta', open: true },
  { niche: 'Materiais de construção', status: 'Em estudo', open: false },
  { niche: 'Esquadrias / Vidraçaria', status: 'Em estudo', open: false },
  { niche: 'Iluminação / Elétrica', status: 'Em estudo', open: false },
  { niche: 'Marcenaria sob medida', status: 'Em estudo', open: false },
  { niche: 'Pisos / Deck externo', status: 'Em estudo', open: false },
  // Primeira cadeira ocupada: Tapepro (fitas adesivas personalizadas, B2B). open:false = fora
  // de curadoria (já preenchida). O link/estado visual "ocupada" vive no site (presentational).
  { niche: 'Fitas adesivas', status: 'Ocupada · Tapepro', open: false },
  { niche: 'Ortodontia / Alinhadores', status: 'Ocupada · Atma Aligner', open: false },
] as const;
