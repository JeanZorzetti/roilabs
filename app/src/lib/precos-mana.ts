// Autoridade de preço/peso da MANÁ (015). Espelho servidor do catálogo
// (site-goiania/src/data/mana.ts) — mesmo papel de precos.ts e precos-fitas.ts:
// o servidor nunca confia no dinheiro nem no peso vindos do cliente (FR-005 da 013).
//
// ⚠️ `sku` é a chave — igual a mana.ts, byte a byte no preço e no peso. O gate de paridade
// (site-goiania/src/scripts/check-mana.mjs, prebuild) quebra o build se divergir.
//
// ponytail: fatos copiados à mão (4 produtos × N variações), SKUs por extenso — mesmo
// motivo de precos-fitas.ts. A trava é a asserção do gate, não um script de sync entre
// dois repos e dois containers.

export interface VariacaoPreco {
  preco: number;
  pesoKg: number;
  produtoSlug: string;
  tamanho: string;
  cor: string;
}

const PRECOS: Record<string, VariacaoPreco> = {
  'camisa-social-manga-longa-p-rosa-claro': { preco: 80, pesoKg: 0.25, produtoSlug: 'camisa-social-manga-longa', tamanho: 'P', cor: 'Rosa claro' },
  'camisa-social-manga-longa-m-rosa-claro': { preco: 80, pesoKg: 0.25, produtoSlug: 'camisa-social-manga-longa', tamanho: 'M', cor: 'Rosa claro' },
  'camisa-social-manga-longa-g-rosa-claro': { preco: 80, pesoKg: 0.25, produtoSlug: 'camisa-social-manga-longa', tamanho: 'G', cor: 'Rosa claro' },
  'camisa-social-manga-longa-gg-rosa-claro': { preco: 80, pesoKg: 0.25, produtoSlug: 'camisa-social-manga-longa', tamanho: 'GG', cor: 'Rosa claro' },

  'camisa-social-manga-curta-p-branco': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'P', cor: 'Branco' },
  'camisa-social-manga-curta-m-branco': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'M', cor: 'Branco' },
  'camisa-social-manga-curta-g-branco': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'G', cor: 'Branco' },
  'camisa-social-manga-curta-gg-branco': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'GG', cor: 'Branco' },
  'camisa-social-manga-curta-p-azul-marinho': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'P', cor: 'Azul marinho' },
  'camisa-social-manga-curta-m-azul-marinho': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'M', cor: 'Azul marinho' },
  'camisa-social-manga-curta-g-azul-marinho': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'G', cor: 'Azul marinho' },
  'camisa-social-manga-curta-gg-azul-marinho': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'GG', cor: 'Azul marinho' },
  'camisa-social-manga-curta-p-vinho': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'P', cor: 'Vinho' },
  'camisa-social-manga-curta-m-vinho': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'M', cor: 'Vinho' },
  'camisa-social-manga-curta-g-vinho': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'G', cor: 'Vinho' },
  'camisa-social-manga-curta-gg-vinho': { preco: 160, pesoKg: 0.22, produtoSlug: 'camisa-social-manga-curta', tamanho: 'GG', cor: 'Vinho' },

  'calca-social-p-cinza-grafite': { preco: 180, pesoKg: 0.5, produtoSlug: 'calca-social', tamanho: 'P', cor: 'Cinza grafite' },
  'calca-social-m-cinza-grafite': { preco: 180, pesoKg: 0.5, produtoSlug: 'calca-social', tamanho: 'M', cor: 'Cinza grafite' },
  'calca-social-g-cinza-grafite': { preco: 180, pesoKg: 0.5, produtoSlug: 'calca-social', tamanho: 'G', cor: 'Cinza grafite' },
  'calca-social-gg-cinza-grafite': { preco: 180, pesoKg: 0.5, produtoSlug: 'calca-social', tamanho: 'GG', cor: 'Cinza grafite' },

  'terno-poliviscose-p-cinza': { preco: 700, pesoKg: 1.25, produtoSlug: 'terno-poliviscose', tamanho: 'P', cor: 'Cinza' },
  'terno-poliviscose-m-cinza': { preco: 700, pesoKg: 1.25, produtoSlug: 'terno-poliviscose', tamanho: 'M', cor: 'Cinza' },
  'terno-poliviscose-g-cinza': { preco: 700, pesoKg: 1.25, produtoSlug: 'terno-poliviscose', tamanho: 'G', cor: 'Cinza' },
  'terno-poliviscose-gg-cinza': { preco: 700, pesoKg: 1.25, produtoSlug: 'terno-poliviscose', tamanho: 'GG', cor: 'Cinza' },
};

export function getVariacao(sku: string): VariacaoPreco | null {
  return PRECOS[sku] ?? null;
}

export function listarSkus(): string[] {
  return Object.keys(PRECOS);
}
