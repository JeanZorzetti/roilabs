# Contrato — painel do parceiro (a Maná consulta o que vendeu)

**Spec**: [../spec.md](../spec.md) · **US2 · FR-009 · FR-010 · SC-003** · **Research D6**: [../research.md](../research.md)

Decisão do Jean (17/08): login próprio, não link-token. Este contrato existe para que a segunda
autenticação do `/app` não vire uma superfície maior do que precisa.

---

## 1. Sessão — cookie próprio, escopo da sessão

```text
cookie   roilabs_parceiro          (o do admin é roilabs_admin — separados de propósito)
payload  "<exp>.<parceiroId>.<hmac(exp.parceiroId, AUTH_SECRET)>"
TTL      7 dias
```

| Regra | Por quê |
|---|---|
| `verifySessionParceiro` devolve `parceiroId` ou `null` | quem lê a sessão já recebe o escopo; não há caminho onde o escopo venha de outro lugar |
| sessão de parceiro **não** satisfaz `isAuthed()` | `/admin` continua exigindo o cookie do admin |
| sessão de admin **não** abre `/parceiro` | não há "admin vendo como parceiro"; se precisar, o admin já tem o demonstrativo dele |
| **`parceiroId` nunca vem de query nem de body** | fronteira de confiança. `?parceiroId=` seria IDOR: qualquer parceiro lendo o faturamento de outro |

⚠️ Os dois sentidos têm teste (`sessao-parceiro.test.mjs`). Um teste só cobre metade do buraco.

---

## 2. Senha

- `Parceiro.senhaHash`, formato `scrypt$<salt-b64>$<hash-b64>`, `node:crypto` — **sem dependência nova**.
- Comparação em tempo constante (`timingSafeEqual`), como `checkPassword` já faz.
- `senhaHash = NULL` ⇒ o parceiro **não** faz login. É o estado de todos, menos a Maná.
- Definida pelo `seed-015-mana.mjs` ou pelo `/admin`. **Sem** cadastro self-service, **sem**
  recuperação por e-mail, **sem** troca de senha na v1 — teto declarado no plan.

⚠️ Nunca em texto, nem "só para o primeiro acesso". Senha em coluna de texto é senha num backup,
num dump de debug e no `select *` de qualquer admin — a mesma razão pela qual
`CredencialGateway` guarda o **nome** da env var e nunca o valor.

⚠️ Rate limit no `POST /api/parceiro/login`: o repo não tem um hoje. Mínimo aceitável na v1 —
resposta genérica (nunca "senha errada" vs "parceiro inexistente") + log em `warn` de falha, para
que a tentativa em massa apareça. Está registrado como lacuna consciente, não como resolvido.

---

## 3. `GET /api/parceiro/resumo?de=YYYY-MM-DD&ate=YYYY-MM-DD`

Escopo: `parceiroId` da sessão. Período opcional (default: mês corrente).

```json
{
  "ok": true,
  "periodo": { "de": "2026-08-01", "ate": "2026-08-31" },
  "comissaoPct": 0.10,
  "vendido": 4820.00,
  "frete": 312.40,
  "base": 4820.00,
  "comissaoRetida": 482.00,
  "liquido": 4338.00,
  "pedidos": [ { "id": "…", "data": "…", "itens": 2, "produto": 289.80, "frete": 24.90, "comissao": 28.98, "liquido": 260.82 } ]
}
```

### Como cada número é apurado

```text
pedidos elegíveis = Pedido.vertical = <cadeira do parceiro>
                    AND statusPagamento = 'pago'
                    AND pagoEm BETWEEN de AND ate

vendido        = Σ (total − frete)              ← produto, já com desconto aplicado
comissaoRetida = Σ arredondar(produtoDoPedido × comissaoPct, 2)   ← por pedido, DEPOIS soma
liquido        = vendido − comissaoRetida
```

⚠️ **Arredondar por pedido antes de somar**, nunca somar e arredondar no fim. É a mesma regra que
`calcularFaturaMensal` já aplica ("o total confere com o breakdown"): sem ela, a linha do detalhe
não fecha com o total e a Maná perde a confiança no número — que é exatamente o que a US2 existe
para construir.

⚠️ **Pedido `reembolsado` fica de fora** — inclusive o `sem_estoque` da corrida perdida. Ele
nunca foi venda.

⚠️ **Frete sai da base.** É custo de transportadora. Aparece no detalhe para a Maná conferir o
total cobrado, mas não entra em `base` nem em `comissaoRetida`.

---

## 4. O que a tela `/parceiro` mostra — e o que ela não pode esconder

**Mostra:** vendido, comissão retida (10%), líquido, e a lista de pedidos do período com o
detalhe que reconstrói cada linha.

**Diz explicitamente, porque com split é a verdade e omitir seria enganoso:**

> O valor líquido já foi creditado na sua conta Mercado Pago no momento de cada pagamento. Este
> painel é a conferência, não uma promessa de repasse futuro.

Isso fecha FR-010 (*"repassar o valor líquido em cadência regular"*) de forma honesta: com split
não há ciclo de repasse — o líquido nunca chega a ficar com a ROI Labs. Uma tela que falasse em
"a receber" descreveria um processo que não existe.

Texto de interface passa por `ux-writing` no `implement`; a tela por `accessibility`.

---

## 5. Como isto é verificado

| Verificação | Como |
|---|---|
| escopo | teste: sessão de A + `?parceiroId=B` ⇒ devolve os dados de **A** |
| separação | teste: cookie de parceiro em `/admin` ⇒ 401; cookie de admin em `/parceiro` ⇒ 401 |
| aritmética | teste: arredondamento por pedido; reembolsado fora; frete fora da base |
| **número real** | quickstart: o total do painel conferido contra `SELECT` no Postgres de produção — não contra a própria tela |

⚠️ SC-003 (*"a Maná consegue conferir a qualquer momento"*) só está satisfeito quando a Maná
**entra e confere sozinha**. Tela no ar respondendo 200 não é isso — é a mesma distinção entre
"API em 200" e "a tela mudou" que já custou caro aqui.
