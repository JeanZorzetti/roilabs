import type { APIRoute } from 'astro';
import { pages } from '../data/porcelanato';
import { produtos, nomeProduto } from '../data/produtos';
import { guias as guiasDecisao } from '../data/guias';

const SITE = 'https://goiania.roilabs.com.br';

// Gerado da fonte (pages + produtos) — paridade com sitemap.xml.ts. Nunca dessincroniza.
// Dimensões reais da malha: tipo × característica × ocasião × intenção local (NÃO por bairro — spec 001 D8).
export const GET: APIRoute = () => {
  const guias = pages
    .map((p) => `- [${p.titulo}](${SITE}/porcelanato/${p.slug}/): ${p.termoAlvo}.`)
    .join('\n');

  const catalogo = produtos
    .map((p) => `- [${nomeProduto(p)}](${SITE}/porcelanato/produto/${p.slug}/)`)
    .join('\n');

  const body = `# ROI Labs — Porcelanato em Goiânia

> Guias de alta intenção e catálogo real de porcelanato para Goiânia (GO): por tipo, acabamento, ambiente, dimensão e intenção local de compra. Cada guia traz "como escolher", FAQ e os produtos reais que casam, com orçamento por WhatsApp e pronta-entrega no polo de Goiânia. Curadoria ROI Labs, Growth Partner do polo.

## Como funciona
- A malha cobre porcelanato por tipo × característica × ocasião × intenção local.
- Cada guia leva ao WhatsApp ou a um formulário de orçamento; a venda fecha com o fornecedor exclusivo do polo de Goiânia.
- Volume de busca validado no planejador de palavras-chave (DataForSEO); páginas nascem de demanda real.

## Ferramentas
- [Calculadora de porcelanato: quantos m² e caixas comprar?](${SITE}/calculadora/): informe os ambientes, a folga de corte e os m² por caixa; resultado em caixas fechadas.
- [Comparador de porcelanatos](${SITE}/comparar/): compare 2 ou 3 modelos do catálogo lado a lado — preço por m² e por caixa, dimensão, acabamento, retificado e classe AD.

## Guias de decisão
${guiasDecisao.map((g) => `- [${g.titulo}](${SITE}/guia/${g.slug}/): ${g.descricao}`).join('\n')}

## Guias de porcelanato
${guias}

## Catálogo (produtos reais)
${catalogo}

## Contato
- [Como funciona: quem somos, entrega, pagamento e devolução](${SITE}/sobre/)
- Local: Goiânia, GO, Brasil
- Orçamento: WhatsApp e formulário nas páginas de guia e de produto.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
