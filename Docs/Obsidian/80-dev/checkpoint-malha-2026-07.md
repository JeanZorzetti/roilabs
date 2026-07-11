---
tipo: checkpoint
status: executado
data: 2026-07-11
dono: Jean (dev) + Claude
---

# 🏁 Checkpoint da malha — 2026-07-11 (antecipado de ~07-15)

> [!success] Veredito em 1 linha
> **Meta de indexação BATIDA: 41/41 páginas da malha "Submitted and indexed"** (meta era ≥ 35/41).
> Nada a cortar. Demanda ainda não maturou pra expandir a malha — o ciclo 15 vai onde o Google
> já está servindo o site: **guias + interlink guia→malha**.

## Como foi medido

- **Indexação**: URL Inspection API, 1 chamada por URL das 41 (hub `/porcelanato/` + 40 da malha),
  via service account do roihub (`nimblabs@review-dispute-agent-498311...`). ⚠️ Esse SA enxerga a
  propriedade de **domínio** `sc-domain:goiania.roilabs.com.br` — a URL-prefix devolve 403.
- **Search Analytics**: janela 2026-06-28 (entrada no GSC) → 2026-07-09 (D-2), query×page e por página.
- **Miner oficial**: `gsc-miner.mjs` rodado manualmente com `GSC_SITE=sc-domain:...` → [[gsc-miner]].

## Números (28/06 → 09/07, 12 dias de GSC)

| Métrica | Valor |
|---|---:|
| Indexação da malha | **41/41** (meta ≥ 35) |
| Impressões (site todo) | 61 |
| Cliques | 1 (query navegacional "roilabs") |
| Posição média | 29,6 |
| Páginas com ≥ 1 impressão | 21 |
| Candidatas do miner (página nova / striking) | 0 / 0 (pisos 20/10 impr.) |

## O que os dados dizem

1. **A malha indexou inteira mas ainda não serve.** As cabeças da malha têm 1–4 impressões cada.
   Normal em D+13 — indexar veio primeiro, rankear vem com autoridade/tempo.
2. **Quem o Google serve primeiro são os GUIAS**: `/guia/como-limpar-porcelanato/` lidera (14 impr.)
   com um cluster de **10+ variantes reais de query** ("como tirar mancha de porcelanato
   fosco/polido/acetinado", "limpeza piso porcelanato"...). `/calculadora/` em 2º (8 impr.).
3. **Mais perto de striking distance** (nenhum na faixa 8–30 com piso, mas encostando):
   "rejunte de porcelanato" pos 28 · "porcelanato polido ou acetinado" pos 31 ·
   "piso vinílico ou cerâmica qual mais barato" pos 35 — todos GUIAS.
4. **Trailing-slash: fix confirmado vivo** — URL sem barra → 301 único hop pra `https` com barra
   (testado em 3 URLs). O share de redirect no crawl (33,6% no export de 03/07) deve cair nos
   próximos exports semanais — acompanhar na aba `/infra` do hub.
5. As 12 páginas "com redirecionamento" do print de 03/07 migraram pra indexadas, como previsto
   em [[backlog-pendencias]].

## ✅ Decisão: ciclo 15 (escolhido pelos dados)

- **NÃO expandir a malha agora** — nenhuma query órfã ≥ 20 impressões; página nova sem demanda
  provada = página vazia (critério editorial de [[mercado]] continua valendo).
- **NÃO cortar nada** — 41/41 indexadas, não existe "não indexou".
- **SIM: reforçar o cluster de guias que já recebe impressão:**
  1. Expandir `/guia/como-limpar-porcelanato/` com seções por acabamento (mancha em fosco /
     polido / acetinado) — as 10 variantes de query são o mapa do conteúdo.
  2. Reforçar `/guia/rejunte-porcelanato/` e `/guia/porcelanato-polido-ou-acetinado/`
     (pos 28–31, striking distance de fato).
  3. **Interlink guia→malha/produto** com âncora contextual: os guias têm as impressões,
     as páginas de dinheiro precisam do link.
- **Reavaliar em ~28/07 (D+30)** com o miner rodando semanal no cron.

## Pendências que o checkpoint deixou

- [x] **Secret `GSC_SA_KEY`** — ✅ setado 11/07 (mesmo JSON do roihub, via `gh secret set`);
  validado no run manual do workflow: gsc-miner leu 25 pares query×page da `sc-domain:`.
- [x] `PSI_API_KEY` — ✅ criada 11/07 via API Keys API (key restrita ao PSI no projeto
  `review-dispute-agent-498311`, a mesma SA tinha permissão) e setada no repo; cwv-psi rodou 5/5.
  **1º baseline em [[cwv]] — ⚠️ ACHADO: CLS ~1,0 no hub `/porcelanato/` (score 48) e no template
  da malha (score 44). Meta é ≤ 0,1 — candidato forte a próxima ação dev.**
- [x] **Redirects:** fix trailing-slash re-confirmado vivo 11/07 (301 único hop → https com barra;
  http → 308). Queda no share de 301 (33,6%) ainda NÃO mensurável: o export de 10/07 só cobre até
  05/07 e a janela é dominada pelo pré-fix — **medir de verdade no export de sexta 17/07** (/infra).
- [ ] **Não conferidos neste checkpoint (sem acesso daqui):** Clarity, `busca_interna` com 0
  resultado (painel himetrica) e coluna Origem dos leads no admin — olhar junto do D+30.
- [ ] ⚠️ **`CRON_SECRET` não existe nos secrets do repo** (achado 11/07 no run manual): o step do
  digest semanal termina sempre em "digest skipped" — o e-mail nunca envia. O valor está na env do
  app em prod (EasyPanel) → copiar pra `gh secret set CRON_SECRET --repo JeanZorzetti/roilabs`.
