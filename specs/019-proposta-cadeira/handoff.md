# Handoff — 019 Proposta de cadeira guardada, com link próprio da ROI Labs

**Última atualização: 28/09/2026, ~23:55 (Brasília).** No ar em `app.roilabs.com.br` (commit `1a16622` em `main`).

## Feito

- **A contradição sumiu.** `/admin/precos` agora guarda: "Para quem" + "Guardar proposta" no painel do simulador.
  "Nada é salvo aqui" saiu. `/admin/propostas` diz a mesma coisa ("Monte no simulador de Preços e guarde").
- **Tabela `propostas_cadeira`** (`id`, `slug` único, `criada_em`, `doc` jsonb) em produção, aplicada com
  `migrate diff` + `db execute`. O diff era só o `CREATE` e os 2 índices, sem drift; depois, `--exit-code` = 0.
- **`montarPropostaCadeira()`** (`lib/precos-cadeira.ts`) congela o que o cliente lê. A conta é refeita no servidor
  com `simular()`, sem número vindo da tela. Teste novo em `test/precos-cadeira.test.mjs`: 3 modelos, distribuidor,
  ritmo zero, validade e nada interno no documento.
- **Página pública `/p/<slug>`** com a marca da ROI Labs (tokens do site), sem JS próprio: entrada anual, comissão,
  estimativa no ritmo combinado com a ressalva do orgânico, condições, validade de 15 dias e "Falar com a ROI Labs no
  WhatsApp" (mensagem com nicho, para quem e o link). Tem `not-found` próprio, e vencida mostra faixa no topo.
- **Lista mesclada** em `/admin/propostas`: cadeira e Vértice por data. Cada fonte falha sozinha. O cartão da Vértice
  ganhou o selo e perdeu "Editar esta proposta" (o simulador que a editava não existe mais).
- Glossário: "Guardar proposta", "Proposta de cadeira", "Válida até / Vencida em" e o CTA do WhatsApp.

### Provado em produção

| O quê | Resultado |
|---|---|
| Moda 30 × R$ 200, 20% recompra | painel = cartão = página: R$ 840/mês, R$ 12.770 no 1º ano, 17,7% |
| SaaS 2 × R$ 100 | R$ 480 (12º mês), R$ 5.810; regra da implantação 20%; sem a condição do piso por pedido |
| Clínica 10 × R$ 200 | "R$ 200,00 por consulta comparecida", R$ 26.690; **sem** o aviso do CFO/CFM |
| Texto interno na página | nenhum (CFO/CFM, faixa, `nicho.regra`, regra de desconto, `/admin`) |
| Larguras 1440 / 768 / 390 | 0 px de rolagem lateral; console limpo; `noindex, nofollow` |
| "Para quem" vazio | erro inline, `aria-invalid`, nada gravado |
| Teclado | CTA → CTA do fim → link do modelo; anel hi-vis visível sobre o ink |
| LCP móvel (1,6 Mbps, 150 ms, CPU 4x, sem cache) | 1,76–2,25 s em 6 rodadas (o `/login` dá 1,58–1,85 s) |
| `/p/xxxxxxxx` | 404 "Proposta não encontrada" |
| Excluir pela lista | 3 excluídas, os 3 links voltaram 404; **as propostas de teste foram apagadas** |

## Decisões (fora do plan)

- **Tabela própria, não `vertice.proposals`:** o site da Vértice lê essa tabela para servir o `/p/` dele.
- **`REGRAS_CONTRATO` perdeu a regra de desconto**, que virou `REGRAS_NEGOCIACAO` (só no admin). A regra do piso por
  pedido virou `REGRA_COMISSAO_PEDIDO` e sai da proposta de SaaS e de clínica.
- **Hi-vis só como texto sobre ink** (5,8:1). O site usa `hivis-deep` como eyebrow sobre porcelana (cerca de 3,5:1,
  reprovado para texto pequeno): o problema é do site e não foi copiado para cá.
- **"Copiar resumo" continua**, agora secundário ("Copiar resumo para os slides").

## Próximos passos

- Nenhum obrigatório. Candidatos, se o Jean pedir: editar uma proposta mantendo o link (hoje é guardar outra e
  excluir a antiga), aceite online (recusado na clarify de 28/09) e confirmação antes de excluir.
- `vertice.proposals` está **vazia** em produção (0 da Vértice): o selo "Vértice" e a saída do "Editar" não têm onde
  aparecer hoje.

## Gotchas

- 🚨 **LCP medido com o Chrome headless no Windows, com o cache de fontes frio, sai inflado:** a 1ª rodada deu 3,1 s,
  com um `Layout` de 1,5 s no trace. Com o cache quente, 1,8–2,2 s, e a versão só ASCII da página empata com a normal.
  Medir 3+ rodadas antes de mexer em código.
- O login do app redireciona para `0.0.0.0:3000` (bug conhecido). Em script, `context.request.post('/api/auth/login',
  { form, maxRedirects: 0 })`: o cookie vem no 303.
- PageSpeed Insights: a cota anônima estava esgotada em 28/09, e a `CRUX_API_KEY` do roihub não tem a API do PSI
  ativada.
- Build local do app falha por `tailwindcss` fora do `node_modules` (OneDrive); a prova é o build do Docker.
