// Cadeiras vendáveis da carteira (spec 012, US3). Uma página por cadeira.
//
// ⚠️ CONTEÚDO ANTES DE QUANTIDADE. A medição da Atma (2026-08-07) mostrou que 86% do
// tráfego dela vem de UMA página que responde uma pergunta de preço inteira, e que esforço
// por artigo não prediz nada — o vencedor é o 6º maior de 22. Publicar 7 páginas finas é o
// resultado a evitar, e é por isso que `src/scripts/check-cadeiras.mjs` roda no `prebuild`:
// página abaixo do piso de FR-014 QUEBRA O BUILD, não vira aviso que ninguém lê.
//
// Piso objetivo de FR-014, por página:
//   • ≥ 800 palavras no HTML INICIAL (não em shell de SPA)
//   • a pergunta de preço respondida EXPLICITAMENTE no corpo, não só no Offer
//   • ≥ 6 pares de FAQ
//
// FR-009: `publicado: false` ⇒ sem URL pública indexável e fora do sitemap. Cadeira em
// `em-preparacao` ou sem gateway ligado NÃO entra aqui.

export interface FaqCadeira {
  pergunta: string;
  /** Resposta inteira, em prosa. Uma linha não responde nada e não é citada por IA. */
  resposta: string;
}

export interface SecaoCadeira {
  titulo: string;
  /** Parágrafos. O contador de FR-014 lê o texto renderizado, então prosa real conta. */
  paragrafos: string[];
}

export interface Cadeira {
  slug: string;
  /** Nome do produto — vira o `name` do Product. */
  nome: string;
  /** Nicho da cadeira, como aparece no mapa do institucional. */
  niche: string;
  /** Uma frase. Vira meta description e o BLUF do topo da página. */
  resumo: string;
  /** Fonte do Offer de FR-013 — o MESMO número que a página escreve no corpo. */
  preco: number;
  moeda: 'BRL' | 'USD';
  recorrencia: 'unica' | 'mensal' | 'anual';
  /** 'carrinho' = caixa da ROI Labs; 'parceiro' = gateway do parceiro. */
  modoCobranca: 'carrinho' | 'parceiro';
  /** Obrigatório quando modoCobranca='parceiro'. https absoluto. */
  checkoutUrl: string | null;
  /** De quem é a página de pagamento. Comprador que não sabe a quem paga é chargeback. */
  pagoA: string;
  /**
   * A pergunta de preço, respondida em prosa NO CORPO. Não é o Offer, e não é uma tabela:
   * é o texto que responde "quanto custa" para quem chegou da busca perguntando isso.
   */
  respostaPreco: string;
  secoes: SecaoCadeira[];
  faq: FaqCadeira[];
  /** FR-009. false ⇒ nenhuma URL pública, nenhuma entrada no sitemap. */
  publicado: boolean;
}

/**
 * ⚠️ VAZIO DE PROPÓSITO — e isto NÃO é um esqueleto "para depois".
 *
 * Preencher esta lista exige preço real e descrição real de produto de terceiro. Inventar
 * preço numa página de e-commerce publicada seria fabricar oferta comercial, e inventar
 * descrição de produto de parceiro seria afirmar em nome dele. Nenhum dos dois é decisão de
 * engenharia — é conteúdo, e a spec o coloca sob "conteúdo antes de quantidade".
 *
 * O que já está pronto e testado ao redor: o template, o Product/Offer + FAQPage no @graph
 * único, o portão de FR-009 no sitemap e o verificador do piso de FR-014. Cada cadeira
 * adicionada aqui já nasce medida — e reprovada se estiver fina.
 */
export const cadeiras: Cadeira[] = [];

/** FR-009 — só cadeira publicada gera URL pública indexável e entra no sitemap. */
export const cadeirasPublicadas = (): Cadeira[] => cadeiras.filter((c) => c.publicado);

export const cadeiraPorSlug = (slug: string): Cadeira | undefined =>
  cadeiras.find((c) => c.slug === slug);
