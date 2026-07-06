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
  {
    slug: 'porcelanato-area-externa',
    titulo: 'Porcelanato para área externa: antiderrapante, PEI e formatos',
    descricao:
      'Coeficiente de atrito, absorção de água, classe de abrasão e formato certo para varanda, quintal, garagem e borda de piscina — com os produtos do catálogo que atendem.',
  },
  {
    slug: 'rejunte-porcelanato',
    titulo: 'Rejunte para porcelanato: cor, tipo e quantidade',
    descricao:
      'Tom-sobre-tom ou contraste, cimentício vs acrílico vs epóxi e quantos kg/m² comprar — com a calculadora que estima rejunte e argamassa junto com as caixas.',
  },
  {
    slug: 'porcelanato-liquido-vs-porcelanato',
    titulo: 'Porcelanato líquido vs porcelanato: qual a diferença real?',
    descricao:
      'Porcelanato líquido é resina epóxi, não cerâmica — comparativo honesto de custo por m², durabilidade, manutenção e revenda entre a resina autonivelante e a placa de porcelanato.',
  },
  {
    slug: 'quanto-custa-porcelanato',
    titulo: 'Quanto custa porcelanato em Goiânia: m², colocação e custo total',
    descricao:
      'Faixas reais de preço por m² do catálogo do polo (por acabamento), estimativa de mão de obra de assentamento e a conta do custo total — com exemplo para 60 m².',
  },
  {
    slug: 'como-limpar-porcelanato',
    titulo: 'Como limpar porcelanato: rotina, produtos e manchas por acabamento',
    descricao:
      'Limpeza diária e pesada para polido, acetinado, natural/técnico e área externa — o que nunca usar (ácido, cera, abrasivo), como tirar manchas comuns e a limpeza pós-obra sem estragar o piso.',
  },
  {
    slug: 'como-assentar-porcelanato',
    titulo: 'Como assentar porcelanato: passo a passo, argamassa e junta',
    descricao:
      'As etapas reais do assentamento — contrapiso, argamassa AC-II/AC-III, dupla colagem em formato grande, junta mínima com nivelador e rejunte após a cura — e quando vale contratar um assentador profissional.',
  },
  {
    slug: 'erros-ao-comprar-porcelanato',
    titulo: 'Erros ao comprar porcelanato: os 10 mais caros e como evitar',
    descricao:
      'Comprar sem folga de 10–15%, ignorar o PEI, misturar lotes e calibres, polido em área molhada, esquecer frete e m²/caixa — cada erro com o guia ou a ferramenta que o evita antes do pedido.',
  },
  {
    slug: 'piso-vinilico-vs-porcelanato',
    titulo: 'Piso vinílico vs porcelanato: qual escolher para cada ambiente?',
    descricao:
      'LVT/SPC ou placa cerâmica — comparativo honesto de custo por m² instalado, durabilidade da capa de uso, resistência à umidade, conforto térmico/acústico e valor de revenda, com o ambiente certo para cada um.',
  },
] as const;

export type Guia = (typeof guias)[number];
