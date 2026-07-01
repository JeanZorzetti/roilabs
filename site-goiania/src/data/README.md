# Como adicionar uma página ao site Goiânia

## Regra básica

Adicionar 1 página = adicionar 1 entrada ao array `pages` em `porcelanato.ts`.  
O template, o sitemap e os links de relacionados são gerados automaticamente.

## Campos obrigatórios

```ts
{
  slug: string,        // URL: /porcelanato/{slug}. Único. Kebab-case.
  termoAlvo: string,   // Keyword principal (ex: "porcelanato amadeirado")
  volume: number,      // Buscas/mês REAIS (Goiás, DataForSEO). Gate: > 0. Combos NOVOS: >= 200.
  tipo: string,        // ex: amadeirado, marmorizado, antiderrapante, genérico
  titulo: string,      // H1 e <title>
  intro: string,       // Parágrafo de abertura local (mencione Goiânia)
  comoEscolher: string[],   // Lista de bullets de orientação (E-E-A-T)
  atributos: { ... },  // Tabela técnica (veja interface)
  faq: { q, a }[],    // Mínimo 2 perguntas
}
```

## Campos opcionais

- `ocasiao`: ambiente/uso (ex: "cozinha", "área externa")
- `relacionados`: array de slugs para links internos do silo

## Produtos reais (catálogo)

`porcelanatos.json` (raiz do `site-goiania/`) é o catálogo minerado de fornecedores.
Cada categoria casa automaticamente com os produtos compatíveis (por tipo/acabamento/
dimensão — ver `tagsDoProduto` em `produtos.ts`) e exibe a galeria + cria 1 página por
produto em `/porcelanato/produto/{slug}`.

**Para adicionar produtos:** acrescente entradas ao `porcelanatos.json` (slug único,
≥1 imagem, `preco > 0`). `classe_ad` vem da ficha real do produto — **nunca invente**;
deixe `null` se a fonte não informar.

## De onde vêm os volumes

**Fonte única: OpenSEO (self-hosted `open-seo/`, dados DataForSEO), base geográfica = Goiás estado.**
Minere o volume real do `termoAlvo` antes de criar a página — nunca estime à mão (spec 008).

- **Gate (build):** `volume > 0`, senão o build quebra. Nunca adicione `volume: 0`.
- **Regra de seleção (combos NOVOS):** só crie a página se `volume >= 200`. Abaixo disso o
  `check-matrix` emite um **warning** (não quebra) — são páginas grandfathered de baixa demanda,
  candidatas a poda futura.

Como minerar (OpenSEO precisa estar no ar em `localhost:3001`): consulte o volume do termo na
base "Goiás estado" (DataForSEO). Se o OpenSEO estiver fora, **não estime** — suba-o antes.

## Self-check

```sh
node src/scripts/check-matrix.mjs
```

Verde = matriz ok para build. Vermelho = corrigir antes do deploy.

## Exemplo mínimo

```ts
{
  slug: 'porcelanato-para-escritorio',
  termoAlvo: 'porcelanato para escritório',
  volume: 200,
  tipo: 'genérico',
  titulo: 'Porcelanato para Escritório em Goiânia',
  intro: 'O porcelanato para escritório em Goiânia precisa equilibrar estética corporativa...',
  comoEscolher: [
    'Prefira classe de abrasão 4 para tráfego comercial moderado.',
    'Acabamento natural disfarça riscos de cadeiras de escritório.',
  ],
  atributos: {
    // classeAd NÃO é inventada: fica vazia na categoria. A classe de abrasão real
    // aparece nas páginas de produto (produtos.ts), vinda do catálogo minerado.
    acabamento: 'Natural',
    dimensao: '60×60 cm',
    ambiente: 'Escritório, recepção',
  },
  faq: [
    { q: 'Qual o melhor piso para escritório?', a: 'PEI 4 acetinado ou natural, fácil de limpar e resistente ao tráfego de cadeiras.' },
  ],
}
```
