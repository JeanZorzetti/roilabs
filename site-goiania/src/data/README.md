# Como adicionar uma página ao site Goiânia

## Regra básica

Adicionar 1 página = adicionar 1 entrada ao array `pages` em `porcelanato.ts`.  
O template, o sitemap e os links de relacionados são gerados automaticamente.

## Campos obrigatórios

```ts
{
  slug: string,        // URL: /porcelanato/{slug}. Único. Kebab-case.
  termoAlvo: string,   // Keyword principal (ex: "porcelanato amadeirado")
  volume: number,      // Buscas/mês local estimadas. DEVE ser > 0.
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

## De onde vêm os volumes

Fonte: snapshot do Keyword Planner em `Docs/Obsidian/10-mercado/mercado.md`.  
Nunca adicione uma entrada com `volume: 0` — o build irá falhar.

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
    'Prefira PEI 4 para tráfego comercial moderado.',
    'Acabamento natural disfarça riscos de cadeiras de escritório.',
  ],
  atributos: {
    pei: 4,
    acabamento: 'Natural',
    dimensao: '60×60 cm',
    ambiente: 'Escritório, recepção',
  },
  faq: [
    { q: 'Qual o melhor piso para escritório?', a: 'PEI 4 acetinado ou natural, fácil de limpar e resistente ao tráfego de cadeiras.' },
  ],
}
```
