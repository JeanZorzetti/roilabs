// Mirror of site-goiania/porcelanatos.json — server-side source of truth for price
// recompute at checkout (FR-005: never trust client-sent money).
// Only the two fields the server needs: m² per box and price per m².
// ponytail: hand-mirrored copy; sync via a build script if it drifts. Migrate to a
// DB table only if the catalog becomes dynamic.

export interface ProdutoPreco {
  m2_caixa: number;
  preco: number; // price per m²
}

// slug → [m2_caixa, preco]
const PRECOS: Record<string, [number, number]> = {
  'porcelanato-20x120-carvalho-natural': [1.7, 98.99],
  'porcelanato-marmo-perla-biancogres': [2.2, 128.99],
  'porcelanato-cristallo-quartz-biancogres': [2.2, 128.99],
  'porcelanato-legado-grigio-ac-biancogres': [1.7, 101.99],
  'porcelanato-bianco-luz-polido-biancogres': [2.2, 137.99],
  'porcelanato-120x120-tivoli-biancogres': [2.88, 139.99],
  'porcelanato-arezzo-grigrio-biancogres': [2.88, 137.99],
  'porcelanato-grigio-externo-biancogres': [3, 120.99],
  'porcelanato-pulpis-grigio-ac-100x100cm-biancogres': [3, 120.99],
  'porcelanato-persia-beige-biancogres': [3, 120.99],
  'porcelanato-chicago-nebbia-biancogres': [3, 128.99],
  'porcelanato-chigaco-grigio-biancogres': [3, 120.99],
  'porcelanato-100x100-lux-biancogres': [3, 122.99],
  'porcelanato-grigio-externo-90x90': [2.4, 111.99],
  'porcelanato-arezzo-externo-beige': [2.4, 106.99],
  'porcelanato-arezzo-beige-biancogres': [2.4, 103.99],
  'porcelanato-castilla-noce-biancogres': [2.6, 94.99],
  'porcelanato-chicago-80x80-grafite-biancogres': [2.6, 90.99],
  'porcelanato-madrid-bloc-polido-delta': [2.61, 73.99],
  'porcelanato-56x113cm-strato-marmo-bege': [2.5, 101.99],
  'porcelanato-56x113cm-strato-marmo-grigio': [2.5, 101.99],
  'porcelanato-90x90cm-urban-branco-polido': [2.43, 90.99],
  'porcelanato-91x91cm-perla-acetinado': [2.48, 65.99],
  'porcelanato-56x113cm-pietra-di-matera-natural': [2.5, 96.99],
  'porcelanato-56x113cm-pietra-di-trulli-natural': [2.5, 117.9],
  'porcelanato-terrazine-91x91cm-savane': [2.48, 68.99],
  'porcelanato-rock-face-matera-savane': [2.5, 101.99],
  'porcelanato-nero-polido-delta': [2.88, 144.99],
  'porcelanato-avorio-polido-delta': [2.66, 67.99],
  'porcelanato-72x72cm-nero-polido': [2.61, 120.99],
};

export function getProduto(slug: string): ProdutoPreco | null {
  const row = PRECOS[slug];
  return row ? { m2_caixa: row[0], preco: row[1] } : null;
}

export function listarProdutos(): Array<{ slug: string } & ProdutoPreco> {
  return Object.entries(PRECOS).map(([slug, [m2_caixa, preco]]) => ({ slug, m2_caixa, preco }));
}
