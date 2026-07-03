---
tipo: runbook
status: vivo
data: 2026-07-03
dono: Jean (dev)
---

# ⛏️ GSC miner — setup (service account, ~10 min, 1 vez)

> [!info] O que é
> `site-goiania/src/scripts/gsc-miner.mjs` minera a Search Console API (grátis) toda segunda
> no cron do [[rank-tracking]] (`rank-tracking.yml`) e grava duas listas em
> `90-medicao/gsc-miner.md`: **candidatas a página nova** da malha (query com impressão real
> sem página dedicada) e **striking distance** (página dedicada em posição 8–30).
> Substitui a mineração DataForSEO (sem saldo). Sem o secret, o step é no-op — nada quebra.
> Fazer quando o GSC maturar (**~2026-07-15**, checkpoint da malha).

## Passo a passo

1. **Google Cloud Console** → criar projeto (ou usar um existente) → APIs & Services →
   **Enable** na "Google Search Console API".
2. **IAM & Admin → Service Accounts** → Create. Nome livre (ex.: `gsc-miner`). Sem role de
   projeto (o acesso vem do GSC, não do IAM). Criar **key JSON** e baixar.
3. **Search Console** (propriedade `https://goiania.roilabs.com.br/`) → Configurações →
   Usuários e permissões → **Adicionar usuário** = o `client_email` do JSON
   (`gsc-miner@....iam.gserviceaccount.com`), permissão **Total** ou **Restrita** (leitura basta).
4. **GitHub** repo `JeanZorzetti/roilabs` → Settings → Secrets and variables → Actions →
   novo secret **`GSC_SA_KEY`** = o conteúdo INTEIRO do JSON baixado (colar como está).
5. Testar: Actions → workflow `rank-tracking` → **Run workflow**. O log deve mostrar
   `gsc-miner: N pares query×page` e o commit deve incluir `90-medicao/gsc-miner.md`.

## Notas

- Propriedade default é a URL-prefix do goiânia; p/ minerar outra, env `GSC_SITE` no step.
- Janela: 28 dias terminando em D-2 (o GSC atrasa ~2 dias de dado).
- Pisos no script: 20 impressões (página nova) / 10 (striking distance) — constantes no topo.
- Critério editorial continua o de sempre ([[mercado]]): intenção clara + produto real no
  catálogo. O miner aponta demanda; não é licença pra página vazia.
- Local: `GSC_SA_KEY='<json>' node site-goiania/src/scripts/gsc-miner.mjs`.
