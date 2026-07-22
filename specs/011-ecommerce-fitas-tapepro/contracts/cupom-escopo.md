# Contrato — Escopo de cupom por vertical (ALTERADO)

**Arquivos**: [`app/src/lib/cupons.ts`](../../../app/src/lib/cupons.ts) · `app/src/app/api/cupom/validar/route.ts` · admin de cupons

## Problema que resolve

`validarCupom(codigo, subtotal)` é **global** hoje. Publicado o vertical de fitas, qualquer cupom criado para porcelanato passaria a valer para fita **sem ninguém decidir isso** — drenando a margem de um parceiro real (FR-036).

## Mudança na função pura

`avaliarCupom` já é pura e já tem self-check (`test/cupons.test.mjs`). Ganha o escopo como dado, mantendo a pureza:

```ts
export interface CupomAvaliavel {
  // ... campos existentes ...
  escopo: 'porcelanato' | 'fitas' | 'ambos';
}

export type Motivo = 'invalido' | 'expirado' | 'minimo' | 'inativo' | 'escopo';  // + 'escopo'

export function avaliarCupom(
  c: CupomAvaliavel | null,
  subtotalProduto: number,
  vertical: 'porcelanato' | 'fitas',   // NOVO parâmetro
): ResultadoAvaliacao
```

**Ordem de verificação** — escopo entra **depois** de `inativo` e **antes** de validade:

```
!c            → invalido
!c.ativo      → inativo
fora escopo   → escopo        ← NOVO
fora validade → expirado
< minimo      → minimo
```

Motivo mais específico primeiro: um cupom de porcelanato aplicado num carrinho de fitas deve dizer `escopo`, não `expirado`. Diagnóstico errado custa suporte.

## Regra de escopo

| `escopo` | `vertical=porcelanato` | `vertical=fitas` |
|---|---|---|
| `porcelanato` | ✅ | ❌ `escopo` |
| `fitas` | ❌ `escopo` | ✅ |
| `ambos` | ✅ | ✅ |

## Comportamento no checkout

Cupom fora de escopo reusa o caminho de **cupom rejeitado que já existe**: cobra **sem** desconto e avisa o comprador (`aviso=cupom`). Não bloqueia a venda, não aplica em silêncio. Zero fluxo novo.

## Endpoint `/api/cupom/validar` — ALTERADO

Ganha o campo `vertical` no form (ausente ⇒ `porcelanato`, retrocompatível com o carrinho de porcelanato já publicado e em cache).

Resposta de rejeição por escopo:
```json
{ "ok": false, "motivo": "escopo" }
```

O endpoint precisa recalcular o subtotal a partir da tabela do vertical certo — `precos.ts` para porcelanato, `precos-fitas.ts` para fitas.

## Admin de cupons — ALTERADO

Seletor de escopo na criação/edição. **Default do formulário = `porcelanato`**, não `ambos`: o default seguro é o restritivo. Um operador que não pensou no campo não deve liberar desconto para o parceiro sem querer.

## Migração — o ponto de risco

`@default("porcelanato")` no schema cobre **linhas novas**. Não reescreve linha existente.

```js
// scripts/migrate-011-backfill.mjs
await prisma.cupom.updateMany({ data: { escopo: 'porcelanato' } });
```

Rodar **junto do `db push`**, antes do push do código (data-model §7).

> ⚠️ FR-037 é explícito: ausência de escopo **não** significa `ambos`. Se o backfill falhar em silêncio, todo cupom vigente vira cupom de fita. É o mesmo padrão que virou landmine na 010 — coluna nova sem backfill.

## Self-check

`app/test/cupons.test.mjs` — estender:

- cupom `porcelanato` + carrinho de fitas → `{ ok: false, motivo: 'escopo' }`
- cupom `fitas` + carrinho de porcelanato → `{ ok: false, motivo: 'escopo' }`
- cupom `ambos` → aplica nos dois
- cupom inativo **e** fora de escopo → `inativo` (precedência)
- **todos os casos existentes continuam passando** — a prova de que a mudança não alterou o comportamento de porcelanato
