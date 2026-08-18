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

/** Split no gateway (015) — comissão retida NO ATO, na conta do parceiro. `null` = caminho
 * de hoje (cobra na conta da ROI Labs). NÃO deriva de `modoCobranca`: são eixos diferentes
 * (quem opera a loja × qual conta recebe) — a 012 já pagou o preço de confundir os dois. */
export interface Split {
  gateway: 'mercadopago';
  comissaoPct: number; // (0, 1]
}

export interface LojaConfig {
  id: string;
  prefixoRota: string;
  unidade: string;           // 'm2' | 'rolo' | 'assinatura' | 'peca'
  recorrencia?: string;       // só para unidade='assinatura': 'mensal' | 'anual'
  modoCobranca: 'roilabs' | 'parceiro';
  checkoutUrl: string | null;
  pagoA: string;
  frete: 'tabela-cep' | 'cotacao' | 'nenhum';
  docObrigatorio: boolean;
  emailObrigatorio: boolean; // booleano explícito, sem default implícito (015)
  split: Split | null; // 015 — ver comentário acima
  cupomEscopo: string;
  linhaFixa: LinhaFixa | null;
  publicada: boolean;
  /** Host de fallback para redirect (carrinho, back_url do MP) quando o `origin` do form não
   * está na allowlist de cors.ts. NUNCA 'https://goiania.roilabs.com.br' fixo — pra Maná isso
   * é o host errado (open redirect + destino errado, ambos corrigidos pela mesma allowlist). */
  hostPadrao: string;
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
    emailObrigatorio: false,
    split: null,
    cupomEscopo: 'porcelanato',
    linhaFixa: null,
    publicada: true,
    hostPadrao: 'https://goiania.roilabs.com.br',
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
    emailObrigatorio: false,
    split: null,
    cupomEscopo: 'fitas',
    hostPadrao: 'https://goiania.roilabs.com.br',
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
  {
    id: 'mana',
    prefixoRota: 'mana',
    unidade: 'peca',
    modoCobranca: 'roilabs',
    checkoutUrl: null,
    pagoA: 'Maná Moda',
    frete: 'cotacao',
    docObrigatorio: true,
    emailObrigatorio: true,
    split: { gateway: 'mercadopago', comissaoPct: 0.1 },
    cupomEscopo: 'mana',
    linhaFixa: null,
    // 015 Fase 1: dado existe, nada vende ainda. Fase 7 vira true.
    publicada: false,
    hostPadrao: 'https://mana.roilabs.com.br',
  },
];

export const lojasById = new Map(lojas.map((l) => [l.id, l]));

/** Resolve a cadeira pelo id. Ausente ⇒ null (o chamador decide o erro). */
export function getLoja(id: string): LojaConfig | null {
  return lojasById.get(id) ?? null;
}
