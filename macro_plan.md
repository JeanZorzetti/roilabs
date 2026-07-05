# Macro plan 2 — Mês 2 do loop autônomo (Growth Partner + SplitJud)

> **Como rodar (humano):**
> `node "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\claude-loop-runner\src\runner.mjs" "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\ROI Labs" --max-iterations 24`

## Escopo (LEIA ANTES DE AGIR)

Horizonte de ~1 mês, 19 tarefas, uma por iteração. Semanas 1–3 = ROI Labs
Growth Partner (este repo). Semana 4 = **SplitJud, um repo DIFERENTE** — leia o
bloco "Mecânica cross-repo" antes de qualquer tarefa 15–19.

Você está na branch **`main` deste repo, sem worktree**: cada commit é pushado
imediatamente pelo runner e **deploya automaticamente em produção**
(site + site-goiania + app rebuildam por push). Não existe colchão de review.
Portanto:

- **Nunca commite build quebrado.** Rode `astro build` do site afetado antes de
  cada commit. `npm install`/`tsc` locais são não-confiáveis nesta máquina
  (OneDrive, errno -4094), mas `astro build` e scripts Node puros funcionam.
- **NÃO** toque em código de pagamento (`lib/mercadopago.ts`, `lib/asaas.ts`,
  `api/parceiros/webhook`, `api/pedidos`), nada em `/app/prisma`, nada que rode
  `db push`/migração, e não conecte no Postgres de produção.
- **Não toque em `/app`** (Next/admin) — todo trabalho deste plano fica em
  `/site-goiania` e `/site` (Astro, estático), por decisão do dono. Ler
  arquivos de `/app` para replicar fórmula/dados é permitido; modificar, não.
- **NÃO** mexa em EasyPanel/DNS/GitHub Actions, e não crie nada que dependa de
  secret que você não tem (Asaas, Resend, GSC_SA_KEY, PSI_API_KEY,
  SERPER_API_KEY). Esbarrou nisso → `status: blocked` com explicação.
- **Verifique ANTES de construir.** Vários itens de ciclos anteriores caíram na
  verificação por já existirem (ver `handoff.md`, ciclo 8). Já existem, NÃO
  refaça: guias polido×acetinado, porcelanato×cerâmica, como-escolher,
  quanto-custa; favoritos + `/favoritos`; galeria Inspire-se; estimador de
  rejunte/argamassa na calculadora; simulador ROI no `/site`; comparador
  `/comparar` com deep-link `?p=`; calculadora pré-preenchida via
  `?m2caixa=&produto=&nome=`; busca interna; WhatsApp flutuante. Se um item
  abaixo já existir, registre em `current_state.md` como "pulado (já existia)"
  e siga para o próximo.
- Página nova em Astro = registrar em sitemap, `llms.txt` e busca interna
  (índice de build), seguindo o padrão das páginas existentes. URL **sempre com
  barra final** em todo link emitido (gotcha nginx: sem barra vira 301
  `http://`).
- Conteúdo novo = rico e específico (BLUF, FAQ real, tabelas, interlink), nunca
  página genérica/mínima. Schema: nunca duplicar entidade que o `@graph` da
  página já emite.

### Mecânica cross-repo (tarefas 15–19, SplitJud)

O repo SplitJud fica em `C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud`
(monorepo: `apps/site` = Astro público, `apps/app` = Next autenticado).

- Antes da primeira tarefa SplitJud: confirme `main` checked out e working tree
  limpo lá (`git -C "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud" status`).
  Sujo ou em outra branch → `status: blocked`, não "arrume" sozinho.
- Trabalhe SÓ em `apps/site` e `docs/`. **NÃO** toque em `apps/app`, `prisma/`,
  `.env*`, nem nos `[PLACEHOLDER_*]` de `apps/site/src/lib/schema.ts` — os
  placeholders de `sameAs`/`Person` são o item T002 que depende do Aldo; não
  invente URLs para preenchê-los.
- `npm run build` dentro de `apps/site` deve passar antes de commitar.
- O runner só pusha ESTE repo. No SplitJud, **você mesmo** commita e pusha:
  `git -C "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud" push origin main`.
- `current_state.md` continua AQUI (raiz deste repo): atualize e commite aqui
  mesmo nas tarefas SplitJud (o runner pusha este repo; "Everything up-to-date"
  é ok quando só o SplitJud mudou... mas o current_state.md sempre muda, então
  sempre haverá commit aqui).
