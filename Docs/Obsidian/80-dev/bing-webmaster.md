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

## A causa raiz: ⚠️ **verificação importada do GSC não vale para o IndexNow**

O site **já estava verificado** no Bing Webmaster — importado do Google Search Console — e mesmo
assim o IndexNow devolvia 403. A posse via GSC vale na **UI** do Webmaster, mas o IndexNow **não a
honra**. Ele exige uma prova **nativa** do Bing (`BingSiteAuth.xml`, meta `msvalidate.01` ou CNAME).

Pior: enquanto o site está marcado como importado, o BWT **se recusa a te dar** o código nativo —
em ⋯ → *Código de verificação* ele só mostra *"importado do Google… não há necessidade de código"*.
É preciso **excluir o site e adicioná-lo de novo à mão**, sem importar, escolhendo XML/meta tag.

Confirmado por um caso idêntico (mesma assinatura: Yandex aceita, só o Bing recusa) no
[Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5825616/): *"if you set up bing
webmasters using google search it doesn't work, I recreated the account with xml verification and
everything works now"*.

> **Hipótese que eu queimei antes de achar isso** (fica registrada pra ninguém repetir): "o Bing não
> conhece o subdomínio ainda". **Errada.** O site estava verificado e continuava 403.

## O desbloqueio (feito em 13/07)

1. BWT → seletor de site (canto superior esquerdo) → **⋯ → Excluir site**.
2. ⚙️ → **Contas do console de pesquisa do Google → desconectar** (senão o BWT re-importa sozinho e
   o site volta a ficar "importado", sem código nativo).
3. **+ Adicionar um site** → `https://goiania.roilabs.com.br/` → **NÃO importar do GSC** → escolher
   **XML File** / meta tag → copiar o token.
4. Servir a prova nativa no site (já commitado — token `9E40520D…`):
   - `site-goiania/public/BingSiteAuth.xml`
   - `<meta name="msvalidate.01">` no `<head>` de `src/layouts/Base.astro`
   Os dois de propósito: assim qualquer um dos botões *Verificar* do BWT funciona.
5. Deploy sobe sozinho → clicar em **Verificar** no BWT.
6. **Fechar o loop** (10 s, não precisa de build nem deploy):

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
