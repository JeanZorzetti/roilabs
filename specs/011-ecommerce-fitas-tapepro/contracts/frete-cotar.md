# Contrato — `POST /api/frete/cotar` (NOVO)

**Host**: `app.roilabs.com.br` · **Chamado por**: carrinho de fitas em `goiania.roilabs.com.br` (cross-origin)

Espelha o padrão já resolvido de [`/api/cupom/validar`](../../../app/src/app/api/cupom/validar/route.ts) — o único outro endpoint lido cross-origin pelo site estático.

## Por que este endpoint existe

O site é **estático**. Carregar `MELHOR_ENVIO_TOKEN` no browser vazaria a credencial no bundle. A cotação roda no servidor, que também é a autoridade do valor cobrado (FR-016).

## Requisição

`Content-Type: application/x-www-form-urlencoded` — requisição **simples**, sem preflight (mesmo motivo do endpoint de cupom: evita OPTIONS e a complexidade de CORS completo).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `cep` | string | sim | CEP de destino; normalizado para 8 dígitos no servidor |
| `itens` | JSON string | sim | `[{ slug, rolos }]` — **cap de 5000 chars**, como no endpoint de cupom |

O cliente **não envia peso, dimensão nem valor**. O servidor deriva tudo de `precos-fitas.ts` a partir do slug (FR-006: nenhum dado de dinheiro ou de carga vem do cliente).

## Resposta — 200 em todos os casos de negócio

O status HTTP é 200 mesmo em contingência: falha de cotação **não é erro de requisição**, é um estado de negócio previsto (FR-015).

**Cotado com sucesso:**
```json
{ "ok": true, "valor": 87.4, "valorFmt": "R$ 87,40", "prazo": "4 a 7 dias úteis", "servico": "JadLog .Package" }
```

**Contingência** (as duas causas são distinguidas — FR-034):
```json
{ "ok": false, "motivo": "cep_nao_atendido", "aviso": "Não atendemos este CEP por transportadora. O frete será combinado após o pedido." }
```
```json
{ "ok": false, "motivo": "falha_tecnica", "aviso": "Não foi possível calcular o frete agora. O frete será combinado após o pedido." }
```

**Carrinho inválido:**
```json
{ "ok": false, "motivo": "vazio" }
```

| `motivo` | Significado | Alerta? |
|---|---|---|
| `cep_nao_atendido` | Nenhuma transportadora cobre o CEP | ❌ operação normal |
| `falha_tecnica` | Timeout, erro HTTP, credencial inválida, resposta ilegível | ✅ conta para o limiar (FR-035) |
| `vazio` | Carrinho vazio ou nenhum slug válido | ❌ |

## Headers

```
Access-Control-Allow-Origin: https://goiania.roilabs.com.br
```

Origin fixo, como no endpoint de cupom. Sem wildcard.

## Regras de servidor

1. **Timeout de 4s** na chamada ao Melhor Envio (`AbortController`). Estourou ⇒ `falha_tecnica`. A margem para o SC-010 (5s ponta a ponta) é deliberada.
2. **Nunca estimar** valor quando a cotação falha (FR-015). Sem frete cotado, é "a combinar".
3. Slug fora de `precos-fitas.ts` é **descartado da carga** — mas se sobrar zero item, responde `vazio` em vez de cotar carga vazia.
4. **Cotação é display.** O checkout **re-cota** e é a autoridade do valor cobrado (FR-016), exatamente como o cupom é re-validado.
5. Falha técnica é logada com `log.error` incluindo o CEP e o status — sem isso, o alerta avisa que quebrou mas não o quê.

## O que este endpoint NÃO faz

- Não compra etiqueta, não cria envio. Só cota.
- Não persiste a cotação. O checkout re-cota — cotação salva vira valor obsoleto, e obsoleto em caminho de dinheiro é bug.
- Não atende porcelanato. O vertical de porcelanato continua na tabela estática de `frete.ts` (FR-017).

## Self-check

`app/test/frete-fitas.test.mjs` — sobre a função **pura** de mapeamento (resposta do provedor → `{ok, valor, motivo}`), sem I/O:

- resposta válida → `ok: true` com valor e prazo
- lista de serviços vazia → `cep_nao_atendido`
- erro HTTP / JSON ilegível / timeout → `falha_tecnica`
- resposta com valor `0` ou negativo → `falha_tecnica` (não é frete grátis, é resposta suspeita)
