// Autores do blog: página /autor/<slug>/, assinatura com link e nó Person do JSON-LD.
// O frontmatter `author` do post precisa ser igual a `nome`; "Equipe ROI Labs" continua
// sendo a empresa (Organization). Só dado real: bio, links e foto vêm da própria pessoa.
export interface Autor {
  slug: string;
  nome: string;
  /** Parágrafos da bio (página de autor); o primeiro também vira `description` do Person. */
  bio: string[];
  knowsAbout: string[];
  /** Perfis públicos da pessoa (LinkedIn etc.). Vazio até ela passar. */
  sameAs: string[];
}

export const AUTORES: Autor[] = [
  {
    slug: 'maria-eduarda-zorzetti',
    nome: 'Maria Eduarda Zorzetti',
    bio: [
      'Maria Eduarda Zorzetti cuida do blog da ROI Labs e de como a empresa aparece na busca do Google e nas respostas de inteligência artificial.',
      'Antes de trabalhar com conteúdo, fez carreira em vendas: foi vendedora, BDR e SDR, atendendo clientes, qualificando contatos e fechando vendas. É dessa experiência que vem o foco dos textos dela: o que acontece entre a busca do cliente e a venda que entra no caixa da empresa.',
    ],
    knowsAbout: ['Vendas', 'Pré-vendas (BDR e SDR)', 'SEO', 'Marketing por resultado'],
    sameAs: [],
  },
];

export const autorPorNome = (nome: string) => AUTORES.find((a) => a.nome === nome);

export const autorUrl = (a: Autor) => `https://roilabs.com.br/autor/${a.slug}/`;

export const personId = (a: Autor) => `${autorUrl(a)}#person`;

/** Nó Person completo; a página do autor e cada artigo dele emitem o mesmo @id. */
export const personNode = (a: Autor) => ({
  '@type': 'Person',
  '@id': personId(a),
  name: a.nome,
  url: autorUrl(a),
  description: a.bio[0],
  knowsAbout: a.knowsAbout,
  worksFor: { '@id': 'https://roilabs.com.br/#org' },
  ...(a.sameAs.length > 0 && { sameAs: a.sameAs }),
});