- Contexto do SplitJud: leia `docs/GEO-HANDOFF.md` e `docs/PLANO-MACRO-GEO.md`
  antes da tarefa 15. Fica FORA do escopo autônomo: deploy/EasyPanel, GA4
  (canal e hard-code), WAF, F4 off-site, placeholders T002.

## Tarefas

### Semana 1 — Growth Partner: conteúdo AEO (site-goiania)

1. `[plan]` **Glossário de porcelanato em `/glossario/`.** 15–25 termos que o
   comprador encontra e não entende (PEI, retificado, absorção de água,
   esmaltado vs técnico, acetinado, natural, polido, junta/rejunte, argamassa
   AC-II/AC-III, destonalização, calibre...), cada um com definição BLUF de
   2–4 frases + `DefinedTerm`/`DefinedTermSet` schema, linkando para os guias,
   a malha e produtos onde o termo aparece. Âncoras por termo (`#pei`) para
   deep-link a partir dos guias e páginas de produto.

2. `[build]` **Guia AEO `/guia/porcelanato-area-externa/`.** Antiderrapante
   (coeficiente de atrito), PEI, absorção, formatos para área externa/garagem/
   piscina; tabela comparativa; FAQPage; linka os produtos do catálogo que
   atendem (filtrar por atributos reais em `src/data/produtos`, não inventar
   specs). Registrar em `src/data/guias.ts` como os guias existentes.

3. `[build]` **Guia AEO `/guia/rejunte-porcelanato/`.** Como escolher cor de
   rejunte (contraste vs tom-sobre-tom), tipos (cimentício, acrílico, epóxi) e
   como calcular a quantidade — linkando o estimador da `/calculadora` (ciclo
   15) como CTA. FAQPage + registro em `guias.ts`.

4. `[build]` **Guia AEO `/guia/porcelanato-liquido-vs-porcelanato/`.** Busca de
   alto volume no Brasil que confunde os dois produtos (resina epóxi vs placa
   cerâmica). Comparativo honesto de custo/m², durabilidade e aplicação, com
   CTA para catálogo/calculadora. FAQPage + registro em `guias.ts`.

5. `[plan]` **Galeria Inspire-se por ambiente.** Investigar as fotos de
   `imagensAmbiente` do catálogo: se der para classificar por ambiente
   (heurística por nome de arquivo/produto ou curadoria manual no data file),
   criar sub-páginas `/inspire-se/cozinha/`, `/sala/`, `/banheiro/` (só as que
   tiverem ≥4 fotos) linkadas da galeria principal. Se a classificação não
   parar em pé, registrar o porquê em `current_state.md` e pular — não forçar.

### Semana 2 — Growth Partner: conversão & UX (site-goiania)

6. `[plan]` **Filtros e ordenação no hub `/porcelanato/`.** Client-side, sem
   API: filtrar por marca e formato, ordenar por preço/m² (asc/desc). Estado na
   query string (`?marca=&ordem=`) para link compartilhável; sem JS o hub
   continua renderizando tudo (progressive enhancement). Cuidado com o gotcha
   de scoped styles do Astro em DOM criado por JS (`<style is:global>`).

7. `[build]` **Favoritos ↔ comparador.** Na página `/favoritos` (ciclo 15),
   botão "Comparar favoritos" que monta o deep-link `?p=` do `/comparar` com
   até 3 favoritos; no comparador, botão de favoritar em cada coluna.
   Verificar antes o que o ciclo 15 já deixou pronto.

8. `[build]` **Calculadora multi-ambiente.** Permitir somar cômodos (ex.: sala
   35m² + cozinha 12m²) antes do cálculo de caixas/rejunte/argamassa,
   client-side, mantendo compatibilidade com o pré-preenchimento
   `?m2caixa=&produto=&nome=` e com o fluxo de lead existente. Conferir a
   matemática com 2–3 casos manuais.

9. `[build]` **"Vistos recentemente" via localStorage.** Trilha dos últimos 6
   produtos visitados, exibida na home, no hub e na página de produto (exceto o
   produto atual). Sem login, sem API; mesmo padrão client-side dos favoritos.

10. `[build]` **Follow-up do a11y-audit (ciclo 15).** Ler
    `Docs/Obsidian/90-medicao/a11y-audit.md`: aplicar o que ficou documentado e
    é seguro sem decisão de design; re-inspecionar as páginas novas das semanas
    1–2 (guias, glossário, filtros) e corrigir alt/label/contraste óbvios;
    atualizar o arquivo de auditoria.

