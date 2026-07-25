# roilabs.com.br — aposentar os 14 subdomínios NXDOMAIN

**25/07/2026.** Fecha o P0 do `roihub/handoff-crawl-plano-acao.md`. Jean confirmou hoje: **o Atma
não existe mais**, então os 14 hosts são todos aposentadoria — nenhum precisa voltar ao ar.

## Por que não basta deixar como está

`NXDOMAIN` não converge. O Googlebot não tem como saber que o host morreu de propósito, então
tenta para sempre: 4.908 dos 6.408 requests da propriedade (76,6%) vão para hosts que não resolvem.
O export acusa 53,5% de erro de DNS só porque parte da janela de 90 dias ainda tem os dias em que
esses hosts respondiam — **o número piora sozinho até ~76%** conforme a janela rola.

`301` e `410` convergem: a URL sai do índice e o Googlebot para de pedir. É a diferença entre um
problema que cicatriza e um que não.

## A boa notícia: o DNS está no Cloudflare

`roilabs.com.br` usa `stephane.ns.cloudflare.com` / `javier.ns.cloudflare.com`. Isso resolve tudo
**sem tocar no EasyPanel e sem vhost catch-all** — as Redirect Rules disparam na borda, antes de
qualquer request chegar em `2.24.207.200`. Zero risco para goiania, tapepro e app, que continuam
intactos porque as regras são presas a hostname explícito.

## Passo 1 — DNS (14 registros)

Um `A` para cada host abaixo → `2.24.207.200`, **proxied (nuvem laranja)**. O IP é irrelevante
(a regra dispara antes do origin), mas apontar para a máquina real evita 522 se alguma regra falhar.

> **Não use wildcard.** `*.roilabs.com.br` casa só um label: pegaria `sirius` mas **não**
> `www.sirius`, `www.goiania` nem `clerk.atma` — 3 dos 14, incluindo os 698 requests do
> `www.sirius`. A economia é ilusória; 14 linhas explícitas são mais curtas que a depuração.

## Passo 2 — 4 Redirect Rules

Hostnames copiados de `roihub/docs/Crawl-stats/roilabs.com.br/…-2026-07-25/Hosts table.csv`.
Todos com status **301** e "preserve query string" ligado.

**1. Sirius → siriuscrm.com.br** (2.000 req/89d — o maior, e o único que carrega sinal de verdade)

```
http.host in {"sirius.roilabs.com.br" "www.sirius.roilabs.com.br"}
→ concat("https://siriuscrm.com.br", http.request.uri.path)
```

**2. Sofia → polarisia.com.br** (845 req/89d)

```
http.host eq "sofiaia.roilabs.com.br"
→ concat("https://polarisia.com.br", http.request.uri.path)
```

**3. www.goiania → goiania** (4 req/89d — o destino está no ar, é só a variante www)

```
http.host eq "www.goiania.roilabs.com.br"
→ concat("https://goiania.roilabs.com.br", http.request.uri.path)
```

**4. Os 10 mortos → apex** (2.059 req/89d, sem sucessor)

```
http.host in {"atma.roilabs.com.br" "atmaadmin.roilabs.com.br" "atmaapi.roilabs.com.br"
              "clerk.atma.roilabs.com.br" "alibi.roilabs.com.br" "pathfinder.roilabs.com.br"
              "jbadvocacia.roilabs.com.br" "orion.roilabs.com.br" "vertice.roilabs.com.br"
              "andorinha.roilabs.com.br"}
→ https://roilabs.com.br/   (estático, não concat: as URLs antigas não existem no apex)
```

Nas regras 1–3 o `concat` preserva o path porque as URLs migraram 1:1 (mesmo app, domínio novo).
Na regra 4 **não** preserve o path: mandar `/dashboard` do Atma para `roilabs.com.br/dashboard`
troca um 404 por outro.

### Sobre a regra 4 ser 301 e não 410

`410 Gone` é tecnicamente mais correto para conteúdo que não volta — sai do índice mais rápido e
sem ambiguidade. Mas Redirect Rule não emite 410; precisaria de um Worker, e um Worker em rota
`*.roilabs.com.br/*` passa a interceptar goiania e tapepro. **Não vale colocar código na frente de
um e-commerce em produção para uma faxina de índice.** O 301 para o apex converge do mesmo jeito:
o Google trata redirect em massa para página irrelevante como soft 404 e derruba as URLs.

Se um dia quiser o 410, o caminho é um Worker com rota **por host** (10 rotas), nunca wildcard.

## Passo 3 — conferir

```bash
curl -sI https://sirius.roilabs.com.br/pricing | head -3   # 301 → siriuscrm.com.br/pricing
curl -sI https://atma.roilabs.com.br/qualquer  | head -3   # 301 → roilabs.com.br/
curl -sI https://goiania.roilabs.com.br/       | head -3   # 200, intacto
```

## O que esperar, e quando

**Não olhe o Crawl Stats na semana que vem.** A janela é de 90 dias
([[gsc_crawl_stats_stale_90d_window]]), então o percentual de erro de DNS continua subindo por
semanas mesmo com tudo certo — os dias ruins ainda estão dentro da média. O sinal de que funcionou
é o **request count dos hosts mortos caindo** na tabela de hosts, não o OK% subindo.

Prazo real: 33,6% → ~90% de OK ao longo de ~90 dias. É o único item do plano de crawl que muda a
ordem do ranking do hub.

## Fora do Cloudflare, já feito

`app.roilabs.com.br` (49 req) é painel e não deveria estar no índice: `src/app/robots.ts` com
`Disallow: /` foi para o `main` junto com este doc.
