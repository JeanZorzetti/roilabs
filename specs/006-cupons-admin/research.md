# Phase 0 — Research: Cupons no admin

Sem `NEEDS CLARIFICATION` remanescentes (clarify resolveu limite de uso e delete). As decisões abaixo cobrem as escolhas técnicas do refactor.

## D1 — `validarCupom` async vs. função pura testável

**Decision**: Dividir `lib/cupons.ts` em duas peças:
- `avaliarCupom(cupom, subtotalProduto)` — **pura**, síncrona. Recebe um cupom já normalizado (ou `null`) e o subtotal; aplica as regras atuais (invalido/inativo/expirado/minimo) e devolve o `desconto` clampado a `[0, subtotal]`. Sem Prisma, sem I/O.
- `validarCupom(codigo, subtotalProduto)` — **async**. Normaliza o código (trim+upper), faz `prisma.cupom.findUnique({ where: { codigo } })`, normaliza a linha para o shape que `avaliarCupom` espera e delega.

**Rationale**: mantém a lógica de dinheiro coberta por um teste `tsx` confiável local (Const. II — build/Lighthouse local não confiáveis), espelhando o par `lib/financeiro.ts` + teste. A única mudança de contrato interno é `validarCupom` virar async → `await` nos 2 call sites.

**Alternatives rejected**:
- Manter `validarCupom` síncrona lendo um cache em memória: exigiria invalidação de cache a cada CRUD → complexidade sem ganho no volume atual (YAGNI).
- Injetar o cupom já buscado nos call sites: espalha a busca por 2 lugares e vaza responsabilidade; a autoridade única fica menos clara.

## D2 — Tipo das colunas de validade e valor

**Decision**:
- `validadeInicio` / `validadeFim`: `DateTime? @db.Date` (data-only, sem hora — a clarify fixou granularidade de data). Ausência = "sem limite" naquela ponta.
- `valor` e `minimo`: `Decimal @db.Decimal(10,2)` / `Decimal?`, convertidos para `Number` na leitura (padrão do repo — ver `parametros/route.ts` e `pedidos/route.ts`).
- `tipo`: `String` com valores `'percentual' | 'fixo'` (o repo usa strings validadas em runtime, não enums Prisma — ver `Pedido.entrega`, `escopo`).
- `codigo`: `String @unique`, **armazenado já em MAIÚSCULAS** (normalização no create/update). `findUnique` por `codigo` casa com a normalização feita na validação.

**Rationale**: espelha exatamente o shape do knob atual e as convenções de coluna já usadas no schema; nenhum tipo novo. `@db.Date` evita ambiguidade de fuso na comparação de validade.

**Comparação de validade**: `avaliarCupom` compara em epoch ms. A borda-fim inclui o dia inteiro? O knob atual usa `now > Date.parse(fim)` com data ISO (meia-noite UTC). Mantemos o comportamento atual bit-a-bit (fim = meia-noite do dia; para "válido até o fim do dia X" o operador informa X+1). Documentado em data-model.md; não é regressão porque é o comportamento de hoje.

## D3 — Guard do cupom que zera o produto (100%)

**Decision**: Tornar cupons editáveis torna alcançável `desconto == subtotalProduto` (percentual = 100, ou fixo ≥ subtotal → clampado a subtotal). O mapeamento Mercado Pago em `pedidos/route.ts` distribui `alvoProduto = max(0, totalProduto - desconto)` entre as linhas; `alvoProduto == 0` gera linhas de preço 0, que o MP rejeita (comentário `ponytail:` já existente em `pedidos/route.ts:98-99`).

Tratamento: no checkout, se o cupom válido zeraria o produto (`desconto >= totalProduto`), tratá-lo como cupom **não aplicável** — cobra sem desconto e liga `avisoCupom` (reusa 100% o caminho já existente para cupom expirado/rejeitado). Marcar com `ponytail:` e caminho de upgrade.

**Rationale**: um pedido 100%-off via gateway pago é degenerado (não há o que cobrar); reusar o branch `avisoCupom` é a correção de menor diff e não introduz linha de preço 0 no MP. A exibição no site (CORS) não tem esse problema (só mostra o desconto), então lá o cupom aparece normalmente — a divergência só aparece no checkout, exatamente como um cupom que expira entre carrinho e pagamento (comportamento já aceito, FR-014).

**Alternatives rejected**:
- Proibir `percentual == 100` na criação: não fecha o buraco, porque um `fixo` alto ainda zera carrinhos pequenos.
- Permitir pedido de total 0 no MP: o gateway não aceita; exigiria fluxo de "pedido grátis" fora de escopo.

## D4 — Formato das rotas CRUD

**Decision**: `/api/cupons` (`GET` lista, `POST` cria) + `/api/cupons/[id]` (`PATCH` edita, `DELETE` apaga), todas com `isAuthed` nas escritas, espelhando o padrão de validação server-side de `api/centros-custo/parametros/route.ts`. Rota dinâmica usa `params: Promise<{ id: string }>` + `await params` (Const. — Next 16).

**Rationale**: identidade estável por `id` (cuid) permite editar o próprio `codigo` sem ambiguidade; `DELETE` por `id` é inequívoco. Mais limpo que passar `codigo` em query como faz `parametros` (que não tem id de linha natural).

**Alternatives rejected**: rota única com ação em query — funciona, mas mistura verbos e complica a edição do `codigo`.

## D5 — Seed do OBRA10 (continuidade)

**Decision**: adicionar ao `prisma/seed.ts` (idempotente, `findFirst`+`create`) o cupom `OBRA10` com os parâmetros atuais (`percentual`, `valor 10`, `minimo 500`, `ativo`). Não sobrescreve se já existir.

**Rationale**: FR-010 exige continuidade sem interrupção; o seed é a via idempotente já usada no repo (cadeiras, params globais). Rodado MANUALMENTE junto do `db push` no host.
