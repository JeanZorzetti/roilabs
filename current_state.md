---
status: in_progress
next_effort: high
iteration: 8
updated_at: 2026-07-06T15:30:00.000Z
---

## Last completed
Tarefa 8 (Semana 2, Macro plan 3): **Striking distance — pulado (sem dado)**,
conforme a válvula prevista na própria tarefa. Lidos
`Docs/Obsidian/90-medicao/rank-tracking.csv` e `rank-tracking.md`: as duas
coletas (2026-07-03 e 2026-07-06) têm 0 posições em 40 keywords — o md de
07-06 classifica as 40 como **"erros de consulta"** (coleta falhou, não é
"fora do top 100"). Zero termos em posição 8–40 → nenhum reforço de página
feito, nenhum build necessário. Snapshot honesto registrado em
`Docs/Obsidian/90-medicao/striking-distance.md`, incluindo 3 sinais
operacionais para o dono: (1) coleta de 07-06 falhou inteira — checar cron
`rank-tracking.mjs` e credencial/saldo do provedor SERP; (2) divergência de
fonte (plano diz serper.dev, md diz DataForSEO); (3) CSV com bloco de 07-03
duplicado 4×.

## Next step
Tarefa 9 do `macro_plan.md` (Semana 2, `[high]`): **Expansão da malha SÓ se
houver dado do GSC.** Verificar se `Docs/Obsidian/90-medicao/gsc-miner.md`
existe com candidatas (depende do secret `GSC_SA_KEY`, previsto ~07-15). Se
existir com candidata de demanda real: criar até 2 páginas de malha novas em
`site-goiania` seguindo o padrão existente das 41 páginas de `/porcelanato/`
(dados curados reais + `tagsDoProduto` + gate `check-matrix`), com `astro
build` verde antes do commit. Se o arquivo não existir (cenário provável antes
de 07-15) ou não houver candidata com demanda real: registrar "pulado (sem
dado GSC ainda)" e seguir — NÃO expandir malha por especulação.
