---
tipo: decisão
status: reprovada
data: 2026-09-23
dono: Jean (dev)
---

# Marca nimblabs: proposta (reprovada)

> **23/09/2026: reprovada pelo Jean** ("marca reprovada, vamos manter a atual"). O site novo usa a marca atual (Archivo 800 com o "b" aberto), trazida do repositório antigo no commit `9fc38f9` de `nimblabs-site`. Esta nota fica como registro da proposta.

Tarefa 2 do [[nimblabs-site-plano-2026-09-23]]. Passos da `logo-design`, com a ideia aprovada na especificação ([[nimblabs-site-design-2026-09-22]], seção 5): a fábrica é a mesma peça repetida, e uma peça é sob medida.

![[nimblabs-marca/prancha.png]]

## A ideia

- **Nome:** feito a partir da fonte Recursive, com licença SIL OFL 1.1, que permite modificar e usar em marca. Toda letra ocupa a mesma casa (60 unidades), como numa fonte de código: é a **peça padrão**. Só o **m**, de "medida", usa a largura dele (85 unidades): é a **peça sob medida**.
- **Símbolo:** o código de barras de "nimb", com uma barra por letra. A largura de cada barra sai da área de tinta da letra dentro da casa dela. O i fica fino, e o m, com três hastes e casa própria, é a barra mais grossa.
- **"Código" vale três vezes:** software, códigos fiscais (NCM, NBS, cClassTrib, o produto B) e código de barras de produto (o cadastro e o ERP dos produtos B e C).

## Testes da `logo-design`, no print

| Teste | Resultado |
|---|---|
| Nomear a forma em uma palavra a 32 px | "código de barras" |
| 16 px (ícone da aba) | 4 barras contáveis, cerca de 1,9 px cada |
| Nome a 14 px | as letras não fecham |
| Uma cor, fundo claro e fundo escuro | passa, com a mesma geometria |
| Símbolo e nome da mesma família | as barras têm peso parecido com as hastes das letras |
| Marca ocupando a caixa | viewBox cortado na área real da forma, com margem de 2 |
| Troca por "Acme" | **passa em parte.** Um código de barras ao lado de outro nome continua sendo um código de barras. O que é só da nimblabs está no nome: a casa larga do m. |

![[nimblabs-marca/folha-de-contato.png]]

## Descartadas

- **Sem a peça sob medida** (tudo monoespaçado): o m fica espremido, e sobra um nome em fonte de código, igual ao de qualquer ferramenta de programador.
- **Código de barras com as 8 letras:** empastela abaixo de 32 px, e ao lado do nome as barras finas ficam mais leves que as letras, parecendo dois arquivos colados.

## Entregáveis (no repositório `nimblabs-site`, só entram no commit depois da aprovação)

- Componentes `Logo`, `Wordmark` e `Marca` (símbolo e nome juntos): SVG com `currentColor`, nome acessível "nimblabs" e a receita de regeração no comentário.
- `icon.svg` com cor fixa e modo escuro no próprio arquivo; `apple-touch-icon.png` de 180×180, sem transparência.
- `og.png` de 1200×630 com o conjunto empilhado, dentro do quadrado central e com 39% da altura:

![[nimblabs-marca/og.png]]

As cores vêm depois, com a direção visual (Tarefa 3). A marca funciona em qualquer cor.
