# Research / Decisões — Fase 0

Decisões técnicas que ancoram o plano. Cada uma: contexto → alternativas → escolha.

## D1 — Integração de pagamento (Mercado Pago)
**Contexto**: precisa Pix + cartão, 1 conta da ROI, esforço mínimo.
**Alternativas**: (a) Checkout Pro (cria *preference*, redireciona p/ `init_point`, recebe webhook); (b) Checkout Transparente/Bricks (form de cartão embutido no site); (c) Checkout API puro.
**Escolha**: **(a) Checkout Pro**. O cliente é redirecionado para a tela do MP (Pix + cartão prontos, PCI no MP, menos código e zero dado de cartão trafegando pelo site estático). `back_urls` voltam para `/obrigado`. `// ponytail: Bricks só se a saída do site para o MP medir queda de conversão.`

## D2 — Checkout cross-origin sem preflight CORS
**Contexto**: `goiania.roilabs.com.br` (estático) → `app.roilabs.com.br` (Next). `fetch` com JSON dispara preflight OPTIONS e exige CORS.
**Alternativas**: (a) configurar CORS no `/app` + `fetch` JSON; (b) **POST de formulário urlencoded** (requisição "simples", sem preflight) + resposta **303** com `Location: init_point`.
**Escolha**: **(b)** — idêntico ao padrão já validado do `leads-consumidor`. A ilha do carrinho monta um `<form method=POST>` com hidden inputs (incl. `itens` como JSON em um campo) e dá submit; o navegador segue o 303 direto para o MP. Sem JS de CORS, sem OPTIONS.

## D3 — Fonte de verdade do preço (FR-005)
**Contexto**: o servidor NÃO pode confiar em preço/total do cliente; precisa recalcular.
**Alternativas**: (a) `/app` lê `porcelanatos.json` do build do site (acoplamento de deploy); (b) **cópia espelhada** de `porcelanatos.json` em `app/src/lib/precos.ts`; (c) tabela de preços no Postgres.
**Escolha**: **(b)** cópia espelhada — o `/app` não depende do build do site e o recálculo é local. `// ponytail: sincronizar a cópia por script de build se a divergência de preço incomodar; migrar p/ DB só se o catálogo virar dinâmico.`

## D4 — Idempotência do webhook
**Contexto**: o MP reenvia notificações; não pode duplicar pedido nem rebaixar status.
**Escolha**: chave única `mp_payment_id` no `Pedido`. O webhook faz upsert/guard por esse id; reprocessar a mesma notificação é no-op. Transições só avançam (`pendente → pago`; nunca `pago → pendente`).

## D5 — Confirmação de reserva e reembolso
**Contexto**: sem estoque em tempo real; pago = reserva (FR-012/013).
**Escolha**: ação na operação (`/admin/pedidos`): "confirmar" (→ `confirmado`) ou "lote indisponível" (chama refund do MP → `reembolsado`). Reembolso via API do MP sobre o `payment_id`. Sem automação de estoque (out of scope).

## D6 — Frete
**Contexto**: porcelanato pesado, polo Goiânia; sem API de transportadora.
**Escolha**: tabela estática `faixa de CEP/região → valor` em `app/src/lib/frete.ts`; retirada = R$ 0; CEP fora das faixas = "a combinar" (frete null, total só produto — FR-016). `// ponytail: tabela editável; trocar por cálculo por transportadora se sair do polo.`

## D7 — Carrinho no front
**Contexto**: site estático, sem framework.
**Escolha**: `localStorage` + módulo JS vanilla (`src/lib/cart.ts`); itens `{slug, caixas}`. Conversão m²→caixas: `max(1, ceil(m2 * (1+perda) / m2_caixa))`, perda default 0,10. Nenhuma lib de estado. Self-check em `node`+`assert`.

## Pontos sem necessidade de pesquisa (já decididos na spec)
Pix+cartão; ROI recebe 100% (sem split); checkout guest; site permanece estático; reuso do `/app`.
