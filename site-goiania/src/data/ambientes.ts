import { produtos, type Produto } from './produtos';

// Curadoria manual (tarefa 5 do macro plano 2): cada foto de imagensAmbiente
// do catálogo foi olhada uma a uma e classificada pelo cômodo que mostra.
// Nome de arquivo/slug não carrega sinal de ambiente — a classificação vive
// aqui. Ficaram FORA das listas, com motivo:
// - close-up de textura (não é ambiente): strato-marmo-bege, strato-marmo-
//   grigio, urban-branco-polido, pietra-di-matera, rock-face-matera;
// - quarto: só 2 fotos (carvalho-natural, cristallo-quartz) — <4, sem página;
// - banheiro: 4 produtos mas só 3 fotos únicas (100x100-lux reusa a foto do
//   pulpis-grigio) — <4, sem página;
// - arezzo-beige-biancogres reusa a foto do arezzo-externo-beige (dup visual,
//   entra só o "externo" que é o produto da foto).
// ponytail: mapa fixo; reclassificar à mão quando fetch-ambiente ganhar fotos.
const POR_PRODUTO: Record<string, string> = {
  // sala de estar / jantar (5 fotos)
  'porcelanato-marmo-perla-biancogres': 'sala',
  'porcelanato-legado-grigio-ac-biancogres': 'sala',
  'porcelanato-persia-beige-biancogres': 'sala',
  'porcelanato-chicago-nebbia-biancogres': 'sala',
  'porcelanato-chicago-80x80-grafite-biancogres': 'sala',
  // área externa / varanda / piscina (8 fotos únicas)
  'porcelanato-120x120-tivoli-biancogres': 'area-externa',
  'porcelanato-arezzo-grigrio-biancogres': 'area-externa',
  'porcelanato-grigio-externo-biancogres': 'area-externa',
  'porcelanato-chigaco-grigio-biancogres': 'area-externa',
  'porcelanato-grigio-externo-90x90': 'area-externa',
  'porcelanato-arezzo-externo-beige': 'area-externa',
  'porcelanato-castilla-noce-biancogres': 'area-externa',
  'porcelanato-terrazine-91x91cm-savane': 'area-externa',
};

export interface Ambiente {
  slug: string;
  nome: string;
  titulo: string;
  descricao: string;
}

export const ambientes: Ambiente[] = [
  {
    slug: 'sala',
    nome: 'Sala',
    titulo: 'Porcelanato na sala: ambientes reais',
    descricao:
      'Salas de estar e jantar com porcelanato do catálogo de Goiânia: marmorizados claros, cinzas e formatos grandes aplicados de verdade, cada foto linkando pro produto com preço.',
  },
  {
    slug: 'area-externa',
    nome: 'Área externa',
    titulo: 'Porcelanato em área externa: ambientes reais',
    descricao:
      'Varandas, terraços e bordas de piscina com porcelanato antiderrapante do catálogo de Goiânia aplicado de verdade, cada foto linkando pro produto com preço.',
  },
];

export const produtosDoAmbiente = (slug: string): Produto[] =>
  produtos.filter((p) => POR_PRODUTO[p.slug] === slug && p.imagensAmbiente?.length);
