import type { APIRoute } from 'astro';
import { produtos, tituloProduto, formatPreco } from '../data/produtos';
import { pages } from '../data/porcelanato';
import { guias } from '../data/guias';
import { ambientes } from '../data/ambientes';
import { fitas, formatPreco as formatPrecoFita, menorPreco } from '../data/fitas';

// Índice da busca interna, gerado no build a partir das mesmas fontes do
// sitemap (produtos + categorias + guias + calculadora). O client (SiteSearch)
// baixa 1× e filtra localmente — zero dependência, zero backend.

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const GET: APIRoute = () => {
  const entries = [
    ...fitas.map((f) => ({
      t: f.nome,
      s:
        f.modalidade === 'precoPublico'
          ? `Fita adesiva · a partir de ${formatPrecoFita(menorPreco(f))}/rolo`
          : 'Fita adesiva · sob orçamento',
      u: `/fitas/${f.slug}/`,
      k: norm(
        `${f.nome} ${f.slug.replace(/-/g, ' ')} fita adesiva fitas embalagem lacre caixa rolo ${f.specs.map((x) => x.valor).join(' ')}`,
      ),
    })),
    {
      t: 'Fitas adesivas (vitrine)',
      s: 'Catálogo',
      u: '/fitas/',
      k: norm('fitas adesivas fita embalagem lacre caixa bopp gomada kraft personalizada rolo preco por rolo'),
    },
    ...produtos.map((p) => {
      const a = p.atributos;
      const t = tituloProduto(p);
      return {
        t,
        s: `${a.dimensao} · ${a.acabamento} · ${formatPreco(a.preco)}/m²`,
        u: `/porcelanato/produto/${p.slug}/`,
        k: norm(`${t} ${p.slug.replace(/-/g, ' ')} ${a.marca} ${a.dimensao} ${a.acabamento} porcelanato`),
      };
    }),
    ...pages.map((c) => ({
      t: c.titulo,
      s: 'Categoria',
      u: `/porcelanato/${c.slug}/`,
      k: norm(`${c.titulo} ${c.termoAlvo} ${c.tipo} ${c.slug.replace(/-/g, ' ')}`),
    })),
    ...guias.map((g) => ({
      t: g.titulo,
      s: 'Guia',
      u: `/guia/${g.slug}/`,
      k: norm(`${g.titulo} ${g.slug.replace(/-/g, ' ')} guia`),
    })),
    ...ambientes.map((a) => ({
      t: a.titulo,
      s: 'Inspiração',
      u: `/inspire-se/${a.slug}/`,
      k: norm(`inspire-se inspiracao fotos ambientes ${a.nome} porcelanato ${a.slug.replace(/-/g, ' ')}`),
    })),
    {
      t: 'Guias de porcelanato (índice: escolher, comparar, orçar, instalar, manter)',
      s: 'Guia',
      u: '/guia/',
      k: norm('guias indice como escolher comparar orcar instalar manter limpar assentar dicas passo a passo porcelanato'),
    },
    {
      t: 'Calculadora de porcelanato (m² → caixas)',
      s: 'Ferramenta',
      u: '/calculadora/',
      k: norm('calculadora quantas caixas m2 metragem quanto porcelanato preciso calcular'),
    },
    {
      t: 'Comparador de porcelanatos (lado a lado)',
      s: 'Ferramenta',
      u: '/comparar/',
      k: norm('comparar comparador comparacao diferenca entre porcelanatos qual melhor preco lado a lado'),
    },
    {
      t: 'Glossário de porcelanato (PEI, retificado, calibre...)',
      s: 'Guia',
      u: '/glossario/',
      k: norm('glossario termos significado o que e pei absorcao de agua esmaltado tecnico destonalizacao lote tonalidade polido acetinado natural mate antiderrapante coeficiente atrito retificado bold calibre m2 por caixa formato grande junta rejunte argamassa colante ac-i ac-ii ac-iii paginacao nivelador'),
    },
    {
      t: 'Como funciona — quem somos, entrega e pagamento',
      s: 'Institucional',
      u: '/sobre/',
      k: norm('como funciona sobre quem somos entrega prazo frete pagamento pix cartao mercado pago devolucao troca confianca loja'),
    },
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
