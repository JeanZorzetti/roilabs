# Contrato — "abrir a loja de uma cadeira"

Este é o contrato que a feature inteira existe para criar (FR-001, SC-001): **o que alguém
precisa escrever** para uma cadeira ocupada passar a vender, e **o que o build cobra** em troca.

Se abrir uma loja exigir qualquer coisa fora desta página, o motor não está pronto.

## O que se declara

**Dois arquivos. Nada além.**

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

### 2. Um catálogo, `site-goiania/src/data/<cadeira>.ts`

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

O resultado tem de conter **apenas** `site-goiania/src/data/lojas.ts` e o arquivo de catálogo
novo. Qualquer outro arquivo na lista é a feature reprovando o próprio critério — e o arquivo
que apareceu diz exatamente onde o motor ainda tem um ramo por cadeira.

Depois: remover a cadeira de teste e conferir que a loja volta ao estado anterior.