### Semana 3 — Growth Partner: institucional B2B (/site)

11. `[plan]` **2 artigos AEO no blog do `/site`,** mirando o fornecedor
    candidato: (a) "Pago pelo sucesso vs agência de marketing: a conta real
    para quem vende material de construção"; (b) "Exclusividade de nicho: por
    que só existe uma cadeira de porcelanato em Goiânia". BLUF, FAQPage,
    números honestos (usar a fórmula do success fee que o simulador do ciclo 15
    já replica), CTA para `/simulador` e para o form de candidatura.

12. `[build]` **Página `/modelo/` no `/site`.** Verificar primeiro o que a home
    já explica: se o modelo (gates, success fee, exclusividade, papel do
    parceiro) só existe resumido, criar página própria aprofundada com FAQPage
    + HowTo (etapas da candidatura ao contrato), linkada do menu/footer e dos
    artigos da tarefa 11. Se a home já cobre em profundidade, pular.

13. `[build]` **Case vivo do Polo 1 no `/site`.** Página "Polo Goiânia —
    porcelanato" mostrando o que a cadeira ocupada recebe, com FATOS
    verificáveis no repo (nº de páginas da malha/guias no build, catálogo de 30
    produtos, calculadora, comparador, feed Merchant Center) — **sem inventar
    métricas de venda/tráfego**. CTA duplo: candidatura + simulador. Linkar dos
    artigos e do footer.

14. `[build]` **Refresh de descoberta nos 2 sites.** Conferir que TUDO das
    semanas 1–3 está em sitemap, `llms.txt` e busca interna; rodar os builds e
    confirmar que `check-feed` continua passando (imagens no domínio próprio) e
    que o IndexNow postbuild lista as URLs novas. Corrigir o que faltar.

### Semana 4 — SplitJud (repo `..\splitjud`, só `apps/site` — ver Mecânica cross-repo)

15. `[plan]` **3 artigos GEO restantes do F3.** Ler `docs/GEO-HANDOFF.md` +
    `docs/PLANO-MACRO-GEO.md` e escrever os 3 que faltam do cluster: tabela de
    honorários OAB, gestão financeira de escritório de advocacia, repasse de
    honorários entre correspondentes. Mesmo padrão dos 3 existentes (BLUF,
    FAQ, interlink), **com `datePublished` visível e no schema desde já**.

16. `[build]` **Recência nos artigos existentes.** Adicionar
    `datePublished`/`dateModified` (frontmatter + data visível na página +
    `Article` no schema) nos 3 artigos já shipados — usar a data real do git
    log de cada arquivo como `datePublished`, hoje como `dateModified` quando
    houver retoque. É o item F3.4/F1.5 do handoff (Perplexity prioriza <30–60d).

17. `[plan]` **Calculadora pública de divisão de honorários.** Página em
    `apps/site` (ex. `/calculadora/`): advogado informa valor, percentuais dos
    envolvidos e vê a divisão — client-side, replicando SÓ a matemática (ler o
    código de `apps/app` para conferir a fórmula, **não importar nem modificar
    nada de lá**). BLUF + FAQPage + CTA para o app. É o lead magnet AEO do
    site, no padrão da calculadora do goiânia.

18. `[build]` **Interlink + descoberta no SplitJud.** Ligar artigos ↔ landing ↔
    calculadora nova (links contextuais nos 6 artigos e na home); atualizar
    `llms.txt` e sitemap com as páginas novas; conferir que o `@graph` das
    páginas novas integra o grafo único existente sem duplicar entidades e sem
    tocar nos `[PLACEHOLDER_*]`.

19. `[build]` **Fechamento.** Rodar `npm run build` no `apps/site` do SplitJud
    e `astro build` nos 2 sites deste repo uma última vez; atualizar o
    `handoff.md` de CADA repo (o daqui e o do SplitJud) com o que este plano
    entregou, pendências de ops que surgiram e gotchas novos; registrar o
    resumo do mês em `Docs/Obsidian/80-dev/changelog-ciclos.md`.

## Definição de pronto

Quando as 19 tarefas estiverem feitas (ou registradas como puladas com
justificativa), cada uma commitada com build verde e pushada — inclusive o
push manual do SplitJud nas tarefas 15–19 —, marque `status: done` em
`current_state.md`. Item já existente = "pulado (já existia)", segue o loop.
Bloqueio real (secret ausente, decisão de design/dono, working tree sujo no
SplitJud) = `status: blocked` com explicação, nunca chute.
