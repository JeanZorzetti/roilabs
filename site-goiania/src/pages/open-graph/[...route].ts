import { OGImageRoute } from 'astro-og-canvas';
import { pages as malha } from '../../data/porcelanato';
import { guias } from '../../data/guias';

// OG dinâmico pras páginas SEM foto própria (malha, guias, hub, calculadora) —
// o funil roda em link compartilhado no WhatsApp, preview rico = mais clique.
// Páginas de produto NÃO entram: usam a foto real como og:image (Base ogImage).
// Mesma receita visual do /site institucional (open-graph/[...route].ts de lá).
const pages: Record<string, { title: string; description: string }> = {
  'porcelanato/index': {
    title: 'Porcelanato em Goiânia — guias por tipo e ambiente',
    description: 'Amadeirado, marmorizado, acetinado, antiderrapante — curadoria ROI Labs com preço e estoque local.',
  },
  calculadora: {
    title: 'Calculadora de porcelanato: quantos m² e caixas comprar?',
    description: 'Informe os ambientes, a folga de corte e os m² por caixa — resultado em caixas fechadas, na hora.',
  },
  comparar: {
    title: 'Compare porcelanatos lado a lado',
    description: 'Preço por m² e por caixa, dimensão, acabamento, retificado e classe AD — 2 ou 3 modelos do catálogo de Goiânia.',
  },
  // Páginas utilitárias (noindex) que rodam em link compartilhado no WhatsApp —
  // o preview rico importa mesmo sem SEO.
  orcamento: {
    title: 'Seu orçamento de porcelanato — Goiânia',
    description: 'Itens, metragem e valores, com validade de 30 dias. Pagamento online (Pix ou cartão), retirada grátis ou entrega.',
  },
  pedido: {
    title: 'Acompanhe seu pedido de porcelanato',
    description: 'Status do pagamento, confirmação com o fornecedor do polo e prazo de entrega ou retirada — em tempo real.',
  },
  ...Object.fromEntries(
    malha.map((p) => [`porcelanato/${p.slug}`, { title: p.titulo, description: p.intro.slice(0, 140) }]),
  ),
  ...Object.fromEntries(
    guias.map((g) => [`guia/${g.slug}`, { title: g.titulo, description: g.descricao.slice(0, 140) }]),
  ),
};

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    logo: { path: './public/roilabs-logo.png', size: [280] },
    bgGradient: [[20, 23, 29]], // --ink do site (#14171d)
    border: { color: [255, 77, 0], width: 10, side: 'block-end' }, // laranja hi-vis
    padding: 60,
    font: {
      title: { size: 60, weight: 'Bold', color: [244, 244, 240], lineHeight: 1.2 },
      description: { size: 28, color: [170, 175, 185], lineHeight: 1.4 },
    },
  }),
});
