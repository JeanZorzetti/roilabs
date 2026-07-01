# Quickstart — Validação em ambiente real: Cupons no admin

Const. II (NÃO-NEGOCIÁVEL): build/Lighthouse local não confiáveis (OneDrive corrompe `node_modules`). A lógica pura é validada por teste `tsx` local; tela/rotas/checkout são validados no **navegador em produção** ou **Docker EasyPanel**, com evidência anexada.

## Pré-requisitos
- Máquina que alcança o host Postgres (para `db push` MANUAL — o runner standalone não aplica schema).
- `DATABASE_URL` correta (paridade com produção — Const. I).

## 1. Migração + seed (MANUAL no host)
```bash
cd "ROI Labs/app"
npx prisma db push        # cria a tabela cupons
npm run db:seed           # seed idempotente: OBRA10 (+ cadeiras/params já existentes)
```
**Esperado**: tabela `cupons` existe; linha `OBRA10` presente (percentual 10, minimo 500, ativo).

## 2. Teste da lógica pura (local, confiável)
```bash
cd "ROI Labs/app"
node --import tsx test/cupons.test.mjs
```
**Cobre** `avaliarCupom`: válido (percentual e fixo), `inativo`, `expirado` (fora da janela), `minimo` não atingido, e o **clamp** `desconto ∈ [0, subtotal]` (incl. o caso `desconto == subtotal`). Todos com `assert`.

## 3. Continuidade do OBRA10 (SC-003) — prod/Docker
- Exibição (site): no carrinho de `goiania.roilabs.com.br`, aplicar `OBRA10` com subtotal ≥ 500 → mostra 10% de desconto (mesmo resultado de antes).
- Checkout: fechar um pedido com `OBRA10` → `Pedido.cupomCodigo="OBRA10"` e `desconto` = 10% do produto.

## 4. CRUD sem deploy (SC-001, US1) — navegador admin
1. Logar no admin → **Cupons** (`/admin/cupons`).
2. Criar `OBRA15` (percentual 15, mínimo 800). Sem deploy.
3. Validar `OBRA15` no carrinho/checkout → aceito com 15%.
4. Editar para 20% → próxima validação usa 20%.
5. Desativar → validação retorna `inativo` (recusado).

## 5. Validação de entrada (SC-004, US3) — admin
Tentar salvar e confirmar recusa com mensagem específica:
- código duplicado (ex.: `OBRA10`) → erro de duplicado.
- percentual `120` ou `-5` → recusado.
- `minimo = -1` → recusado.
- `validadeInicio` depois de `validadeFim` → recusado.

## 6. Apagar não afeta histórico (SC-005) — prod
- Anotar um pedido pago que usou um cupom X.
- Apagar o cupom X em `/admin/cupons`.
- Reabrir o pedido (admin/pedidos) → `cupomCodigo` e `desconto` intactos.

## 7. Guard 100%-cupom (D3) — checkout
- Criar cupom `percentual 100` (ou fixo ≥ subtotal de um carrinho pequeno).
- Fechar pedido com esse cupom → **cobra sem desconto** com aviso (`&aviso=cupom`), sem erro do Mercado Pago (nenhuma linha de preço 0).

## Evidência a anexar ao handoff
- Output do teste `tsx` (passo 2).
- Screenshot/console do admin criando+validando um cupom (passos 4–5).
- Confirmação do checkout com cupom gravando snapshot (passo 3) e do guard (passo 7) em prod/Docker.
