// Catálogo da cadeira de teste `teste-saas` (013, T021). Existe só para provar SC-001:
// abrir uma cadeira de unidade `assinatura` sem tocar rota/carrinho/checkout. NÃO é conteúdo
// publicável — 2 produtos fictícios, o suficiente para o check-lojas.mjs e o walkthrough do
// T022. Remover junto com a entrada em lojas.ts quando a validação terminar.

export interface ProdutoTesteSaas {
  slug: string;
  nome: string;
  preco: number;
  imagem: string;
}

export const testeSaas: ProdutoTesteSaas[] = [
  { slug: 'teste-saas-basico', nome: 'Plano Básico (teste)', preco: 49.9, imagem: '/img/produtos/placeholder.png' },
  { slug: 'teste-saas-pro', nome: 'Plano Pro (teste)', preco: 149.9, imagem: '/img/produtos/placeholder.png' },
];
