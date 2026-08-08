# Handoff — 014 Cobrança recorrente de assinatura

**Status**: código completo (T001, T003–T026, T028). **T002 (db push) e T027 (verificação em
sandbox MP) ficaram BLOQUEADAS** — exigem acesso que esta sessão não tem (ver abaixo). T029
(este arquivo) fecha agora; falta o commit/push, que segue este handoff.

## O que foi implementado

- **Schema** (`app/prisma/schema.prisma`): `model Assinatura` + `model CicloCobranca`
  (`@@map`, índices, relação 1:N), comentário de `ItemPedido.assinaturaEstado` atualizado.
- **Gateway** (`app/src/lib/mercadopago.ts`): `createPreapproval`, `cancelPreapproval`.
- **Motor novo** (`app/src/lib/assinaturas.ts`): `dataProximoCiclo`, `novoCancelToken`,
  `decidirRenovacao` (máquina de estado pura), `janelaEsgotada`, `decidirCancelamento`,
  `cancelarAssinatura` (cancela no MP antes de gravar — ordem testada).
- **Checkout** (`api/pedidos/route.ts`): e-mail obrigatório para `unidade='assinatura'`;
  branch `createPreapproval` em vez de `createPreference`.
- **Webhook** (`api/pagamentos/webhook/route.ts`): aceita `type` `payment` OU
  `subscription_authorized_payment`; cria `Assinatura`+1º `CicloCobranca` dentro da mesma
  transação que marca o pedido pago; ramo de renovação (sucesso e falha) com dedupe por
  `mpPaymentId`; e-mail de aviso de falha (FR-004) com link de cancelamento.
- **Cron** (`api/cron/assinaturas/route.ts` + `.github/workflows/cobranca-assinaturas.yml`):
  sweep diário (10h UTC), `JANELA_DIAS = 7`, cancela via `cancelarAssinatura`.
- **Cancelamento** (`api/assinaturas/cancelar/route.ts`): `{ token }` self-service (404 se não
  achou, 200 idempotente se já cancelada) e `{ id }` atrás de `isAuthed()` para o time — mesma
  função `cancelarAssinatura` nos dois casos.
- **Telas**: `/assinatura/cancelar` (pública, lê o token, mostra produto/valor/próxima
  cobrança, 1 botão) e `/admin/assinaturas` (lista com estado/última tentativa/próxima
  cobrança + ação de cancelar), com link no nav do admin.
- **Testes** (3 novos, todos verdes): `assinatura-dedupe.test.mjs`,
  `assinatura-maquina-estado.test.mjs`, `assinatura-cancel-token.test.mjs`. Suíte completa
  (22 arquivos) verde via `npm test`. `npx tsc --noEmit` sem erros.

## Decisões tomadas durante a implementação (não estavam explícitas nas tasks)

- `Assinatura.itemPedidoId`/`pedidoId`/`lojaId` **sem `@relation`** — plain strings
  denormalizados, só `CicloCobranca → Assinatura` é relação Prisma de verdade. T001 só pedia
  relação 1:N para `CicloCobranca`; qualquer relação a mais em `ItemPedido`/`Pedido` exigiria
  um campo reverso nesses models, que a spec explicitamente não queria.
- `Assinatura`/`CicloCobranca` extras da transação do 1º ciclo usam `id` **gerado em JS**
  (`crypto.randomUUID()`) em vez do `@default(cuid())`, porque o `CicloCobranca` do 1º ciclo
  precisa do `assinaturaId` no mesmo array de `$transaction` — evita reescrever a transação
  existente para o formato callback (`async (tx) => …`), que teria um diff bem maior sobre
  código que já roda em produção.
- E-mail de confirmação do 1º ciclo ganhou um branch dedicado (assunto/corpo de assinatura,
  sem o texto de "fornecedor acionado"/prazo de entrega, que não faz sentido pra SaaS) — a
  contract só dizia "ganha o link de cancelamento", mas reaproveitar o texto de porcelanato/
  fitas sem adaptar teria sido pior que criar o branch.
- Página `/assinatura/cancelar` usa fetch+JSON num client component (`cancelar-button.tsx`),
  igual ao padrão já existente (`admin/lead-card.tsx`), em vez do form-POST-sem-JS que o
  quickstart.md sugeria — o padrão do repo pra ações de mutação já é esse, e duplicar em
  form-POST só pra essa tela quebraria a consistência sem ganho real.

## Bloqueios — precisam de você

1. **T002 — `prisma db push`**: não há `DATABASE_URL` de produção neste ambiente (o `app/`
   local não tem `.env`, só `.env.example`). Rodar manualmente contra o Postgres do EasyPanel
   e confirmar `\d assinaturas` / `\d ciclos_cobranca`.
2. **T027 — verificação em sandbox MP**: precisa de `MERCADOPAGO_ACCESS_TOKEN` de sandbox,
   `CRON_SECRET`, e navegação real (autorizar com cartão de teste, forçar falha, rodar o cron,
   usar o link de cancelamento). Passos exatos em `quickstart.md`. **O risco não resolvido do
   research.md continua não resolvido**: qual `type` o MP realmente manda pra uma cobrança de
   renovação (`payment` vs `subscription_authorized_payment`) só se confirma vendo o log do
   webhook nesse teste. O código aceita os dois, mas isso não é a mesma coisa que confirmar.
   Antes desse teste, é preciso redeclarar a cadeira `teste-saas` temporariamente em
   `app/src/lib/lojas.ts` e `site-goiania/src/data/lojas.ts` (ela já foi removida dos dois —
   T028 estava satisfeita antes mesmo desta sessão) e remover de novo depois (quickstart.md
   passo 7).

## Próximo passo sugerido

Rodar `prisma db push` em produção, redeclarar `teste-saas`, e seguir o `quickstart.md` do
passo 1 ao 7. Só depois disso a Fase 2 (webhook) pode ser considerada fechada pela
Constituição II.
