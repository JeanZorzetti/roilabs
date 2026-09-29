# Data Model: Contrato da cadeira

## ContratoCadeira (`contratos_cadeira`, novo)

| Campo | Coluna | Tipo | Regra |
|---|---|---|---|
| id | `id` | text (cuid) | PK |
| slug | `slug` | text | `UNIQUE`, 48 bits aleatórios em base64url (8 caracteres), igual à proposta |
| propostaId | `proposta_id` | text | `UNIQUE`, FK → `propostas_cadeira(id)` `ON DELETE RESTRICT` |
| input | `input` | jsonb | `ContratoCadeiraInput`, o que o operador digitou, e reabre o formulário |
| doc | `doc` | jsonb | `ContratoCadeiraDoc`, congelado, a única coisa que `/c/<slug>` lê |
| criadoEm | `criado_em` | timestamptz | default now() |
| editadoEm | `editado_em` | timestamptz | default now(); muda a cada edição e é a trava otimista do aceite |
| aceitoEm | `aceito_em` | timestamptz null | não nulo = imutável |
| aceitoPor | `aceito_por` | text null | nome completo digitado |
| aceitoCpf | `aceito_cpf` | text null | só dígitos, 11 |
| aceitoIp | `aceito_ip` | text null | |
| aceitoUa | `aceito_ua` | text null | até 500 caracteres |
| aceitoHash | `aceito_hash` | text null | SHA-256 hex do `doc` canônico no momento do aceite |

Índice: `criado_em` (lista por data).

`PropostaCadeira` ganha a relação inversa `contrato ContratoCadeira?`, sem coluna nova.

## ContratoCadeiraInput (jsonb)

```ts
{
  titulo: string;              // vazio = "Contrato de parceria — cadeira de <nicho>"
  contratante: ContractParty;  // name, document, address, representative, email
  contratada: ContractParty;
  inicio: string;              // YYYY-MM-DD; vazio = conta do aceite
  foro: string;                // comarca/UF; ignorado para PF (vale o domicílio dela)
  pagamento: string;           // formas de pagamento da entrada, uma por linha
  extra: string;               // condições específicas, uma por linha
}
```

## ContratoCadeiraDoc (jsonb, congelado)

```ts
{
  versao: 1;
  titulo: string;
  criadoEm: string;                         // ISO
  contratante: ContractParty;
  contratada: ContractParty;
  pessoaFisica: boolean;                    // contratante com 11 dígitos
  proposta: { slug: string; paraQuem: string; nicho: string; modelo: 'percentual' | 'mensalidade' | 'consulta'; criadaEm: string };
  entrada: { item: string; valor: string; nota: string }[];   // cópia da proposta
  entradaTotal: number;
  comissao: { resumo: string; regras: string[]; quando: string };
  anexo: { cadeira: string; fases: {nome;prazo;itens}[]; precisamos: string[]; naoInclui: string[]; extras: string[] } | null;
  clausulas: ContractClause[];              // { id, heading, body: (string | string[])[] }
  pendencias: string[];                     // não vazia = aceite travado
}
```

**Nunca entra no doc**: `estimativa`, `ritmo`, `validaAte` (a proposta é da oferta, o contrato é da obrigação),
`nicho.regra`, `REGRAS_NEGOCIACAO`, `avisos`.

## Pendências (trava o aceite)

- Nome, CNPJ/CPF e endereço de cada parte; representante de parte PJ.
- Foro, se a contratante for PJ.
- "Entregáveis da cadeira", se a proposta não tiver `entregaveis`.
- Qualquer `[marcador]` em campo livre.

## Estados

```text
(sem contrato) --emitir--> pendente --completar--> aguardando aceite --aceitar--> aceito (final, imutável)
                              ^  |                      |
                              |  +--editar--------------+ (volta a pendente se abrir buraco)
excluir: só pendente ou aguardando. Proposta com contrato: não exclui (RESTRICT).
```
