// Cadeiras de FORNECEDOR (o mapa de nichos da home).
// Skeleton ESTÁTICO (SEO + no-JS): a verdade vem do DB AO VIVO — o <script is:inline> do mapa de
// cadeiras na home busca /api/cadeiras no NAVEGADOR e atualiza status/aberta a cada carregamento.
// Build-time fetch foi removido de propósito: o Docker cacheia o layer do `npm run build`, então
// redeploy sem commit novo servia dist velho e não refletia o admin.
// href é presentational (link pra venture); só o estático o usa.
// 012 (T054/FR-019): este array ESPELHA DEFAULT_SEATS de app/src/lib/seats.ts — mesma ordem,
// mesmo `estado`. Divergir aqui faz o visitante sem JS ver uma carteira que não existe.
// 012 (T055/FR-020): quem decide se a cadeira aceita candidatura é `estado === 'vaga'` E
// `open` — nunca só `open`. Cadeira ocupada NÃO é oferecida.
export const fornecedores: { niche: string; status: string; open: boolean; estado: string; href?: string }[] = [
  { niche: 'Fitas adesivas', status: 'Ocupada · Tapepro', open: false, estado: 'ocupada-vendavel', href: 'https://tapepro.roilabs.com.br/' },
  { niche: 'Ortodontia / Alinhadores', status: 'Ocupada · Use Aligner', open: false, estado: 'ocupada-vendavel', href: 'https://usealigner.com/' },
];
