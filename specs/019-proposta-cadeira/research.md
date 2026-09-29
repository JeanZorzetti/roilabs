# Research — 019 Proposta de cadeira

## R1. Onde guardar

- **Decision**: tabela nova `propostas_cadeira` (Prisma, schema `public`).
- **Rationale**: `vertice.proposals` é lida pelo site da Vértice para servir `verticemarketing.roilabs.com.br/p/<slug>`
  (`DocLink.tsx`: "Os dois lados leem o mesmo banco"). Uma linha de cadeira ali abriria com a marca da Vértice e um
  `doc` de outro formato. Além disso, as colunas de lá (`lines`, `monthly_cost`, `onetime_cost`, `discount_pct`) são do
  modelo de hora da Vértice, e nenhuma serve à cadeira.
- **Alternatives**: coluna `marca` em `vertice.proposals` (exigiria mudar o site da Vértice, que está em outro repo, e
  todo `ProposalCard` teria de se desviar dos campos que não se aplicam); só `doc` na tabela da Vértice com `lines = []`
  (o site da Vértice renderizaria o doc estranho).

## R2. O que é interno e o que vai para o cliente

Lido em `lib/precificacao.ts` e `lib/precos-cadeira.ts`:

| Fonte | Para o cliente? | Motivo |
|---|---|---|
| `ITENS_FIXOS` (setup, anuidade, domínio, comissão) | Sim | É a tabela que ele paga |
| `REGRAS_DOMINIO` | Sim | Explica a compra e a renovação do domínio |
| `REGRAS_CONTRATO` 1–6 | Sim | Condições do contrato |
| `REGRAS_CONTRATO` 7 ("Desconto na comissão só até a faixa logo abaixo…") | **Não** | Regra de negociação do operador |
| `nicho.regra` | **Não** | Ex.: "Se a margem ficar abaixo de 55%, usar 15% / 10%" |
| `nicho.porque`, `confianca`, `faixa` | **Não** | Justificativa interna da tabela |
| `simular().avisos` | **Não** (misturado) | "Checar as regras do CFO/CFM…" é interno. Os que interessam ao cliente (piso, corte, implantação SaaS) viram regra de comissão escrita para ele |

- **Decision**: `montarPropostaCadeira()` escreve `comissao.resumo` + `comissao.regras` para o cliente. Por modelo:
  - percentual: "X% na 1ª compra · Y% na recompra", com as taxas de `calcularComissao().taxaAplicada` (o distribuidor
    já sai ajustado). Regras: piso de R$ 5 por pedido, 2/3 da taxa na parte do pedido acima do corte, e comissão sobre
    o produto com desconto, sem frete.
  - mensalidade: `aquisicaoTexto · recorrenciaTexto` + "A implantação cobrada pelo parceiro também paga 20%".
  - consulta: "R$ {valor digitado} por consulta comparecida" + `recorrenciaTexto`.
- A faixa ("Premium", "Padrão") **não** vai para o cliente: é o rótulo interno da margem do fornecedor.

## R3. Fluxo do save

- **Decision**: form com `useActionState(guardarPropostaCadeira)`. Campos crus em inputs ocultos, espelhando o estado do
  simulador. A action devolve `{ erro }` ou faz `redirect`.
- **Rationale**: um `throw` numa server action cai no error boundary e perde o estado do simulador (edge case "banco
  fora"). Os inputs são controlados, então o reset de formulário do React 19 não os apaga.

## R4. Link absoluto

- **Decision**: constante `ROI_APP = "https://app.roilabs.com.br"` ao lado de `VERTICE_SITE`, em `DocLink.tsx`.
- **Alternatives**: `window.location.origin` (em dev geraria `localhost`, e o cartão é server-rendered); env var
  (constituição I: sem env nova para valor que não muda).

## R5. Marca da página pública

- **Decision**: tokens do `globals.css` (ink `#14171d`, porcelana `#f2f1ed`, hi-vis `#ff5a1f`, Archivo, Hanken
  Grotesk e Space Mono), que o comentário do arquivo diz serem "os mesmos do site". Navy e dourado são da Vértice e
  ficam só no admin.
- Contraste: hi-vis `#ff5a1f` sobre porcelana dá cerca de 2,9:1, o que não passa como texto pequeno. Usar só em
  superfície (botão com texto ink, ou faixa) ou `#e8460f`/ink para texto. A conta fecha no design-review.

## R6. WhatsApp comercial

- **Decision**: `5562993265713`, o número de `site/src/data/contato.ts` (fallback de `PUBLIC_WHATSAPP`) e do webhook de
  pagamento. Mensagem: "Olá! Li a proposta da cadeira {nicho} para {paraQuem} e quero conversar." Montada com
  `waLink()` de `lib/wa.ts`.
