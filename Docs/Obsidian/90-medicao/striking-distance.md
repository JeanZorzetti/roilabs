---
tipo: medição
status: vivo
data: 2026-07-06
dono: loop autônomo (macro plan 3, tarefa 8)
---

# 🎯 Striking distance — goiania.roilabs.com.br

> [!info] Análise de 2026-07-06 sobre `rank-tracking.csv` + `rank-tracking.md`
> (mesma pasta). Objetivo da tarefa: achar termos na posição 8–40 e reforçar a
> página correspondente (title/meta/H2, FAQs, interlinks com âncora exata).

## Snapshot honesto (2026-07-06)

**Nenhum termo em striking distance. Reforço pulado — não há dado que o
justifique.**

- Coletas disponíveis: 2026-07-03 e 2026-07-06 (40 keywords cada).
- Posições registradas: **0 em 80 linhas úteis** — coluna `posicao` vazia em
  todas.
- O `rank-tracking.md` de 07-06 classifica as **40 keywords como "erros de
  consulta"**, não como "fora do top 50". Ou seja: o snapshot atual não prova
  "site fora do top 100" — prova que **a coleta falhou**.

| Faixa | Termos |
|-------|--------|
| Top 10 | 0 |
| 8–40 (striking distance) | 0 |
| 41–100 | 0 |
| Sem posição (erro de consulta) | 40 |

## Sinais operacionais para o dono (não são ação autônoma)

1. **Coleta de 07-06 falhou inteira** (40/40 "erros de consulta"). Vale checar
   o cron do `rank-tracking.mjs` e a credencial/saldo do provedor de SERP antes
   da próxima janela semanal — sem coleta válida, a tarefa 8 continua sem
   matéria-prima.
2. **Divergência de fonte:** o `macro_plan.md` descreve o tracker como
   serper.dev, mas o `rank-tracking.md` declara "Fonte: DataForSEO SERP".
   Provável migração de provedor; se a troca foi recente, os erros de 07-06
   podem ser exatamente isso.
3. **CSV com duplicatas:** o bloco de 2026-07-03 aparece 4× (160 linhas para 40
   keywords). Não atrapalha esta análise (tudo vazio), mas vai sujar qualquer
   série histórica futura.

## Próxima janela

Quando houver coleta com posições reais, refazer esta análise: filtrar
`posicao` entre 8 e 40, mapear keyword → URL rankeada e aplicar o reforço
descrito na tarefa 8 (title/meta/H2 + 1–2 FAQs respondendo variações + 
interlinks internos com âncora exata), registrando as ações aqui.
