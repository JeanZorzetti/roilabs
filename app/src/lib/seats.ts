// Default Goiânia chair map — mirrors the hard-coded seats[] in
// site/src/pages/index.astro. Seed source of truth until the site fetches /api/cadeiras.
export const DEFAULT_SEATS = [
  { niche: 'Revestimentos / Porcelanato', status: 'Curadoria aberta', open: true },
  { niche: 'Materiais de construção', status: 'Em estudo', open: false },
  { niche: 'Esquadrias / Vidraçaria', status: 'Em estudo', open: false },
  { niche: 'Iluminação / Elétrica', status: 'Em estudo', open: false },
  { niche: 'Marcenaria sob medida', status: 'Em estudo', open: false },
  { niche: 'Pisos / Deck externo', status: 'Em estudo', open: false },
] as const;
