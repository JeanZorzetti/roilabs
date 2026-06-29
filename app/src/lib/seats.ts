// Default Goiânia chair map — SEED only. The site now reads the live map from
// /api/cadeiras at build time, so the DB is the single source of truth for display.
// This list is just the initial seed; edit chairs in /admin/cadeiras after seeding.
export const DEFAULT_SEATS = [
  { niche: 'Revestimentos / Porcelanato', status: 'Curadoria aberta', open: true },
  { niche: 'Materiais de construção', status: 'Em estudo', open: false },
  { niche: 'Esquadrias / Vidraçaria', status: 'Em estudo', open: false },
  { niche: 'Iluminação / Elétrica', status: 'Em estudo', open: false },
  { niche: 'Marcenaria sob medida', status: 'Em estudo', open: false },
  { niche: 'Pisos / Deck externo', status: 'Em estudo', open: false },
] as const;
