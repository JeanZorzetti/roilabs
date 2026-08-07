// Catálogo do vertical FITAS (011). Espelha o papel de produtos.ts, que é de porcelanato
// e NÃO é tocado.
//
// Regra de conteúdo (FR-027/FR-032): os FATOS vêm do institucional
// (ROI Labs/Tapepro/src/lib/produtos.ts) e não podem divergir — check-matrix.mjs quebra o
// build se divergirem. A PROSA é nova: o institucional escreve para intenção informacional,
// aqui a intenção é transacional (preço por faixa, mínimo, frete, prazo).
//
// ponytail: fatos copiados à mão (3 SKUs × ~6 campos). Um script de sync entre dois repos
// para 18 valores é over-engineering — a trava é a asserção do check-matrix.

export type Modalidade = 'precoPublico' | 'orcamento';

export interface FaixaExibida {
  min: number; // limite inferior inclusivo — espelha precos-fitas.ts do /app
  rotulo: string; // "15 a 100 rolos"
  precoRolo: number;
}

export interface Fita {
  slug: string;
  nome: string;
  /**
   * Query principal que esta página persegue. Mesmo papel do `termoAlvo` da malha de
   * porcelanato, mas aqui a intenção é NACIONAL (B2B) — não leva "goiânia".
   * É a única fonte de keyword de fita para rank-tracking.mjs; sem ela o vertical
   * primário do site fica fora de toda medição semanal.
   */
  termoAlvo: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  /** Frase curta de vitrine — transacional, não institucional. */
  chamadaVitrine: string;
  /** Copy comercial própria (2–3 parágrafos), intenção de compra. */
  copyComercial: string[];
  specs: { label: string; valor: string }[];
  aplicacoes: string[];
  minimoRolos: number;
  /**
   * `precoPublico` ⇒ compra direta no carrinho; `orcamento` ⇒ CTA de orçamento.
   * A autoridade continua sendo app/src/lib/precos-fitas.ts — isto aqui é display.
   */
  modalidade: Modalidade;
  /** Tabela visível na página (FR-039). Na personalizada é informativa (FR-040). */
  faixas: FaixaExibida[];
  /** Observação de preço exibida abaixo da tabela. */
  notaPreco?: string;
  /**
   * Clichê fixo da arte (011.1), em R$. Só a personalizada tem. É DISPLAY — a autoridade
   * do valor e da isenção do recorrente é o /api/pedidos (CLICHE_FIXO). Presente ⇒ a página
   * e o carrinho avisam que a arte nova soma este valor no pagamento.
   */
  clicheFixo?: number;
  imagem: string;
  alt: string;
  /** Página correspondente no institucional — autoridade de marca (FR-033). */
  institucional: string;
}

const TAPEPRO = 'https://tapepro.roilabs.com.br';

