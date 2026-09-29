# Contrato — rotas da Projeção

As duas rotas ficam atrás de `isAuthed()` (o mesmo cookie que protege `/admin/*`), são `dynamic = 'force-dynamic'`
e leem `DATAFORSEO_API_KEY` só no servidor. Nenhuma grava nada.

## `POST /api/projecao/consultar` (paga, ~US$ 0,10)

### Requisição

```json
{ "termos": ["fita gomada", "fita gomada kraft", "…"], "local": { "codigo": 2076, "nome": "Brasil" } }
```

- `termos`: array de strings. O servidor apara as pontas, tira as vazias e remove duplicatas pela forma
  normalizada (sem diferenciar caixa, acento e espaço repetido), mantendo a 1ª ocorrência.
- Depois da limpeza: **1 a 200 termos**. Cada um com **≤ 80 caracteres e ≤ 10 palavras**, e sem emoji nem
  símbolo fora de letra, número, espaço, hífen e apóstrofo.
- `local`: sem ele vale Brasil (`2076`). Com cidade, é o `codigo` que `/api/projecao/cidades` devolveu.

### Sequência (research D2)

1. Valida a entrada. Se falhar, devolve **400** sem chamar a API.
2. Sem chave, devolve **503** (`chave`) sem chamar a API.
3. `bulk_keyword_difficulty/live` (Brasil, pt). Se falhar, **para aqui**: o volume não é pago.
4. `search_volume/live` (local pedido, pt).
5. Junta pelo texto do termo e devolve.

`fetch` com `AbortSignal.timeout(60_000)` em cada chamada. O live da DataForSEO corta em 120 s.

### Resposta 200

```json
{
  "termos": [{ "termo": "fita gomada", "volume": 12100, "mensal": [9900, 12100, …], "dificuldade": 34 }],
  "janela": { "de": "2025-09", "ate": "2026-08" },
  "local": { "codigo": 2076, "nome": "Brasil" },
  "custoUsd": 0.1068,
  "consultadoEm": "2026-09-28T17:05:11.000Z",
  "removidos": 2
}
```

`removidos` é quantas linhas caíram como duplicadas, para a tela avisar (edge case da spec). `custoUsd` é a
soma dos `cost` das duas tarefas.

### Erros (corpo `{ "erro": <tipo>, "mensagem": <texto para a tela> }`)

| HTTP | `erro` | Quando | Mensagem (rascunho, passa por ux-writing no implement) |
|---|---|---|---|
| 400 | `entrada` | lista vazia, > 200 termos, termo longo ou inválido | diz qual termo e qual regra: "«…» tem 94 caracteres; o limite do Google Ads é 80." |
| 401 | `sessao` | sem sessão válida | "Sua sessão expirou. Entre de novo para consultar." |
| 503 | `chave` | `DATAFORSEO_API_KEY` ausente ou recusada (`40100`) | "A chave da DataForSEO não está configurada no servidor (DATAFORSEO_API_KEY)." |
| 402 | `saldo` | `40200` / `40210` | "Acabou o saldo da DataForSEO. Recarregue a conta e consulte de novo. Nada foi cobrado nesta tentativa." |
| 503 | `fonte` | timeout, rede, `50000`/`50401`, `40202`, tarefa sem resultado (era 502: a EasyPanel troca o 502 do app pela página dela, visto em produção em 29/09) | "A DataForSEO não respondeu (<status_message>). Tente de novo em 1 minuto." |

`log.error({ err, etapa: 'dificuldade' | 'volume', statusCode }, 'projecao/consultar: …')` em todo 503/402.
Nunca vão para o log o valor da chave nem a lista de termos: os termos contam a estratégia do parceiro.

## `GET /api/projecao/cidades?q=<texto>` (grátis)

- `q` com 2 ou mais caracteres. Se for menor, devolve `{ "locais": [] }`.
- Busca `GET /v3/keywords_data/google_ads/locations/br` **uma vez por processo** e guarda por 24 h (research D12).
- Filtra por `location_name` normalizado que contém `q` normalizado. Prioridade para `location_type` "City" e
  "State", nessa ordem. Devolve **até 10** resultados.

```json
{ "locais": [{ "codigo": 1001566, "nome": "Goiania,State of Goias,Brazil", "tipo": "City" }] }
```

Erro da fonte: **503** com `{ "locais": [], "erro": "fonte" }` (não 502, pelo mesmo motivo). O campo de cidade mostra "Lista de cidades
indisponível agora; projete com Brasil ou tente de novo."

## Ponte para o simulador (sem rota nova)

`/admin/precos?nicho=<id>&ritmo=<decimal com ponto>&cenario=<cenario>#simulador`

- A página do servidor (`params`/`searchParams` são `Promise` no Next 16) valida: `nicho` existe em
  `NICHOS`; `ritmo` é um número finito entre 0 e 100.000; `cenario` é um dos três. Qualquer falha anula as
  três e o simulador abre com o padrão de hoje (FR-011).
- Valor válido: o `SimuladorCadeira` recebe `inicial = { nichoId, ritmo, cenario }`. O `ritmo` vai para o
  campo do modelo do nicho (pedidos, assinaturas ou consultas por mês), formatado em pt-BR com até 1
  decimal.
- O `ritmo` da URL já sai arredondado pela regra de exibição da Projeção (contracts/ui.md, Números: 1 decimal
  abaixo de 10, inteiro a partir de 10). Assim as duas telas mostram o mesmo número: uma média de 18,4 aparece
  como "18" na Projeção e chega como `ritmo=18`, não 18,4.
