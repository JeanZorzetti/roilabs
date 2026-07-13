---
tipo: ops-doc
status: vivo
data: 2026-07-13
dono: Jean (dev/ops) — ~10 min
---

# Bing Webmaster — o gargalo do IndexNow do goiânia (403)

> **13/07 — deixou de ser "opcional".** O IndexNow do `goiania.roilabs.com.br` devolve **403
> `UserForbiddedToAccessSite`** a cada deploy: as **94 URLs da malha nunca são recrawleadas**.
> A causa está isolada (abaixo) e o desbloqueio é **exatamente o passo 2 desta doc**, que nunca
> foi executado. É a única coisa que falta.

Por que vale: **Copilot e o Bing Chat citam o índice do Bing**, e parte das buscas do ChatGPT
também bebe dele. Numa malha pSEO de 94 páginas, IndexNow é o canal de recrawl — e hoje ele
está mudo.

## O diagnóstico (13/07) — não é bug de código nem de chave

Mesmo script, mesma chave (`e72cab81…`), mesmo servidor. A única variável é o host:

| host | Bing (`api.indexnow.org`) | Yandex |
|---|---|---|
| `roilabs.com.br` (apex) | **200 OK** | — |
| `goiania.roilabs.com.br` | **403 `UserForbiddedToAccessSite`** | **202 OK** |

Descartado, com evidência:

- **Key file** — `/e72cab81….txt` → 200, `text/plain`, 32 bytes exatos, sem BOM e sem newline.
- **Acesso do bot** — bingbot UA pega 200; `http://` redireciona pra `https://` e entrega 200.
- **robots.txt** — `Allow: /`, não bloqueia nada.
- **Código/chave** — o **Yandex aceita a mesma chave, no mesmo arquivo, pro mesmo host** (202).
  Se a chave fosse inválida ou o arquivo inacessível, ele também recusaria.

Sobra uma explicação: **o Bing trata o subdomínio como um site à parte e ainda não o conhece**.
O apex é um domínio antigo que ele já rastreou; `goiania.` nasceu agora e o Bing nunca o viu —
daí "*User is unauthorized to access the site*". Chave válida não basta: o host precisa existir
pro Bing.

## O desbloqueio (Jean, ~10 min — precisa de login Microsoft)

1. Acessar [bing.com/webmasters](https://www.bing.com/webmasters) e logar com conta Microsoft.
2. **"Importar do Google Search Console"** → autorizar com a conta Google que tem as
   propriedades. Importa **verificação + sitemaps** de uma vez, sem meta tag e sem DNS:
   - `goiania.roilabs.com.br` ← **este é o que importa**
   - `roilabs.com.br` (institucional; já passa no IndexNow, mas vale ter)
3. Conferir em **Sitemaps** que `https://goiania.roilabs.com.br/sitemap.xml` veio junto; se não,
   submeter na mão.
4. **Fechar o loop** (10 s, não precisa de build nem deploy):

   ```bash
   cd site-goiania && pnpm indexnow:check
   ```

   - `indexnow: 1 URLs enviadas (goiania.roilabs.com.br), HTTP 200` → **resolvido**. O próximo
     deploy manda as 94 URLs de verdade.
   - `indexnow: RECUSADO … 403` → o Bing ainda não propagou a verificação. Esperar algumas
     horas e rodar de novo (não é preciso mexer no código).

## Watch-points

- **O 403 era silencioso.** O script logava `"94 URLs enviadas … HTTP 403"` — uma linha com cara
  de sucesso, e por isso o canal ficou mudo sem ninguém ver. Corrigido em 13/07: agora ele lê o
  corpo da resposta e grita `RECUSADO` com o motivo. Segue **não-fatal** de propósito — um
  soluço do IndexNow nunca pode derrubar o build/deploy do Docker.
- A importação do GSC replica as propriedades que a conta Google enxerga — usar a MESMA conta que
  administra o GSC do goiânia.
- Bing rastreia bem menos que o Google em site novo; o valor aqui não é tráfego Bing, é
  **presença no índice que os motores de resposta citam** ([[geo_aeo_playbook]]).
- Métrica de acompanhamento: Bing Webmaster → Search Performance, 1×/mês no ritual do digest —
  não vale ritual próprio.

Ver também: [[backlog-pendencias]].
