# SEM-Swarm × ROI Labs — ingestão de conhecimento real

> Primeiro uso real do [SEM-Swarm](https://github.com/JeanZorzetti/sem-swarm) (2026-07-06): a memória epistêmica passa a guardar fatos verificados do negócio Growth Partner. Consulta via Synthesizer; inspeção via UI: https://sofia-sem-swarm-api.7c17iw.easypanel.host/

## O que entra na memória

| Fonte | Caminho | Modo |
|---|---|---|
| Catálogo (30 porcelanatos) | `site-goiania/porcelanatos.json` | **Trusted** (obs + fato direto, sem juiz LLM) |
| Guias AEO (7 páginas) | `site-goiania/src/pages/guia/*.astro` | Scout (phi4-mini→nuextract) por chunk → juiz |
| Vault estratégico | `Docs/Obsidian/00-tese/`, `10-mercado/` | Scout por chunk → juiz |
| Rank tracking | `Docs/Obsidian/90-medicao/rank-tracking.csv` | **Trusted** (só linhas COM posição) |

**Trusted path** (2026-07-07, `4ac5e17`): fonte determinística é verdade por construção — o juiz phi4-mini rejeitava 20–30% do catálogo como "subjetivo" independente de prompt. `--catalog`/`--rank-csv` agora embedam + dedupam + verificam direto (confiança 1.0, segundos por obs em vez de ~2,5 min). Dedup por **slug** (fallback sim ≥0.995) — produtos irmãos ("Strato Marmo Bege" vs "Grigio") cruzam 0.95 e NÃO podem se corroborar. `--promote-pending` recupera obs confiáveis paradas.

## Como rodar (notebook, na raiz do sem-swarm)

Pré-requisitos: Ollama local com `phi4-mini` + `nuextract`; `.env` do sem-swarm já aponta pra API/VPS de produção (carregado automaticamente pelo script).

```bash
cd "cientifico/sem-swarm"

# 1. Depositar observações (escolha as fontes)
python -m scripts.ingest --catalog "../../ROI Labs/site-goiania/porcelanatos.json"
python -m scripts.ingest --files "../../ROI Labs/Docs/Obsidian/00-tese/tese.md" \
    "../../ROI Labs/site-goiania/src/pages/guia/"*.astro
python -m scripts.ingest --rank-csv "../../ROI Labs/Docs/Obsidian/90-medicao/rank-tracking.csv"

# 2. Promover a fatos (daemon; deixar rodando até esvaziar a fila)
set -a && . ./.env && set +a
python -m agents.filter --loop 45 --limit 5

# 3. Consultar
python -m agents.synthesizer --query "qual porcelanato tem menor preço por m²?"
```

## Comportamentos esperados

- **⚠️ NÃO rodar Scout (ingestão --files) e Filter daemon AO MESMO TEMPO no notebook**: os dois disputam o mesmo phi4-mini e a fila do Ollama serializa — as chamadas estouram timeout. Sequência certa: ingerir primeiro, depois ligar o filter. (Descoberto na primeira carga 2026-07-06; o ingest agora tem timeout 480s + retry por chunk, e o filter tolera falha por observação, mas a serialização continua sendo o caminho rápido.)
- **Observação presa em `processing`** (crash/kill do filter no meio do lote): recuperar com `python -m agents.filter --reprocess-stuck` (com o daemon parado).
- **NuExtract devolve campos vazios em ~1/3 das obs de catálogo** (determinístico — retry não resolve): o filter agora cai automaticamente pro phi4-mini com JSON schema (fixes `b864e81`+`d5acbef`). Invariante: rejeição sem justificativa ou aprovação sem fato = inconclusivo → fallback → se persistir, fica `processing`.
- **Variância de julgamento do phi4-mini** (temp 0.3): rejeitava fato de catálogo verdadeiro como "subjetivo" (4 de ~12 julgados). Causa raiz corrigida no prompt do juiz (`41f43ec`): as regras agora dizem explicitamente que dado de catálogo/preço/spec é fato válido. Stragglers: redepositar (sweep idempotente via `metadata.redeposit_of`) e deixar rejulgar.
- **Synthesizer local**: exportar `OLLAMA_REASONING_MODEL=phi4-mini` antes de rodar — o `.env` pede `qwen3:8b`, que não está puxado no notebook (dá 404 no /api/generate).
- **Typos nos fatos** ("Goiçana" em vez de Goiânia): gap 5 conhecido do NuExtract na formulação do clean_fact; os números saem fiéis (fidelidade 1.0 no benchmark).

## Validação E2E (2026-07-06)

Pergunta: *"Quanto custa o m² do Persia Beige e quais outros 100x100cm existem?"* → Synthesizer respondeu fundamentado nos fatos verificados: Persia Beige R$ 120,99/m² ✓, Pulpis Grigio R$ 120,99 ✓, 60x120 Polido R$ 137,99 ✓, Strutturato R$ 139,99 ✓ — zero número inventado.

- **Re-rodar ingestão duplica observações de propósito**: o Filter detecta similaridade ≥0.95 e **corrobora** o fato existente (aumenta confiança) em vez de duplicar — é o mecanismo de consenso funcionando.
- **Tempos** (notebook i7-1255U): Filter ~2,5 min/obs; Scout ~1,5–2 min/chunk. Carga completa = horas; deixar o daemon rodando.
- **Console Windows mostra mojibake** nos logs; os dados chegam UTF-8 corretos no banco (gotcha conhecido).
- **rank-tracking.csv (2026-07-03) não tinha nenhuma posição** → 0 observações dessa fonte na primeira carga. Quando o site começar a rankear, rodar de novo.
- Dreaming Loop (VPS, tick a cada 3h) consolida redundâncias entre catálogo × guias automaticamente.

## Pendências / próximos passos

- [ ] Resíduo conhecido: ~11 produtos têm 2 fatos ativos (versão reescrita pelo juiz em 07-06, com typos "Goiçana", + versão limpa trusted de 07-07). O Dreaming Loop consolida ≥0.96; conferir na UI depois de alguns ticks.
- [ ] 2 fatos com corroboração espúria de produto-irmão (contadores +1 em fatos #22 e #33, do limiar 0.95 pré-fix) — inofensivo (confiança já era 1.0), sem endpoint pra reverter.

- [ ] Acompanhar a primeira carga completa (fila de observações zerada, fatos na UI).
- [ ] Re-rodar `--rank-csv` quando houver posições reais.
- [ ] (Futuro, se aprovado) consulta no /app admin via `POST /memory/search` + synthesizer.
