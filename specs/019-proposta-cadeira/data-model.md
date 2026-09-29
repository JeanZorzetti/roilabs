# Data Model — 019 Proposta de cadeira

## `PropostaCadeira` → tabela `propostas_cadeira`

| Campo | Coluna | Tipo | Regra |
|---|---|---|---|
| `id` | `id` | `String @id @default(cuid())` | usado pelo excluir |
| `slug` | `slug` | `String @unique` | 8 caracteres base64url (48 bits), é o que autoriza a leitura pública |
| `criadaEm` | `criada_em` | `DateTime @default(now())` | ordem da lista; `@@index` |
| `doc` | `doc` | `Json` (jsonb) | `PropostaCadeiraDoc`, congelado no save e nunca atualizado |

Excluir = `delete` pelo `id`. Não há update: sem edição na v1.

## `PropostaCadeiraDoc` (versão 1)

Montado por `montarPropostaCadeira(entrada, paraQuem, agora)`. Só texto e número que o cliente pode ler.

```ts
{
  versao: 1,
  paraQuem: string,                 // 2..120, aparado
  criadaEm: string,                 // ISO
  validaAte: string,                // ISO, criadaEm + 15 dias
  nicho: { id: string; nome: string; modelo: 'percentual' | 'mensalidade' | 'consulta' },
  comissao: { resumo: string; regras: string[]; quando: string },
  ritmo: { rotulo: string; valor: string }[],     // o que foi informado, já formatado
  entrada: { item: string; valor: number; nota: string }[],  // setup 0, anuidade, domínio
  entradaTotal: number,             // ENTRADA_ANO do dia
  estimativa: null | {              // null quando comissaoAno = 0 (ritmo zero ou vazio)
    comissaoMes: number,
    mesReferencia: string | null,   // "no 12º mês" no SaaS
    comissaoAno: number,
    totalAno: number,
    vendasAno: number | null,       // null quando 0 (clínica)
    pctDaVenda: number | null,
  },
  condicoes: string[],              // REGRAS_CONTRATO (só as do cliente) + REGRAS_DOMINIO
}
```

## Mudança em constante existente

- `REGRAS_CONTRATO` perde "Desconto na comissão só até a faixa logo abaixo…", que vai para
  `REGRAS_NEGOCIACAO` (novo). `/admin/precos` mostra as duas listas, então a tela do admin fica igual.

## Estados

- **Válida**: `agora ≤ validaAte`.
- **Vencida**: `agora > validaAte`. Continua abrindo, com faixa de aviso.
- **Excluída**: a linha não existe, e o link cai no `not-found`.
