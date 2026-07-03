// Guias de decisão (AEO): páginas-resposta para queries de comparação/escolha
// ("polido ou acetinado?", "porcelanato ou cerâmica?", "como escolher?").
// Complementam a malha pSEO sem canibalizar — a malha cobre categorias
// (tipo × característica × ocasião), aqui é a dúvida ANTES da categoria.
// Conteúdo vive em src/pages/guia/{slug}.astro; este registro alimenta
// sitemap.xml.ts, llms.txt.ts e os blocos de interlink.
export const guias = [
  {
    slug: 'porcelanato-polido-ou-acetinado',
    titulo: 'Porcelanato polido ou acetinado: qual escolher?',
    descricao:
      'Comparação direta entre os dois acabamentos — brilho, segurança quando molhado, riscos, manutenção e em qual ambiente cada um funciona melhor.',
  },
  {
    slug: 'porcelanato-ou-ceramica',
    titulo: 'Porcelanato ou cerâmica: qual a diferença e qual vale mais a pena?',
    descricao:
      'Absorção de água, resistência, acabamento e custo total (peça + assentamento) — quando a cerâmica basta e quando o porcelanato compensa.',
  },
  {
    slug: 'como-escolher-porcelanato',
    titulo: 'Como escolher porcelanato: guia completo em 7 passos',
    descricao:
      'Do ambiente ao lote: acabamento, tamanho, retificado, PEI, estética e quantidade de caixas — com links para os guias e produtos de cada perfil.',
  },
] as const;

export type Guia = (typeof guias)[number];
