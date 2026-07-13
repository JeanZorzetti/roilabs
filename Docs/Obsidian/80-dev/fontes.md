---
tipo: dev
data: 2026-07-13
projeto: site-goiania
---

# Fontes do goiânia — self-hosted e subsetadas

> **BLUF:** as fontes NÃO vêm mais do Google Fonts. Elas moram em
> `site-goiania/public/fonts/`, são variáveis e estão subsetadas em Latin-1.
> Mexeu em peso ou família? Tem que **regerar o arquivo** — não basta editar o CSS.

## Por que

O LCP das páginas da malha era 5,9s. Servir as fontes pelo Google custava duas
conexões novas **em série** (`fonts.googleapis.com` para o CSS →
`fonts.gstatic.com` para o woff2) antes do primeiro byte de fonte chegar. Além
disso o browser só descobria a fonte depois de parsear o CSS.

Self-hosted + preload: a fonte começa a baixar junto com o HTML, na conexão que
já está aberta.

## O que está no ar

| Arquivo | Cobre | Tamanho |
|---|---|---|
| `archivo-var.woff2` | Archivo, pesos **600–800** (display/títulos) | 26,5 KB |
| `hanken-grotesk-var.woff2` | Hanken Grotesk, pesos **400–600** (corpo) | 29,0 KB |
| `space-mono-400.woff2` | Space Mono 400 (eyebrow/dados) | 13,2 KB |
| `space-mono-700.woff2` | Space Mono 700 | 13,2 KB |

Total **82 KB** (era 202 KB em 7 estáticas, e 138 KB carregavam numa página só).

Archivo e Hanken são **variáveis**: um arquivo cobre a faixa inteira de pesos e
custa menos que as estáticas que substitui (Archivo 600/700/800 eram 79,5 KB em 3
arquivos → 26,5 KB em 1). Space Mono não tem versão variável no Google Fonts.

`Base.astro` dá **preload** em `hanken-grotesk-var` e `archivo-var` — as duas
pintam na primeira dobra (corpo e H1). Space Mono fica de fora de propósito.

## Como regerar (ao mudar peso/família)

Precisa de `fontTools` + `brotli` (`python -m pip install fonttools brotli`).

1. Pegue a URL do woff2 no CSS do Google (UA de Chrome moderno, senão vem TTF):

```bash
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0" \
  "https://fonts.googleapis.com/css2?family=Archivo:wght@600..800&display=swap"
```

Use a faixa `wght@600..800` (variável), **não** `wght@600;700;800` (estáticas).
Pegue o bloco `/* latin */` — o português inteiro cabe nele.

2. Subsete para o range abaixo e salve em `public/fonts/`:

```bash
python -m fontTools.subset entrada.woff2 \
  --unicodes="U+0020-00FF,U+0131,U+0152-0153,U+2013-2014,U+2018-2019,U+201C-201D,U+2022,U+2026,U+2039-203A,U+2190,U+2192,U+2212,U+2248,U+2264-2265,U+20AC,U+0394,U+2713,U+2715,U+00D7" \
  --layout-features='kern,liga,calt' --flavor=woff2 \
  --output-file=public/fonts/nome-var.woff2
```

3. Ajuste o `@font-face` em `src/styles/fonts.css` (a faixa vai em
   `font-weight: 600 800`) e o `preload` em `Base.astro` se trocou o nome.

## ⚠️ Latin-1 fica inteiro — não corte pelos caracteres do HTML

O site inteiro usa só 135 caracteres distintos, e é tentador subsetar só eles.
**Não faça.** `text-transform: uppercase` renderiza **Á/Ã/Ç** a partir de texto
minúsculo no HTML — os glifos maiúsculos acentuados não aparecem na varredura do
HTML, mas o browser precisa deles. Cortar por caractere literal quebra títulos.
Por isso o range mantém `U+0020-00FF` (Latin-1) inteiro, com margem pra conteúdo
futuro.

O resto do range são os símbolos que o site usa de fato: `— – … › ← → ² × ≈ ≤ ≥ ✓ ✕ Δ`.

## Como verificar que não quebrou

No browser, com a página aberta:

```js
await document.fonts.ready;
[...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.weight}`);
// esperado: ["Archivo 600 800", "Hanken Grotesk 400 600", "Space Mono 400", "Space Mono 700"]
```

Se um peso aparecer **sintetizado** (faux bold) em vez de real, o eixo `wght` não
cobriu o peso pedido. Confirme medindo larguras diferentes por peso:

```js
const m = (w) => { const c = document.createElement('canvas').getContext('2d');
  c.font = `${w} 40px Archivo`; return c.measureText('Goiânia').width; };
m(600), m(700), m(800); // têm que ser DIFERENTES entre si
```

Ver também: [[cwv]] (medição), [[performance-goiania]].
