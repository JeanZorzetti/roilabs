// Autoridade de preço da unidade `assinatura` (013, T016j). Espelha o papel de precos.ts
// (porcelanato) e precos-fitas.ts (fitas) — preço nunca vem do cliente (FR-005).
//
// Hoje só existe UMA cadeira nesta unidade: `teste-saas` (T021), que valida o motor antes
// da 014 amarrar recorrência real no gateway. ponytail: tabela com os 2 produtos fictícios
// da cadeira de teste, não um catálogo genérico — generalizar quando a 2ª cadeira de
// assinatura existir de verdade.

export interface ProdutoAssinatura {
  preco: number; // valor do ciclo (mensal)
}

const PRECOS: Record<string, number> = {
  'teste-saas-basico': 49.9,
  'teste-saas-pro': 149.9,
};

export function getProdutoAssinatura(slug: string): ProdutoAssinatura | null {
  const preco = PRECOS[slug];
  return preco !== undefined ? { preco } : null;
}
