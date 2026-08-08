# Research — Cobrança recorrente de assinatura

## D1 — Como cobrar o 2º ciclo sem o comprador reentrar o cartão

**Decision**: usar a API de Assinaturas do Mercado Pago (`Preapproval`, `POST /preapproval`)
para o checkout de qualquer cadeira com `unidade === 'assinatura'`, substituindo a chamada a
`createPreference` (Checkout Pro) que esse branch faz hoje. O MP autoriza a recorrência uma
única vez (página hospedada, mesma UX de redirecionamento do Checkout Pro — `init_point`) e
executa as cobranças seguintes por conta própria, sem o comprador voltar a lugar nenhum.

**Rationale**:
- FR-001 é literal: "sem exigir novo checkout... sem informar o pagamento de novo". A única
  forma de zerar reentrada de cartão sem o app entrar em escopo PCI (tokenizar cartão no
  cliente, guardar `card_id`) é uma API que já autoriza a recorrência no 1º contato.
- O gateway já está integrado (`mercadopago.ts`, mesmo token/conta) — é a opção mais baixa da
  escada do ponytail que resolve o problema de verdade: "dependência já instalada resolve".
  Construir tokenização de cartão do zero seria a abstração mais cara possível para um
  problema que o próprio gateway já vende como produto.
- O campo `assinaturaRef` no `ItemPedido` (013) — "id da assinatura no gateway", **nulo de
  propósito** — é evidência de que esse desenho já estava previsto: é o placeholder que este
  `preapproval.id` preenche.
- Bônus que reduz escopo: a página hospedada do MP também é onde o comprador troca de cartão
  vencido — a Assumption da spec que tira "troca de forma de pagamento" do escopo desta feature
  só se sustenta porque o MP já resolve isso fora do nosso código.

**Alternatives considered**:
- **Tokenizar o cartão no 1º checkout (MP.js/Bricks) e cobrar via `POST /v1/payments` com
  `card_id` a cada ciclo, disparado pelo NOSSO cron.** Dá controle total sobre o timing de
  retry, mas exige: (a) trocar o carrinho estático de HTML-form-POST por um form com JS do MP
  no `site-goiania`, entrando em escopo de captura de cartão que hoje não existe; (b) construir
  do zero a lógica de retry que o MP já oferece pronta. Rejeitada por ser objetivamente mais
  código para o mesmo resultado — o oposto do que a Constituição III pede.
- **Cobrar o 2º ciclo por link de cobrança avulso (Asaas, já integrado para faturas de
  parceiro) enviado por e-mail/WhatsApp a cada ciclo.** Rejeitada de cara: exige o comprador
  clicar e pagar de novo — viola FR-001 na frase exata que ele proíbe.
- **Confiar 100% no dunning nativo do MP (retries e cancelamento automáticos do preapproval),
  sem tabela própria.** Rejeitada porque FR-003/FR-008/FR-009 exigem que **o sistema** (não o
  MP) decida e exponha o estado — "inadimplente" como estado nosso, consultável pelo time, e o
  cancelamento automático "sem exigir decisão de ninguém do time" precisa ser algo que **nosso**
  cron executa e loga, não um comportamento de terceiro que só observamos de fora.

## D2 — Quem decide o fim da janela de retry (FR-003/FR-009)

**Decision**: um cron diário próprio (mesmo padrão HTTP+`CRON_SECRET` de `api/cron/digest`,
disparado por GitHub Actions agendado) é a autoridade que fecha a janela e cancela — não o MP.
O webhook só REGISTRA cada tentativa (sucesso/falha) que o MP notifica; nunca cancela sozinho.

**Rationale**: o MP tem seu próprio ciclo de novas tentativas para uma cobrança recorrente que
falhou, mas o formato e a duração exatos não são um contrato estável o suficiente para basear
FR-009 nele — e mesmo que fossem, a spec quer que **nosso sistema** seja a autoridade de quando
uma assinatura vira "cancelada" (para que SC-003/SC-004 sejam medíveis no nosso banco, não
inferidos do MP). Um sweep diário sobre `estado='inadimplente' AND janelaFalhaDesde < hoje - N
dias` é a menor peça que dá esse controle, reaproveitando literalmente o mecanismo de cron que
já existe em produção.

**Alternatives considered**: reagir ao webhook de status do preapproval (`subscription_
preapproval`, quando o MP mesmo cancela) como único gatilho — mais simples, mas nos deixa reféns
do timing do MP para SC-003 e sem um número de tentativas que o time possa apontar (FR-009 fala
em "esgotar as tentativas", que é uma contagem nossa). O plano mantém esse evento como um
espelho defensivo (idempotente), não como a fonte de verdade.

## D3 — Superfície de autoatendimento sem login (FR-010/FR-011)

**Decision**: um token opaco (`crypto.randomBytes(24).toString('hex')`, mesmo padrão de geração
já usado — `crypto` é `import` direto, sem lib nova) gerado 1x por assinatura, enviado nos
e-mails relevantes (confirmação do 1º ciclo e aviso de falha). O link `/assinatura/cancelar?
token=...` resolve a assinatura pelo token; **não existe outra forma de identificar quem está
pedindo** — o que satisfaz FR-011 por construção (um token só existe amarrado a uma assinatura,
nunca a "um comprador" em geral) em vez de precisar de uma verificação de identidade separada.

**Rationale**: a Assumption da spec já decidiu a forma ("nasce do menor tamanho possível para
cancelar, não para qualquer outra ação de conta") — login completo seria a abstração que a
Constituição III proíbe para uma superfície que faz uma coisa só.

**Alternatives considered**: exigir e-mail + últimos 4 dígitos do documento como "login pobre" —
mais superfície (formulário, validação, mensagens de erro de "não bateu") para o mesmo resultado
que um link único já entrega sem nenhum campo.

## Risco não resolvido: o nome do evento webhook

A documentação pública do Mercado Pago para `Preapproval`/Assinaturas confirma os campos
`external_reference`, `init_point`/`sandbox_init_point` e `back_url` na criação — mas não foi
possível confirmar, contra a doc viva, o `type`/`topic` exato que a notificação de cada cobrança
recorrente carrega (o nome mais citado é `subscription_authorized_payment`; o próprio recurso
retornado, no entanto, continua sendo um `Payment`, buscável por `GET /v1/payments/{id}` — a
mesma função `getPayment` já existente). **Decisão de design**: o webhook aceita `type ===
'payment' OU type === 'subscription_authorized_payment'` e trata os dois pelo mesmo caminho
(busca o payment por id, resolve `external_reference` → `Pedido` → `Assinatura`), tornando o
código correto independente de qual string o MP realmente envia. A confirmação exata vira uma
task de implementação (disparar uma cobrança de teste em sandbox e ler o corpo real da
notificação) antes de declarar a Fase 2 concluída — Constituição II proíbe presumir.
