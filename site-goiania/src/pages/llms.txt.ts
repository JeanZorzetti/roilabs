import type { APIRoute } from 'astro';
import { pages } from '../data/porcelanato';
import { produtos, nomeProduto } from '../data/produtos';
import { guias as guiasDecisao } from '../data/guias';
import { ambientes } from '../data/ambientes';
import { fitas, formatPreco, menorPreco } from '../data/fitas';

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

  const body = `# ROI Labs — Fitas adesivas (Brasil) e porcelanato (Goiânia)

> Dois verticais, coberturas diferentes. **Fitas adesivas para embalagem**: venda nacional, preço por faixa de volume, compra direta no site e frete calculado por CEP para todo o Brasil. **Porcelanato**: guias de alta intenção e catálogo real para Goiânia (GO), por tipo, acabamento, ambiente, dimensão e intenção local de compra, com orçamento por WhatsApp e pronta-entrega no polo. Curadoria ROI Labs, Growth Partner.

## Fitas adesivas (venda nacional)
- [Fitas adesivas — vitrine](${SITE}/fitas/): três SKUs para expedição e lacre de caixa.
${fitas
  .map(
    (f) =>
      `- [${f.nome}](${SITE}/fitas/${f.slug}/): ${f.specs.map((s) => `${s.label} ${s.valor}`).join(', ')}. Mínimo ${f.minimoRolos} rolo(s). ${
        f.modalidade === 'precoPublico'
          ? `Preço público a partir de ${formatPreco(menorPreco(f))} por rolo, compra direta no carrinho.`
          : `Venda sob orçamento (cada arte exige clichê flexográfico próprio, custo único por arte); referência a partir de ${formatPreco(menorPreco(f))} por rolo.`
      }`,
  )
  .join('\n')}
- Preço cai por faixa de quantidade; o servidor é a autoridade do valor cobrado e o frete é cotado por transportadora no CEP de destino.
- CPF ou CNPJ é obrigatório no pedido de fita.

## Como funciona (porcelanato)
- A malha cobre porcelanato por tipo × característica × ocasião × intenção local.
- Cada guia leva ao WhatsApp ou a um formulário de orçamento; a venda fecha com o fornecedor exclusivo do polo de Goiânia.
- Volume de busca validado no planejador de palavras-chave (DataForSEO); páginas nascem de demanda real.

## Ferramentas
- [Calculadora de porcelanato: quantos m² e caixas comprar?](${SITE}/calculadora/): informe os ambientes, a folga de corte e os m² por caixa; resultado em caixas fechadas.
- [Comparador de porcelanatos](${SITE}/comparar/): compare 2 ou 3 modelos do catálogo lado a lado — preço por m² e por caixa, dimensão, acabamento, retificado e classe AD.
- [Inspire-se](${SITE}/inspire-se/): mural de ambientes reais com porcelanato do catálogo, cada foto linkando pro produto.
${ambientes.map((a) => `- [${a.titulo}](${SITE}/inspire-se/${a.slug}/): ${a.descricao}`).join('\n')}
- [Glossário de porcelanato](${SITE}/glossario/): 20 termos técnicos (PEI, absorção de água, retificado, calibre, destonalização, argamassa AC-II/AC-III...) explicados em linguagem de comprador, com âncora por termo.

## Guias de decisão
- [Índice dos guias (jornada: escolher → comparar → orçar → instalar → manter)](${SITE}/guia/)
- [Feed RSS dos guias](${SITE}/rss.xml)
${guiasDecisao.map((g) => `- [${g.titulo}](${SITE}/guia/${g.slug}/): ${g.descricao}`).join('\n')}

## Guias de porcelanato
${guias}

## Catálogo (produtos reais)
${catalogo}

## Contato
- [Como funciona: quem somos, entrega, pagamento e devolução](${SITE}/sobre/)
- Fitas adesivas: cobertura nacional (Brasil). Porcelanato: polo de Goiânia, GO.
- Local: Goiânia, GO, Brasil
- Orçamento: WhatsApp e formulário nas páginas de guia e de produto.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