export const fitas: Fita[] = [
  {
    slug: 'fita-transparente-personalizada',
    nome: 'Fita Transparente Personalizada',
    termoAlvo: 'fita adesiva personalizada',
    h1: 'Fita adesiva transparente personalizada com a sua marca',
    seoTitle: 'Fita Adesiva Personalizada 48mm × 100m — Compra por Volume | ROI Labs',
    seoDescription:
      'Fita adesiva transparente personalizada em BOPP 48mm × 100m, impressão em até 2 cores, mínimo de 20 rolos. Compra direta com preço por faixa de volume e clichê único da sua arte, frete para todo o Brasil.',
    chamadaVitrine: 'A partir de 20 rolos · compra direta',
    copyComercial: [
      'Cada caixa que sai da sua expedição vira mídia. A fita personalizada imprime a sua marca ao longo dos 100 metros do rolo, no mesmo BOPP transparente da fita comum — a caixa continua limpa e o lacre continua discreto.',
      'O preço cai por faixa de volume: quanto maior o pedido, menor o custo por rolo. Cada arte nova exige um clichê flexográfico próprio (custo único), que entra uma vez no pagamento — quem repete a mesma arte não paga o clichê de novo.',
      'Mesma largura e mesma adesão da fita comum: entra na sua seladora sem nenhuma adaptação de operação.',
    ],
    specs: [
      { label: 'Largura', valor: '48 mm' },
      { label: 'Comprimento', valor: '100 m' },
      { label: 'Material', valor: 'BOPP transparente' },
      { label: 'Impressão', valor: 'Até 2 cores' },
      { label: 'Pedido mínimo', valor: '20 rolos' },
    ],
    aplicacoes: [
      'E-commerce que quer caixa branca com a marca visível na fita',
      'Distribuidoras e transportadoras com aviso de volume conferido',
      'Indústria e expedição de alto volume',
      'Franquias que padronizam o pacote em toda a rede',
    ],
    minimoRolos: 20,
    modalidade: 'precoPublico',
    clicheFixo: 80,
    faixas: [
      { min: 20, rotulo: '20 a 49 rolos', precoRolo: 16.2 },
      { min: 50, rotulo: '50 a 99 rolos', precoRolo: 13.9 },
      { min: 100, rotulo: '100 a 199 rolos', precoRolo: 10.5 },
      { min: 200, rotulo: '200 rolos ou mais', precoRolo: 10.1 },
    ],
    notaPreco:
      'Preço por rolo conforme a faixa de volume. A arte nova soma um clichê único de R$ 80,00 (matriz de impressão, custo único por arte) no pagamento — quem repete a mesma arte não paga de novo.',
    imagem: '/img/fitas/fita-transparente-personalizada.png',
    alt: 'Rolo de fita adesiva transparente com marca impressa em laranja e azul',
    institucional: `${TAPEPRO}/produtos/fita-transparente-personalizada/`,
  },
  {
    slug: 'fita-gomada',
    nome: 'Fita Gomada Reforçada',
    termoAlvo: 'fita gomada',
    h1: 'Fita gomada kraft reforçada com fios de nylon',
    seoTitle: 'Fita Gomada Kraft com Nylon 70mm × 150m — Preço por Rolo | ROI Labs',
    seoDescription:
      'Fita gomada de papel kraft reforçada com fios de nylon, 70mm × 150m, ativada com água. Preço por rolo a partir de 15 rolos, com frete calculado para todo o Brasil.',
    chamadaVitrine: 'R$ 37,20/rolo · mínimo 15 rolos',
    copyComercial: [
      'A goma ativada com água penetra na fibra do papelão e vira parte da caixa. Para abrir é preciso rasgar — a violação fica evidente, e é por isso que este é o lacre de quem despacha valor.',
      'Os fios de nylon na estrutura do papel impedem que a fita rasgue sob tensão, mesmo em caixa cheia e empilhada. Papel sobre papelão também resolve o acabamento: nenhum plástico aparente no pacote.',
      'Compra direta a partir de 15 rolos, com o preço por rolo caindo acima de 100. O frete é calculado no carrinho pelo seu CEP, para todo o Brasil.',
    ],
    specs: [
      { label: 'Largura', valor: '70 mm' },
      { label: 'Comprimento', valor: '150 m' },
      { label: 'Material', valor: 'Papel kraft gomado' },
      { label: 'Reforço', valor: 'Fios de nylon' },
      { label: 'Ativação', valor: 'Com água' },
      { label: 'Pedido mínimo', valor: '15 rolos' },
    ],
    aplicacoes: [
      'Caixas pesadas e volumes que viajam longas distâncias',
      'Marcas que querem embalagem de papel, sem plástico à vista',
      'Produtos de alto valor que precisam de lacre inviolável',
      'Kits e presentes com acabamento premium',
    ],
    minimoRolos: 15,
    modalidade: 'precoPublico',
    faixas: [
      { min: 15, rotulo: '15 a 100 rolos', precoRolo: 37.2 },
      { min: 101, rotulo: '101 rolos ou mais', precoRolo: 32.2 },
    ],
    imagem: '/img/fitas/fita-gomada.png',
    alt: 'Rolo de fita gomada de papel kraft reforçada com fios de nylon',
    institucional: `${TAPEPRO}/produtos/fita-gomada/`,
  },
  {
    slug: 'fita-transparente-comum',
    nome: 'Fita Transparente Comum',
    termoAlvo: 'fita adesiva transparente',
    h1: 'Fita adesiva transparente comum 48mm × 100m',
    seoTitle: 'Fita Adesiva Transparente Comum 48mm × 100m — R$ 7,90/rolo | ROI Labs',
    seoDescription:
      'Fita adesiva transparente comum sem impressão, BOPP 48mm × 100m de alta adesão. R$ 7,90 por rolo, compra direta e frete calculado para todo o Brasil.',
    chamadaVitrine: 'R$ 7,90/rolo · compra direta',
    copyComercial: [
      'A mesma base BOPP e a mesma adesão da fita personalizada, sem impressão. Não é fita de segunda linha: é a fita de quem precisa de lacre bem feito e nada além disso.',
      'Compra direta a partir de 1 rolo, sem mínimo e sem burocracia. É o item que a maior parte das operações consome no dia a dia — montagem de caixa, reforço de fundo, uso geral de almoxarifado.',
      'Muita empresa usa a personalizada no lacre externo e a comum na montagem interna. As duas cabem no mesmo pedido.',
    ],
    specs: [
      { label: 'Largura', valor: '48 mm' },
      { label: 'Comprimento', valor: '100 m' },
      { label: 'Material', valor: 'BOPP transparente' },
      { label: 'Impressão', valor: 'Sem impressão' },
      { label: 'Fornecimento', valor: 'Por volume' },
    ],
    aplicacoes: [
      'Expedição de alto giro',
      'Complemento da fita personalizada em caixas internas',
      'Reforço de fundo de caixa e montagem',
      'Uso geral em almoxarifado e estoque',
    ],
    minimoRolos: 1,
    modalidade: 'precoPublico',
    faixas: [{ min: 1, rotulo: 'Qualquer quantidade', precoRolo: 7.9 }],
    imagem: '/img/fitas/fita-transparente-comum.png',
    alt: 'Rolo de fita adesiva transparente comum, sem impressão',
    institucional: `${TAPEPRO}/produtos/fita-transparente-comum/`,
  },
];

export const fitasBySlug = new Map(fitas.map((f) => [f.slug, f]));

export const formatPreco = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Menor unitário do SKU — o número que a vitrine anuncia ("a partir de"). */
export const menorPreco = (f: Fita) => Math.min(...f.faixas.map((x) => x.precoRolo));

/** Só SKU com preço público entra no feed do Merchant Center (FR-024). */
export const elegivelParaFeed = (f: Fita) => f.modalidade === 'precoPublico';
