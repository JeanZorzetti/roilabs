import rawData from '../../porcelanatos.json';

export interface Produto {
  slug: string;
  imagens: string[];
  video: string | null;
  atributos: {
    marca: string;
    preco: number;
    dimensao: string;
    acabamento: string;
    m2_caixa: number;
    retificado: boolean | null;
    classe_ad: number | null;
  };
}

export const produtos: Produto[] = rawData as Produto[];
export const produtosBySlug = new Map(produtos.map((p) => [p.slug, p]));

// Nome de exibição: remove "porcelanato-" e o token da marca, title-case.
export function nomeProduto(p: Produto): string {
  const marca = p.atributos.marca.toLowerCase();
  const limpo = p.slug
    .replace(/^porcelanato-/, '')
    .split('-')
    .filter((t) => t !== marca && t !== 'porcelanato')
    .join(' ');
  return limpo.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const formatPreco = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Título e descrição canônicos — usados pela página de produto E pelo feed do
// Merchant Center. Paridade página↔feed é política do Google: um só lugar pro texto.
export const tituloProduto = (p: Produto) => `${p.atributos.marca} ${nomeProduto(p)}`;

export const descricaoProduto = (p: Produto) =>
  `${tituloProduto(p)} ${p.atributos.dimensao} ${p.atributos.acabamento}. ${formatPreco(p.atributos.preco)}/m² em Goiânia. Fale pelo WhatsApp ou solicite orçamento.`;

// Elegibilidade do feed: item sem imagem ou sem preço reprova individualmente no
// Google — omitir e corrigir na fonte. check-feed.mjs reaplica esta regra no JSON.
export const elegivelParaFeed = (p: Produto) => Boolean(p.imagens[0]) && p.atributos.preco > 0;

// ponytail: taxonomia heurística por slug/acabamento/dimensão. Trocar por tags
// curadas no JSON se a precisão do match importar.
export function tagsDoProduto(p: Produto): Set<string> {
  const t = new Set<string>();
  const s = p.slug.toLowerCase();
  const ac = p.atributos.acabamento.toLowerCase();
  const dim = p.atributos.dimensao.toLowerCase();

  // tipo por acabamento
  if (ac === 'polido') t.add('tipo:polido');
  if (ac === 'acetinado') t.add('tipo:acetinado');
  if (['externo', 'rústico', 'rustico', 'strutturato'].includes(ac)) t.add('tipo:antiderrapante');

  // tipo por nome
  if (/marmo|perla|cristallo|tivoli|strato-marmo|pietra/.test(s)) t.add('tipo:marmorizado');
  if (/carvalho|madeira|amadeir|wood/.test(s)) t.add('tipo:amadeirado');

  // cores
  if (/branco|bianco|urban-branco|lux|avorio|bege|beige|persia/.test(s)) t.add('porcelanato-branco');
  if (/bege|beige|avorio/.test(s)) t.add('porcelanato-bege');
  if (/grigio|grafite|cinza|nebbia|chicago|chigaco|legado/.test(s)) t.add('porcelanato-cinza');
  if (/\bnero\b|preto/.test(s)) t.add('porcelanato-preto');

  // dimensão → slug de categoria
  if (/^(60x120|120x60)/.test(dim)) t.add('porcelanato-120x60');
  if (/^(90x90|91x91)/.test(dim)) t.add('porcelanato-90x90');
  if (/^60x60/.test(dim)) t.add('porcelanato-60x60');

  // retificado
  if (p.atributos.retificado) t.add('porcelanato-retificado');

  // marca → slug de categoria (páginas por marca do ciclo 2: biancogres, delta)
  t.add(`porcelanato-${p.atributos.marca.toLowerCase()}`);

  // externo / antiderrapante
  if (['externo', 'rústico', 'rustico'].includes(ac) || /externo/.test(s)) {
    t.add('porcelanato-area-externa');
    t.add('porcelanato-antiderrapante');
    t.add('porcelanato-externo-antiderrapante');
  }

  // ocasião: cozinha = acabamento apto a piso de cozinha (acetinado/natural, não escorrega c/ óleo)
  if (['acetinado', 'natural'].includes(ac)) {
    t.add('porcelanato-cozinha');
    t.add('revestimento-cozinha');
    t.add('piso-cozinha');
  }

  // banheiro: piso antiderrapante ou parede marmorizada (conteúdo da página)
  if (t.has('tipo:antiderrapante') || t.has('tipo:marmorizado')) t.add('revestimento-banheiro');

  return t;
}

// Páginas amplas que listam todos os produtos.
// porcelanato-preco: página de preço — todo o catálogo tem preço real, lista tudo.
const BROAD = new Set(['piso-porcelanato', 'porcelanato-goiania', 'loja-porcelanato-goiania', 'porcelanato-preco']);

export function produtosDaCategoria(slug: string, tipo: string): Produto[] {
  if (BROAD.has(slug)) return produtos;
  return produtos.filter((p) => {
    const t = tagsDoProduto(p);
    if (t.has(slug)) return true;
    if (tipo && tipo !== 'genérico' && t.has(`tipo:${tipo}`)) return true;
    return false;
  });
}

// Categorias às quais um produto pertence (para breadcrumb/links no produto).
export function categoriasDoProduto<T extends { slug: string; tipo: string }>(p: Produto, cats: T[]): T[] {
  return cats.filter((c) => produtosDaCategoria(c.slug, c.tipo).some((x) => x.slug === p.slug));
}

// Produtos relacionados: compartilham ao menos uma tag. Até `limite`.
export function produtosRelacionados(p: Produto, limite = 4): Produto[] {
  const tags = tagsDoProduto(p);
  return produtos
    .filter((x) => x.slug !== p.slug && [...tagsDoProduto(x)].some((t) => tags.has(t)))
    .slice(0, limite);
}
