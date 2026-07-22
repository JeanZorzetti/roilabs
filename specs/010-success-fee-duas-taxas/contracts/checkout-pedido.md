# Contrato: Checkout / Pedido (deltas)

Captura do CPF/CNPJ do comprador no checkout B2C (`site-goiania`) → `Pedido.compradorDoc`.

## Formulário (site-goiania, checkout/carrinho)

- Novo campo **opcional** "CPF ou CNPJ (para nota/atendimento)" — sem `required` (Q1: não bloquear o B2C).
- Máscara/validação leve no cliente é bônus; a autoridade é o servidor.

## Servidor (criação do Pedido, `/app`)

- Ao criar o `Pedido`, ler o campo, **normalizar** (só dígitos) e **validar** formato (CPF 11 díg. ou CNPJ 14 díg.). Inválido/ausente → grava `null` (não bloqueia o pedido B2C).
- Persistir em `Pedido.compradorDoc`.

## Fluxo B2B/orçamento (futuro — fitas)

- Quando o e-commerce de fitas (`goiania` → Tapepro) nascer, o mesmo campo é **obrigatório** lá (bloqueia sem doc). Fora do escopo desta feature (documentado); esta feature só entrega o campo no `Pedido` + a captura opcional no checkout atual.

## Aceitação

- Comprador informa CNPJ com pontuação → `compradorDoc` salvo só com dígitos.
- Comprador deixa em branco → Pedido criado normalmente, `compradorDoc=null` → negócio vira aquisição (D3).
