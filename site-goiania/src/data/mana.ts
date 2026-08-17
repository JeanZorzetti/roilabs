// Catálogo do vertical MANÁ MODA SOCIAL (015). Moda social masculina — a 4ª cadeira,
// a 1ª com variação de tamanho × cor.
//
// Regra de conteúdo (Constituição IV): copyComercial é PRÓPRIO da Maná, não o texto de
// porcelanato ou fita com as palavras trocadas.
//
// ⚠️ `sku` é a CHAVE — vai para ItemPedido.slug e para EstoqueVariacao. Imutável.
// `tamanho`/`cor` são rótulos de exibição: renomear a cor não cria SKU novo.
// Convenção: `<produto-slug>-<tamanho>-<cor-slug>`, minúsculo, sem acento.
//
// ponytail: SKUs escritos por extenso (não gerados por função) — o mesmo motivo de
// precos-fitas.ts: check-mana.mjs faz parse de TEXTO (site-goiania não tem tsx no
// prebuild), e texto gerado em runtime não dá para regexar. A trava é o gate, não a
// concisão do arquivo.
//
// v1 (17/08): catálogo enxuto — 4 produtos, tamanhos únicos P/M/G/GG (decisão do Jean:
// não há tabela de disponibilidade por tamanho ainda). Peso é ESTIMATIVA calibrável
// (pesquisa de peso médio de roupa social, T038 recalibra contra Melhor Envio real antes
// da Fase 7 — knob de operador, não fato).
// Preço e fotos: catálogo real repassado pelo Jean em 17/08 (fotos em
// specs/015-ecommerce-mana-moda/fotos/, extraídas e otimizadas para site-goiania/public/img/mana/).

export interface VariacaoMana {
  sku: string; // CHAVE. Vai para ItemPedido.slug. Imutável.
  tamanho: string; // 'P' | 'M' | 'G' | 'GG' — texto de exibição
  cor: string; // texto de exibição
  preco: number; // BRL por peça
  pesoKg: number; // frete: peso vem do catálogo, NUNCA do cliente
}

export interface ProdutoMana {
  slug: string; // só a rota: /mana/<slug>/
  nome: string;
  categoria: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  chamadaVitrine: string;
  copyComercial: string[]; // 2–3 parágrafos próprios (Constituição IV)
  specs: { label: string; valor: string }[];
  imagens: string[];
  alt: string;
  variacoes: VariacaoMana[];
}

