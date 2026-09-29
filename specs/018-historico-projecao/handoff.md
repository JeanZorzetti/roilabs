# Handoff — 018 Histórico de consultas da Projeção

**Última atualização: 28/09/2026, ~22:50 (Brasília).** No ar em `app.roilabs.com.br/admin/projecao/consultas`
(commits `1c39a7c`, `19368ab`, `dc54216` em `main`).

## Feito

- **Tabela `projecao_consultas`** em produção (`roilabs_db`). Aplicada com `migrate diff` + `db execute`: o diff contra
  o banco era só o `CREATE TABLE` + índice, sem drift. Depois, `migrate diff --exit-code` = 0.
- **`POST /api/projecao/consultar`** recebe `nicho` e `paraQuem` (validados antes de pagar), grava a resposta da
  DataForSEO e devolve `id`. Falha ao gravar → `id: null` + log `etapa: 'gravar'` sem termos; a resposta sai igual.
- **`/admin/projecao`**: campo "Para quem (opcional)"; depois de consultar, a URL vira `?consulta=<id>`
  (`history.replaceState`), então recarregar ou copiar o link reabre sem pagar. `?consulta=<id>` carrega a consulta do
  banco no servidor e entrega à mesma tela (nicho, cidade, termos, nome, resposta). Estados: não encontrada, banco
  fora, nicho que saiu da tabela, não guardada. Link "Consultas guardadas (N)" no cabeçalho.
- **`/admin/projecao/consultas`**: tabela, da mais recente para a mais antiga (até 200), com nome + data e hora +
  local + termos numa célula, nicho, buscas/mês, vendas/mês no ano 1 (conservador a otimista, premissas de hoje) e
  custo. Topo: quantidade, custo somado, desde quando. Vazio e banco fora com texto próprio.
- `resumirConsulta()` em `lib/projecao.ts`, com teste; `npm test` inteiro passa.
- **Importadas as 2 consultas da Karla Daniele (cursos)** de 28/09, das respostas exatas da DataForSEO: Goiânia
  (29 termos, 260 buscas/mês, US$ 0,105) e Brasil (16 termos, 100 buscas/mês, US$ 0,104).

### Provado em produção

| O quê | Resultado |
|---|---|
| Consulta paga nova (1 termo, "Teste 018 (apagar)") | 200, `id` devolvido, URL com `?consulta=`, procedência "guardada", recarregar reabre com o nome, lista passou a 3 linhas. Custou US$ 0,102. **A linha de teste foi apagada depois**, pelo id. |
| Abrir a consulta de Goiânia pela lista | nicho clínicas, Goiânia, 29 termos na caixa, "260 buscas/mês", "consulta guardada, recalculada com as premissas de hoje"; trocar cenário e nicho: **0 POST pago** |
| `?consulta=nao-existe` | "Não deu para abrir a consulta" + "Ver consultas guardadas" |
| Larguras | lista e detalhe sem rolagem lateral em 1440, 768 e 390; a 768 as 5 colunas cabem, abaixo disso a tabela vira cartões |
| Console | limpo (o React #418 da 1ª versão foi corrigido: a data do cliente agora usa fuso fixo) |
| Árvore de acessibilidade | cada linha é um link com nome próprio: "Karla Daniele · cursos, 28/09/2026, 21:54, Goiania" |

## Decisões (fora do plan)

- **Os termos da Karla não estão no repo:** o `roilabs` é **público** no GitHub. O teste usa exemplo sintético, e o
  script de importação rodou do scratchpad da sessão.
- **`requireAuth()` nas duas páginas** além do `admin/layout.tsx`: o layout roda em paralelo com a página, e a
  página lê o histórico.
- **"Nada é salvo." saiu** da linha abaixo de "Usar no simulador": com o histórico, a frase passaria a contradizer a
  tela.
- **Barra de buscas/mês removida da lista** (veio no 1º deploy): comparava nichos e cidades diferentes, e uma linha
  de 22.200 achatou as outras. Data e local foram para a célula da consulta, porque a 768 px a rolagem interna
  escondia a coluna de vendas.
- Glossário: "consulta guardada", "Guardar" (nunca "salvar" na interface), "Para quem", "Nova consulta".

## Próximos passos

- Nenhum obrigatório. Se o histórico passar de 200 consultas: paginar por `criada_em` (marcado `ponytail:` no código).
- Candidatos, se o Jean pedir: renomear o "Para quem" de uma consulta antiga, apagar uma consulta, comparar duas
  lado a lado.

## Gotchas

- 🚨 **Consulta renderizada no servidor + data formatada no cliente = erro de hidratação.** O servidor roda em UTC.
  Toda data na tela da Projeção usa `timeZone: "America/Sao_Paulo"`.
- A lista recalcula com as premissas do código: se uma constante de `lib/projecao.ts` mudar, o número de uma consulta
  antiga muda junto. A resposta da fonte (volume, dificuldade) nunca muda.
- Nome de cidade vem como a DataForSEO devolve ("Goiania", sem acento).
- Custo desta sessão na DataForSEO: US$ 0,21 (as 2 da Karla) + US$ 0,102 (teste) = US$ 0,311.
