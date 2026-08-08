// Espelho servidor do registro de cadeiras-loja (013, data-model.md §2).
//
// Duplicação deliberada com site-goiania/src/data/lojas.ts — o site é Astro estático
// e não pode importar do app. São dois containers e dois deploys.
// Trava: teste de paridade (padrão check-matrix.mjs). Teto: > 5 cadeiras → packages/lojas.
//
// ⚠️ Este arquivo NÃO importa do catálogo — o servidor já tem precos.ts e precos-fitas.ts
// como fonte de preço. O que importa aqui é a configuração da cadeira (cobrança, frete,
// documento, clichê, cupom), não o catálogo de display.

export interface LinhaFixa {
  /** Slug que DISPARA a linha fixa quando está no carrinho. */
  quandoSlug: string;
  /**
   * Slug da linha que é CRIADA. Não confundir com `quandoSlug`: um é o gatilho, o outro é o
   * item que nasce. Era a constante `SLUG_CLICHE` solta na rota; hardcodá-la faria a segunda
   * cadeira com linha fixa criar um item chamado 'cliche-arte'.
   */
  slug: string;
  /** Rótulo exibido no checkout do gateway. */
  rotulo: string;
  valor: number;
  isentoSeJaComprou: boolean;
}

export interface LojaConfig {
  id: string;
  prefixoRota: string;
  unidade: string;           // 'm2' | 'rolo' | 'assinatura'
  modoCobranca: 'roilabs' | 'parceiro';
  checkoutUrl: string | null;
  pagoA: string;
  frete: 'tabela-cep' | 'cotacao' | 'nenhum';
  docObrigatorio: boolean;
  cupomEscopo: string;
  linhaFixa: LinhaFixa | null;
  publicada: boolean;
}

export const lojas: LojaConfig[] = [
  {
    id: 'porcelanato',
    prefixoRota: 'porcelanato',
    unidade: 'm2',
    modoCobranca: 'roilabs',
    checkoutUrl: null,
    pagoA: 'ROI Labs',
    frete: 'tabela-cep',
    docObrigatorio: false,
    cupomEscopo: 'porcelanato',
    linhaFixa: null,
    publicada: true,
  },
  {
    id: 'fitas',
    prefixoRota: 'fitas',
    unidade: 'rolo',
    modoCobranca: 'roilabs',
    checkoutUrl: null,
    pagoA: 'Tapepro',
    frete: 'cotacao',
    docObrigatorio: true,
    cupomEscopo: 'fitas',
    linhaFixa: {
      quandoSlug: 'fita-transparente-personalizada',
      slug: 'cliche-arte',
      rotulo: 'Clichê (arte personalizada)',
      // ponytail: knob do operador — "a partir de R$80" da tabela Tapepro.
      valor: 80,
      isentoSeJaComprou: true,
    },
    publicada: true,
  },
];

export const lojasById = new Map(lojas.map((l) => [l.id, l]));

/** Resolve a cadeira pelo id. Ausente ⇒ null (o chamador decide o erro). */
export function getLoja(id: string): LojaConfig | null {
  return lojasById.get(id) ?? null;
}