export const produtosMana: ProdutoMana[] = [
  {
    slug: 'camisa-social-manga-longa',
    nome: 'Camisa Social Manga Longa',
    categoria: 'Camisas',
    h1: 'Camisa social manga longa Maná Moda Social',
    seoTitle: 'Camisa Social Manga Longa Masculina — R$ 80,00 | Maná Moda Social',
    seoDescription:
      'Camisa social manga longa masculina, tecido de alta qualidade e acabamento premium. Tamanhos P ao GG, entrega para todo o Brasil.',
    chamadaVitrine: 'R$ 80,00 · tamanhos P ao GG',
    copyComercial: [
      'A camisa social manga longa da Maná é a peça que resolve o compromisso do dia sem esforço: corte clássico, gola tradicional e tecido leve o bastante para o calor de Goiânia.',
      'Serve tanto o expediente comum quanto a ocasião que pede um passo a mais — reunião, culto, jantar. Acabamento premium, do jeito que a Maná trabalha há anos no Setor Central atendendo quem preza vestir bem sem complicar.',
      'Peça vendida por unidade, com envio para todo o Brasil.',
    ],
    specs: [
      { label: 'Manga', valor: 'Longa' },
      { label: 'Gola', valor: 'Tradicional' },
      { label: 'Tamanhos', valor: 'P, M, G, GG' },
    ],
    imagens: ['/img/mana/camisa-social-longa.jpg'],
    alt: 'Camisa social manga longa rosa claro da Maná Moda Social, dobrada com etiqueta da marca',
    variacoes: [
      { sku: 'camisa-social-manga-longa-p-rosa-claro', tamanho: 'P', cor: 'Rosa claro', preco: 80, pesoKg: 0.25 },
      { sku: 'camisa-social-manga-longa-m-rosa-claro', tamanho: 'M', cor: 'Rosa claro', preco: 80, pesoKg: 0.25 },
      { sku: 'camisa-social-manga-longa-g-rosa-claro', tamanho: 'G', cor: 'Rosa claro', preco: 80, pesoKg: 0.25 },
      { sku: 'camisa-social-manga-longa-gg-rosa-claro', tamanho: 'GG', cor: 'Rosa claro', preco: 80, pesoKg: 0.25 },
    ],
  },
  {
    slug: 'camisa-social-manga-curta',
    nome: 'Camisa Social Manga Curta',
    categoria: 'Camisas',
    h1: 'Camisa social manga curta Maná Moda Social',
    seoTitle: 'Camisa Social Manga Curta Masculina — R$ 160,00 | Maná Moda Social',
    seoDescription:
      'Camisa social manga curta masculina em branco, azul marinho ou vinho. Tamanhos P ao GG, entrega para todo o Brasil.',
    chamadaVitrine: 'R$ 160,00 · 3 cores · tamanhos P ao GG',
    copyComercial: [
      'Mesma formalidade da manga longa, com o alívio da manga curta para quem não abre mão da camisa social mesmo nos dias mais quentes do ano.',
      'Três cores no fechamento clássico do guarda-roupa social — branco para qualquer ocasião, azul marinho para o dia a dia, vinho para quem quer sair do óbvio sem perder a formalidade.',
      'Peça vendida por unidade, com envio para todo o Brasil.',
    ],
    specs: [
      { label: 'Manga', valor: 'Curta' },
      { label: 'Gola', valor: 'Tradicional' },
      { label: 'Tamanhos', valor: 'P, M, G, GG' },
    ],
    imagens: ['/img/mana/camisa-social-curta.jpg'],
    alt: 'Camisas sociais manga curta brancas, azul marinho e vinho da Maná Moda Social, embaladas com etiqueta da marca',
    variacoes: [
      { sku: 'camisa-social-manga-curta-p-branco', tamanho: 'P', cor: 'Branco', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-m-branco', tamanho: 'M', cor: 'Branco', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-g-branco', tamanho: 'G', cor: 'Branco', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-gg-branco', tamanho: 'GG', cor: 'Branco', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-p-azul-marinho', tamanho: 'P', cor: 'Azul marinho', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-m-azul-marinho', tamanho: 'M', cor: 'Azul marinho', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-g-azul-marinho', tamanho: 'G', cor: 'Azul marinho', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-gg-azul-marinho', tamanho: 'GG', cor: 'Azul marinho', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-p-vinho', tamanho: 'P', cor: 'Vinho', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-m-vinho', tamanho: 'M', cor: 'Vinho', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-g-vinho', tamanho: 'G', cor: 'Vinho', preco: 160, pesoKg: 0.22 },
      { sku: 'camisa-social-manga-curta-gg-vinho', tamanho: 'GG', cor: 'Vinho', preco: 160, pesoKg: 0.22 },
    ],
  },
  {
    slug: 'calca-social',
    nome: 'Calça Social',
    categoria: 'Calças',
    h1: 'Calça social masculina Maná Moda Social',
    seoTitle: 'Calça Social Masculina Xadrez — R$ 180,00 | Maná Moda Social',
    seoDescription:
      'Calça social masculina cinza grafite em xadrez discreto. Tamanhos P ao GG, entrega para todo o Brasil.',
    chamadaVitrine: 'R$ 180,00 · tamanhos P ao GG',
    copyComercial: [
      'A calça social cinza grafite com xadrez discreto é o par certo da camisa social — corte reto, caimento clássico, o tipo de peça que não sai de moda porque nunca tentou seguir tendência nenhuma.',
      'Estilo e qualidade para o dia a dia de quem se veste bem sem pensar duas vezes: entra na rotina do trabalho, do compromisso, do fim de semana mais arrumado.',
      'Peça vendida por unidade, com envio para todo o Brasil.',
    ],
    specs: [
      { label: 'Estampa', valor: 'Xadrez discreto' },
      { label: 'Caimento', valor: 'Reto, corte clássico' },
      { label: 'Tamanhos', valor: 'P, M, G, GG' },
    ],
    imagens: ['/img/mana/calca-social.jpg'],
    alt: 'Calças sociais cinza grafite em xadrez discreto da Maná Moda Social, dobradas com etiqueta da marca',
    variacoes: [
      { sku: 'calca-social-p-cinza-grafite', tamanho: 'P', cor: 'Cinza grafite', preco: 180, pesoKg: 0.5 },
      { sku: 'calca-social-m-cinza-grafite', tamanho: 'M', cor: 'Cinza grafite', preco: 180, pesoKg: 0.5 },
      { sku: 'calca-social-g-cinza-grafite', tamanho: 'G', cor: 'Cinza grafite', preco: 180, pesoKg: 0.5 },
      { sku: 'calca-social-gg-cinza-grafite', tamanho: 'GG', cor: 'Cinza grafite', preco: 180, pesoKg: 0.5 },
    ],
  },
  {
    slug: 'terno-poliviscose',
    nome: 'Terno Poliviscose',
    categoria: 'Ternos',
    h1: 'Terno poliviscose Maná Moda Social',
    seoTitle: 'Terno Masculino Poliviscose Cinza — R$ 700,00 | Maná Moda Social',
    seoDescription:
      'Terno masculino completo (blazer + calça) em poliviscose cinza. Tamanhos P ao GG, entrega para todo o Brasil.',
    chamadaVitrine: 'R$ 700,00 · conjunto completo · tamanhos P ao GG',
    copyComercial: [
      'O terno completo — blazer e calça — para a ocasião que pede formalidade de verdade: casamento, formatura, entrevista, cerimônia. Poliviscose cinza, corte que veste bem sem exigir alfaiataria sob medida.',
      'É o item de maior valor do catálogo da Maná porque é o item que menos se compra por impulso: quem procura terno já sabe exatamente para que ocasião é, e a Maná entrega o conjunto pronto, sem venda casada de peça avulsa.',
      'Conjunto vendido como unidade (blazer + calça), com envio para todo o Brasil.',
    ],
    specs: [
      { label: 'Composição', valor: 'Poliviscose' },
      { label: 'Conjunto', valor: 'Blazer + calça' },
      { label: 'Tamanhos', valor: 'P, M, G, GG' },
    ],
    imagens: ['/img/mana/terno-poliviscose.jpg'],
    alt: 'Homem vestindo terno poliviscose cinza da Maná Moda Social, com camisa branca e gravata azul marinho',
    variacoes: [
      { sku: 'terno-poliviscose-p-cinza', tamanho: 'P', cor: 'Cinza', preco: 700, pesoKg: 1.25 },
      { sku: 'terno-poliviscose-m-cinza', tamanho: 'M', cor: 'Cinza', preco: 700, pesoKg: 1.25 },
      { sku: 'terno-poliviscose-g-cinza', tamanho: 'G', cor: 'Cinza', preco: 700, pesoKg: 1.25 },
      { sku: 'terno-poliviscose-gg-cinza', tamanho: 'GG', cor: 'Cinza', preco: 700, pesoKg: 1.25 },
    ],
  },
];

export const produtosManaBySlug = new Map(produtosMana.map((p) => [p.slug, p]));

export const formatPreco = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Menor preço entre as variações — o número que a vitrine anuncia. */
export const menorPreco = (p: ProdutoMana) => Math.min(...p.variacoes.map((v) => v.preco));

/** Todas as variações do catálogo, achatadas — usado pelo gate de paridade (check-mana.mjs). */
export const todasVariacoes = (): VariacaoMana[] => produtosMana.flatMap((p) => p.variacoes);
