# Handoff — Cupons no admin (006-cupons-admin)

## ⚠️ Ação obrigatória antes/no deploy — leia primeiro

O EasyPanel observa a `main` e faz deploy automático no push. Este código assume que a
tabela `cupons` **já existe** no Postgres — os dois call sites de `validarCupom`
(`api/cupom/validar` e `api/pedidos`) chamam `prisma.cupom.findUnique` incondicionalmente.
**Se o deploy subir antes da migração, qualquer requisição com um código de cupom
(inclusive o `OBRA10` real em produção) vai falhar** até a migração ser aplicada.

**Rodar isto no host (ou numa máquina que alcance `2.24.207.200:5443`) o quanto antes,
idealmente antes do deploy terminar:**
```bash
cd "ROI Labs/app"
npx prisma db push   # cria a tabela cupons
npm run db:seed      # semeia OBRA10 (idempotente; não mexe nas cadeiras/params já seedados)
```

## Feito

- **Modelo `Cupom`** em `prisma/schema.prisma` (`@@map("cupons")`), espelhando o shape do knob antigo. `prisma generate` rodado localmente (client tipado ok).
- **`lib/cupons.ts` refatorado**: `avaliarCupom(c, subtotalProduto)` — pura, sem I/O, mesmas regras de sempre (ativo/janela de validade/mínimo/clamp `[0,subtotal]`). `validarCupom(codigo, subtotalProduto)` agora **async**, busca no DB e delega. `CUPONS` hard-coded removido.
- **2 call sites ajustados**: `api/cupom/validar/route.ts` e `api/pedidos/route.ts` agora fazem `await validarCupom(...)`. Contrato de resposta/CORS do primeiro inalterado.
- **Guard do cupom 100%** (D3, `pedidos/route.ts`): um cupom que zeraria o produto (`desconto >= totalProduto`) é tratado como inválido no checkout — cobra sem desconto + `avisoCupom`, reusando o caminho já existente. Sem linha de preço 0 no Mercado Pago. O `ponytail:` antigo que assumia isso "nunca acontecer" foi resolvido por este guard.
- **CRUD admin**: `api/cupons/route.ts` (`GET` lista, `POST` cria) + `api/cupons/[id]/route.ts` (`PATCH` edita, `DELETE` apaga), `isAuthed` nas escritas. Validação server-side completa em `api/cupons/_validacao.ts` (compartilhada entre create/edit): código único (`409`), tipo, range de valor por tipo, mínimo ≥ 0, `validadeInicio ≤ validadeFim`.
- **Tela `/admin/cupons`**: `page.tsx` (server, `force-dynamic`) + `cupons-form.tsx` (client) — criar, editar todos os campos, ativar/desativar, apagar (com `confirm()`), mensagem de erro específica exibida por linha. Link "Cupons" adicionado em `admin/nav.tsx`. CSS: pequena extensão em `globals.css` (`.cc-field select`, `input[type=date]`, `.cc-field--check`) para os novos tipos de campo no form.
- **Seed idempotente do `OBRA10`** em `prisma/seed.ts` (percentual 10, mínimo 500, ativo) — continuidade FR-010.
- **Teste puro** `test/cupons.test.mjs` (`node --import tsx`) cobrindo `avaliarCupom`: percentual/fixo, inativo, janela de validade (início futuro/fim passado/dentro), mínimo, clamp em 0 e no subtotal. Adicionado ao script `test` do `package.json`. **Rodei localmente — passou** (junto com os 3 testes já existentes).
- `npx tsc --noEmit` limpo em todo o código novo/alterado.

## Decisões / gotchas

- **`avaliarCupom` com assinatura de 2 args** (`c`, `subtotalProduto`), exatamente como o `data-model.md`/`research.md` especificaram — o `codigo` não faz parte de `CupomAvaliavel`; `validarCupom` compõe o `ResultadoCupom` final anexando o código normalizado por fora.
- Validação de `valor` ausente/`NaN` no CRUD: adicionei um check explícito (`Number.isFinite`) que o data-model não detalhava — sem ele, um POST sem `valor` passava silenciosamente pelos checks de range (`NaN < 0` e `NaN > 100` são ambos `false`).
- `PATCH` faz merge campo-a-campo com o registro existente e revalida o resultado inteiro (mesma validação do `POST`), depois grava todos os campos — mais simples que um patch parcial de verdade, e correto porque os campos não alterados são regravados com o próprio valor atual.
- Rota de validação (`DELETE`/`PATCH`) segue Next 16: `params: Promise<{ id }>` + `await params`.

## Pendências (não concluídas nesta sessão)

- **T014 — migração real no host**: não executada. Não há `DATABASE_URL` real disponível nesta sessão (só `.env.example` com placeholder); Const. I exige uma máquina que alcance `2.24.207.200:5443`. Ver ação obrigatória no topo.
- **T015 — verificação em ambiente real** (quickstart.md): não executada por depender de T014 + acesso ao admin em produção/Docker. Pendente: criar `OBRA15` no admin e validar no site/checkout sem deploy; conferir `OBRA10` sem interrupção; apagar cupom usado num pedido e conferir que o snapshot permanece; testar os 4 casos de input inválido; testar o guard 100%. Evidência (output do teste, screenshots) deve ser anexada aqui depois.

## Próximos passos

1. Rodar `db push` + `db:seed` no host (ver topo).
2. Rodar o roteiro de `quickstart.md` em prod/Docker e colar a evidência aqui.
3. Marcar T014–T016 como `[X]` em `tasks.md` quando a verificação real for concluída.
