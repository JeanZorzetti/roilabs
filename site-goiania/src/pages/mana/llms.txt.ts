import type { APIRoute } from 'astro';
import { produtosMana } from '../../data/mana';

// llms.txt PRÓPRIO da Maná (015 T019) — o root do nginx é compartilhado, então este
// arquivo precisa existir separado do llms.txt do porcelanato/fitas.
const SITE = 'https://mana.roilabs.com.br';

export const GET: APIRoute = () => {
  const catalogo = produtosMana
    .map((p) => `- [${p.nome}](${SITE}/mana/${p.slug}/): ${p.chamadaVitrine}.`)
    .join('\n');

  const body = `# Maná Moda Social — moda social masculina

> Camisas, calça e terno para o dia que pede formalidade. Corte clássico, acabamento premium, envio para todo o Brasil. Loja operada pela ROI Labs, Growth Partner.

## Catálogo
${catalogo}

## Como funciona
- Peça vendida por variação (tamanho × cor), com estoque próprio por variação.
- Frete calculado pelo CEP de destino, cobertura nacional.
- CPF ou CNPJ e e-mail são obrigatórios no pedido.

## Contato
- Instagram: https://instagram.com/manamodasocial
- Local: Goiânia, GO, Brasil — envio para todo o Brasil
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
