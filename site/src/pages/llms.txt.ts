import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://roilabs.com.br';

// Gerado da coleção blog — paridade com sitemap.xml.ts. Nunca dessincroniza
// (o llms.txt manual em public/ já ficou para trás uma vez; foi removido).
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf(),
  );

  const artigos = posts
    .map((p) => `- [${p.data.title}](${SITE}/blog/${p.id}/): ${p.data.description}`)
    .join('\n');

  const body = `# ROI Labs

> ROI Labs é um Growth Partner para fornecedores regionais de alto padrão. Construímos a operação de vendas online (SEO programático de alta intenção + captação) sem custo fixo: o fornecedor paga uma fração variável só quando vende. Modelo de cadeira exclusiva — 1 empresa por nicho, por polo. Polo 1: Goiânia (GO); nicho âncora: revestimentos / porcelanato.

## Como funciona
- Sem mensalidade e sem risco de tecnologia: a ROI Labs banca a infraestrutura e o tráfego.
- Remuneração 100% variável, atrelada à venda (pago pelo sucesso).
- Exclusividade: uma cadeira por nicho, por polo, renovável por desempenho (SLA de estoque e despacho).
- Canal primário: páginas de alta intenção (produto × característica × ocasião × intenção local), validadas por volume real de busca, não mídia paga.

## Páginas principais
- [Home e candidatura](${SITE}/): o modelo, o mapa de cadeiras de Goiânia e o formulário de candidatura do fornecedor.
- [O modelo Growth Partner](${SITE}/modelo/): os três gates de validação, a fórmula pública do success fee, a exclusividade de cadeira e as 6 etapas da candidatura ao contrato.
- [Polo Goiânia — case vivo](${SITE}/polo-goiania/): o que a cadeira de porcelanato recebe na prática — 93 páginas no ar, malha de intenção de 40 páginas, catálogo de 30 produtos, calculadora, comparador e feed Merchant Center, tudo verificável no site público.
- [Simulador de receita](${SITE}/simulador/): fornecedor candidato simula ticket médio × pedidos/mês e vê a receita projetada e o líquido após o success fee.
- [Blog](${SITE}/blog/): como fornecedores de revestimentos e materiais de construção em Goiânia vendem pela internet.
- [Feed RSS do blog](${SITE}/rss.xml)

## Artigos
${artigos}

## Contato
- E-mail: parceria@roilabs.com.br
- Local: Goiânia, GO, Brasil
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
