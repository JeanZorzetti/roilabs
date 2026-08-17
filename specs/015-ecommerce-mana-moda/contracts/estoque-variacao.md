# Contrato — estoque por variação, débito e a corrida da última unidade

**Spec**: [../spec.md](../spec.md) · **FR-003 · FR-008 · FR-016** · **Research D4/D5**: [../research.md](../research.md)

Este é o contrato mais perigoso da feature: ele decide quando o comprador é cobrado por algo que
não existe.

---

## 1. Quem decide o quê

| Camada | Decide | Não decide |
|---|---|---|
| vitrine (browser) | **exibir** como esgotado | se a venda acontece |
| `POST /api/pedidos` | recusar SKU sem linha de estoque ou com 0 | debitar |
| **webhook (pagamento aprovado)** | **debitar** — é o único ponto | exibir |

**O estoque só é debitado quando o pagamento é aprovado** (FR-016, fechado no clarify).
Adicionar ao carrinho não reserva nada. Chegar ao checkout não reserva nada.

⚠️ A recusa no `POST /api/pedidos` é **cortesia**, não garantia: entre o checkout e a aprovação
do pagamento passa tempo, e o estoque pode acabar nesse intervalo. A garantia é o débito
condicional do §3. Quem tratar a checagem do checkout como garantia vai desativar a única que
existe.

---

## 2. `GET /api/estoque?cadeira=mana`

Lido **cross-origin pela vitrine estática**, mesmo padrão de `/api/cupom/validar` e
`/api/frete/cotar`.

```json
{ "ok": true, "estoque": { "camisa-social-slim-m-branco": 4, "camisa-social-slim-g-branco": 0 } }
```

- CORS pela allowlist de `lib/cors.ts` (2 hosts). **Nunca `*`** — posição de estoque não é
  conteúdo público para qualquer origem.
- SKU **sem linha** na tabela simplesmente não aparece. A vitrine trata ausente como **esgotado**
  (falha fechada), nunca como disponível.
- Endpoint fora do ar ⇒ a vitrine renderiza as variações sem marcação e o servidor recusa no
  checkout. O comprador vê um erro claro em vez de comprar o que não existe.
- Nenhum dado de comprador, nenhum preço. Só `sku → quantidade`.

---

## 3. O débito — `UPDATE` condicional, dentro da transação do pagamento

```ts
// app/src/lib/estoque.ts
const r = await tx.estoqueVariacao.updateMany({
  where: { cadeira, sku, quantidade: { gte: n } },   // ⚠️ a guarda de não-negativo É ESTE where
  data:  { quantidade: { decrement: n } },
});
// r.count === 1 → debitou;  r.count === 0 → perdeu a corrida
```

⚠️ **Não simplificar para `update` + `decrement` sem o `gte`.** Sem a condição:
- o estoque vai a negativo em silêncio;
- duas notificações simultâneas do mesmo pagamento (retry é o comportamento **normal** do MP)
  debitam duas vezes;
- e o `WHERE` deixa de ser o ponto onde o Postgres trava a linha e reavalia.

⚠️ **Não substituir por `findUnique` + `if (q >= n)` + `update`.** Isso é read-then-write: uma
corrida entre os dois caminhos, exatamente o defeito que a 012 evitou ao pôr a idempotência em
`@@unique([gateway, eventoId])` no banco em vez de num `if` na rota.

### Ordem obrigatória no webhook

```text
① transação interativa ($transaction(async tx => …)):
     pedido → statusPagamento='pago', mpPaymentId, pagoEm=now()
     para cada item de unidade 'peca': débito condicional
     snapshots de centro de custo (comportamento existente)
     ── qualquer count===0 ⇒ throw ⇒ ROLLBACK DE TUDO

② só se ① falhou por estoque:
     pedido → statusPagamento='reembolsado', statusFulfillment='sem_estoque', mpPaymentId
     (fora da transação — o pedido precisa ficar marcado mesmo se ③ falhar)

③ refund(paymentId, tokenDaContaQueCobrou)

④ e-mail ao comprador ("a última unidade foi vendida; o valor está sendo estornado")
   + alerta interno
```

⚠️ **③ nunca dentro de ①.** Chamada de rede dentro de transação segura a linha pelo tempo do
I/O externo e transforma um timeout do gateway em lock no banco.

⚠️ **Se ③ falhar**, o pedido **já está** marcado por ②, o log registra e o alerta dispara. O
dinheiro fica retido **com registro**, nunca sem. O oposto — estornar e não marcar — produz
pedido "pago" sem dinheiro, que é irrecuperável sem auditoria manual.

⚠️ **A transação usa `$transaction(async tx => …)`, não o array.** O array não permite decidir
com base no resultado de uma operação anterior, e é exatamente isso que `count === 0` exige.

---

## 4. Idempotência

O guarda de reentrada continua sendo o de hoje, e ele protege o débito de graça:

```ts
if (pedido.mpPaymentId === paymentId && pedido.statusPagamento !== 'pendente') return ok;
```

O débito só roda dentro do ramo `status === 'approved' && pedido.statusPagamento === 'pendente'`.
Notificação repetida do mesmo pagamento encontra o pedido já `pago` e sai antes. **Nenhum débito
duplo é possível por retry** — e o teste cobre a reentrada.

---

## 5. Reposição e ajuste

- **Reposição** é escrita de operador (`/admin` ou `seed-015-mana.mjs`), nunca automática.
- Devolução aprovada **não** repõe sozinha: o operador repõe quando a peça volta e é conferida.
  Repor na aprovação criaria estoque que não existe fisicamente.
- Toda escrita de reposição registra no log com `sku`, delta e quem pediu.

---

## 6. `verify-015-estoque.mjs` — a prova, rodável a qualquer hora

Roda contra o Postgres de produção e fecha a conta:

```text
para cada sku:
  estoqueInicial(seed) − Σ quantidade vendida em pedidos PAGOS  ==  quantidade atual
```

Reporta, e sai com código ≠ 0 se qualquer linha divergir:

| Sintoma | O que significa |
|---|---|
| atual **maior** que o esperado | reposição não registrada, ou débito que não aconteceu |
| atual **menor** que o esperado | débito duplo — investigar retry de webhook **antes** de repor |
| SKU do catálogo **sem linha** | invariante 6 do `check-mana.mjs` violada — a cadeira não deveria estar publicada |
| linha **sem SKU** no catálogo | produto removido do catálogo com estoque vivo — decidir explicitamente |

⚠️ **Rodar antes e depois** de qualquer mudança que toque estoque, e guardar os dois outputs.
Comparar a migração contra ela mesma é a armadilha que a 013 já registrou.

---

## 7. Testes que fecham este contrato

| Teste | Prova |
|---|---|
| `estoque-corrida.test.mjs` | `count===0` ⇒ rollback + marca `sem_estoque` + chama refund uma vez |
| idem, reentrada | 2ª notificação do mesmo `paymentId` **não** debita de novo |
| `mana-paridade` (gate de build) | todo SKU do catálogo tem preço e peso iguais nos dois espelhos |
| quickstart (ambiente real) | débito conferido por consulta ao Postgres de produção, não por log |
