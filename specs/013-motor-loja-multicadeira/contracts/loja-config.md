# Contrato — "abrir a loja de uma cadeira"

Este é o contrato que a feature inteira existe para criar (FR-001, SC-001): **o que alguém
precisa escrever** para uma cadeira ocupada passar a vender, e **o que o build cobra** em troca.

Se abrir uma loja exigir qualquer coisa fora desta página, o motor não está pronto.

## O que se declara

**Três arquivos. Nada além.**

> Nasceu como "dois arquivos" (T021). Na prática são três: o site (Astro estático) e o servidor
> (Next, `/api/pedidos`) são **dois containers, dois deploys**, e o site não pode importar do
> app. O servidor precisa da própria cópia da configuração de cobrança/frete/documento/clichê
> para resolver a cadeira sem depender do build do site. É duplicação **deliberada**, não uma
> falha do motor — ver o comentário em `app/src/lib/lojas.ts`. Teto registrado: mais de 5
> cadeiras, ou os dois espelhos divergindo na prática, é o gatilho para extrair para um pacote
> compartilhado (`packages/lojas`). Até lá, o par abaixo é o custo aceito de abrir uma cadeira.

### 1. Uma entrada em `site-goiania/src/data/lojas.ts`

```ts
{
  id: 'exemplo',                 // vira Pedido.cadeira
  prefixoRota: 'exemplo',        // a URL fica /exemplo/<slug>/ — único entre cadeiras
  unidade: 'assinatura',         // 'm2' | 'rolo' | 'assinatura'
  catalogo: produtosExemplo,     // o arquivo abaixo
  modoCobranca: 'roilabs',       // 'roilabs' (gera pedido) | 'parceiro' (não gera)
  checkoutUrl: null,             // obrigatório quando modoCobranca = 'parceiro'
  pagoA: 'ROI Labs',             // exibido ao comprador ANTES de pagar
  frete: 'nenhum',               // 'tabela-cep' | 'cotacao' | 'nenhum'
  docObrigatorio: false,
  cupomEscopo: 'exemplo',
  linhaFixa: null,
  publicada: false,              // true só quando o conteúdo e a cobrança estiverem prontos
}
```

### 2. A mesma entrada, espelhada em `app/src/lib/lojas.ts`

Mesmo `id`, `prefixoRota`, `unidade`, `recorrencia`, `modoCobranca`, `checkoutUrl`, `pagoA`,
`frete`, `docObrigatorio`, `cupomEscopo`, `linhaFixa`, `publicada` — **sem** o campo `catalogo`
(o servidor não importa catálogo de propósito; preço vem de `precos.ts`/`precos-fitas.ts`/
`precos-assinatura.ts`, nunca do cliente). Sem esta entrada, `getLoja(id)` em `/api/pedidos`
devolve `null` e o checkout nunca resolve a cadeira, mesmo que a vitrine já esteja no ar.

### 3. Um catálogo, `site-goiania/src/data/<cadeira>.ts`

Uma lista de produtos. O que cada produto precisa depende da unidade:

| Unidade | Campos exigidos além de `slug`, `nome`, `preco`, `imagem` |
|---|---|
| `m2` | `m2PorCaixa`, `dimensao` |
| `rolo` | `faixas: [{ min, max, precoRolo }]`, `minimo` |
| `assinatura` | `recorrencia: 'mensal' \| 'anual'` |

## O que o build cobra (`check-lojas.mjs`, no `prebuild` — quebra, não avisa)

1. `prefixoRota` único entre cadeiras.
2. `slug` único dentro do catálogo.
3. Todo produto com `preco > 0` e imagem — **o gate que já existe hoje** (FR-019).
4. `modoCobranca: 'parceiro'` ⇒ `checkoutUrl` `https` absoluto.
5. `publicada: true` ⇒ catálogo não vazio (FR-007: vitrine vazia indexável é a "página fina"
   que a 012 proíbe).
6. `unidade` existe em `unidades.ts`.

⚠️ `check-lojas.mjs` só valida o lado do site. **Não existe hoje** um teste de paridade
automático entre `site-goiania/src/data/lojas.ts` e `app/src/lib/lojas.ts` — o texto original
desta feature previa um (padrão `check-matrix.mjs`) e ele nunca foi escrito. Até existir,
divergência entre os dois espelhos só aparece em runtime (`getLoja()` volta `null`, ou os dois
lados discordam sobre `publicada`/`frete`/`docObrigatorio`). Conferir os dois arquivos a olho
ao editar qualquer um deles.

## O que NÃO se escreve

Esta é a lista que define se a feature foi entregue:

- ❌ nenhuma rota (`.astro`, route handler)
- ❌ nenhuma tela de carrinho
- ❌ nenhuma tabela, coluna ou migração
- ❌ nenhum ramo em `/api/pedidos`
- ❌ nenhuma regra de cupom, frete ou entrega em código

## Como isso é medido (SC-001)

Declarar uma cadeira de teste, percorrer vitrine → carrinho → checkout até a intenção de
pagamento, e rodar:

```bash
git diff --name-only
```

O resultado tem de conter **apenas** os três arquivos acima: `site-goiania/src/data/lojas.ts`,
`app/src/lib/lojas.ts` e o arquivo de catálogo novo. Qualquer outro arquivo na lista — rota,
carrinho, checkout, schema — é a feature reprovando o próprio critério, e o arquivo que
apareceu diz exatamente onde o motor ainda tem um ramo por cadeira. Os dois `lojas.ts` contam
como o custo aceito de configuração (T023), não como código novo.

Depois: remover a cadeira de teste e conferir que a loja volta ao estado anterior.
