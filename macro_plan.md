# Macro plan 3 — Mês 3 do loop autônomo (Growth Partner + SplitJud)

> **Como rodar (humano):**
> `node "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\claude-loop-runner\src\runner.mjs" "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\ROI Labs" --max-iterations 24`

## Escopo (LEIA ANTES DE AGIR)

Horizonte de ~1 mês, 19 tarefas, uma por iteração. Semanas 1–3 = ROI Labs
Growth Partner (este repo). Semana 4 = **SplitJud, um repo DIFERENTE** — leia o
bloco "Mecânica cross-repo" antes de qualquer tarefa 15–19.

A etiqueta `[low]`/`[medium]`/`[high]` de cada tarefa é o `next_effort` que
você grava no frontmatter do `current_state.md` para a PRÓXIMA tarefa.

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
- **NÃO minere nem adicione imagens novas.** O acervo de fotos fechou em 25/30
  por decisão do dono (ciclo 13; Delta e Onix Bianco Lux ficam de fora de
  propósito — mostrar foto genérica seria enganoso). Todo conteúdo novo usa as
  fotos que JÁ estão em `site-goiania/public/img/`. Não rode `fetch-images.mjs`
  nem `fetch-ambiente.mjs`.
- **Verifique ANTES de construir.** Vários itens de ciclos anteriores caíram na
  verificação por já existirem (ver `handoff.md`, seções "Macro plan 2" e
  "Ciclo 8"). Já existem, NÃO refaça:
  - **site-goiania:** glossário `/glossario/` (19 termos, DefinedTermSet,
    âncoras `#termo`); 7 guias em `/guia/` (como-escolher, polido-ou-acetinado,
    porcelanato-ou-ceramica, quanto-custa, area-externa, rejunte,
    liquido-vs-porcelanato); calculadora completa (multi-ambiente, estimador de
    rejunte/argamassa, pré-preenchimento `?m2caixa=&produto=&nome=`, lead);
    comparador `/comparar` (`?p=`); favoritos `/favoritos` (↔ comparador);
    "vistos recentemente"; filtros+ordenação no hub `/porcelanato/`
    (`?marca=&ordem=`); Inspire-se + sub-páginas por ambiente; busca interna +
    SearchAction + `?q=`; WhatsApp flutuante; `/sobre`; `/devolucoes`; 404
    real; image sitemap; OG por página; feed.xml + `check-feed`; IndexNow.
  - **/site:** blog com 6 artigos (aparecer-chatgpt-perplexity,
    exclusividade-de-cadeira, growth-partner-vs-agencia, o-que-e-pseo,
    quanto-custa-google, vender-porcelanato-internet); `/modelo/`;
    `/polo-goiania/`; `/simulador`; llms.txt automático; OG por artigo.
  - **SplitJud `apps/site`:** 6 artigos no blog (divisao-de-honorarios,
    honorarios-sucumbencia-vs-contratuais, tabela-de-honorarios-oab,
    gestao-financeira-escritorio, repasse-de-correspondentes,
    contrato-de-parceria) com `datePublished`; calculadora `/calculadora/`;
    interlink + llms.txt.

  Se um item abaixo já existir, registre em `current_state.md` como "pulado
  (já existia)" e siga para o próximo.
- Página nova em Astro = registrar em sitemap, `llms.txt` e busca interna
  (índice de build), seguindo o padrão das páginas existentes (no goiânia,
  guia novo entra via `src/data/guias.ts`, que já alimenta sitemap/llms/hub/
  calculadora). URL **sempre com barra final** em todo link emitido (gotcha
  nginx: sem barra vira 301 `http://`).
- Conteúdo novo = rico e específico (BLUF, FAQ real, tabelas, interlink), nunca
  página genérica/mínima. Schema: nunca duplicar entidade que o `@graph` da
  página já emite. **Nunca inventar métricas de venda/tráfego/avaliação** —
  fatos verificáveis no repo apenas.
- Análises e docs novos deste plano nascem no vault
  (`Docs/Obsidian/80-dev/` para docs, `Docs/Obsidian/90-medicao/` para dados
  de medição) — nunca em `docs/` do repo.

### Mecânica cross-repo (tarefas 15–19, SplitJud)

O repo SplitJud fica em `C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud`
(monorepo: `apps/site` = Astro público, `apps/app` = Next autenticado).

- Antes da primeira tarefa SplitJud: confirme `main` checked out e working tree
  limpo lá (`git -C "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud" status`).
  Sujo ou em outra branch → `status: blocked`, não "arrume" sozinho. (No mês 2
  esse pré-check bloqueou 1x e o dono resolveu — o mecanismo funciona.)
- Trabalhe SÓ em `apps/site` e `docs/`. **NÃO** toque em `apps/app`, `prisma/`,
  `.env*`, nem nos `[PLACEHOLDER_*]` de `apps/site/src/lib/schema.ts` — os
  placeholders de `sameAs`/`Person` são o item T002 que depende do Aldo; não
  invente URLs para preenchê-los.
- `npm run build` dentro de `apps/site` deve passar antes de commitar.
- O runner só pusha ESTE repo. No SplitJud, **você mesmo** commita e pusha:
  `git -C "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud" push origin main`.
- `current_state.md` continua AQUI (raiz deste repo): atualize e commite aqui
  mesmo nas tarefas SplitJud.
- Contexto do SplitJud: leia `docs/GEO-HANDOFF.md` e `docs/PLANO-MACRO-GEO.md`
  antes da tarefa 15. Fica FORA do escopo autônomo: deploy/EasyPanel, GA4
  (canal e hard-code), WAF, F4 off-site, placeholders T002.

## Tarefas

### Semana 1 — Growth Partner: AEO de uso e pós-venda (site-goiania)

> Intenção informacional que vem ANTES e DEPOIS da compra — zero canibalização
> com a malha comercial (conferir contra os 41 slugs de `/porcelanato/` antes
> de escrever, como nos ciclos anteriores).

1. `[medium]` **Guia AEO `/guia/como-limpar-porcelanato/`.** Limpeza e
   manutenção por acabamento (polido, acetinado, natural/técnico, externo):
   rotina diária vs pesada, o que NUNCA usar (ácido, cera, abrasivo em
   polido), manchas comuns (rejunte, tinta, ferrugem) e limpeza pós-obra.
   Volume informacional alto no Brasil e intenção de dono de imóvel = também
   serve o pós-venda. BLUF + tabela por acabamento + FAQPage + interlink
   pesado (glossário via âncoras `#termo`, guias, malha). Registrar em
   `src/data/guias.ts`.

2. `[medium]` **Guia AEO `/guia/como-assentar-porcelanato/`.** Etapas reais
   (preparo do contrapiso, argamassa AC-II/AC-III conforme uso, dupla colagem
   em formato grande, junta mínima, nivelador, rejunte após cura) com schema
   **HowTo** + FAQPage. Ser honesto: recomendar profissional para grandes
   formatos. CTA para a calculadora (caixas + argamassa/rejunte que ela já
   estima). Registrar em `guias.ts`.

3. `[medium]` **Guia AEO `/guia/erros-ao-comprar-porcelanato/`.** 8–12 erros
   reais e como evitar (comprar sem folga de 5–15%, ignorar PEI do ambiente,
   misturar lotes/calibre/tonalidade, polido em área molhada/externa, esquecer
   frete e prazo, rejunte de cor errada, não conferir m²/caixa...). Cada erro
   linka o guia/ferramenta que o resolve (calculadora, comparador, glossário,
   guias). FAQPage + registro em `guias.ts`.

4. `[medium]` **Guia AEO `/guia/piso-vinilico-vs-porcelanato/`.** Mesmo padrão
   do liquido-vs-porcelanato (que compara com material concorrente):
   comparativo honesto de custo/m² instalado, durabilidade, umidade, conforto
   térmico/acústico, revenda. Tabela + FAQPage + CTA catálogo/calculadora.
   Registro em `guias.ts`.

5. `[high]` **Glossário ida-e-volta.** O glossário já linka guias/produtos na
   ida; auditar a VOLTA: varrer guias e páginas de produto que citam termos
   técnicos (PEI, retificado, destonalização, calibre, absorção...) e linkar o
   1º uso de cada termo por página para a âncora `#termo` do `/glossario/`.
   Sem exagero (1 link por termo por página) e sem quebrar layout — conferir
   no build. Se a volta já existir de forma geral, registrar "pulado (já
   existia)".

### Semana 2 — Growth Partner: dados reais + técnica (site-goiania)

6. `[low]` **Hub `/guia/` (índice de guias).** Hoje os 11 guias são listados
   no hub `/porcelanato/` e na calculadora, mas `/guia/` sem slug não é uma
   página. Criar índice agrupado por intenção (escolher → comparar → orçar →
   instalar → manter) + cards para glossário/calculadora/comparador, no
   sitemap/llms/busca, linkado do footer. Se já existir listagem dedicada
   equivalente, pular com registro.

7. `[medium]` **RSS/Atom nos 2 sites.** Nenhum dos sites tem feed. Criar
   (a) `/rss.xml` no `/site` a partir da content collection do blog (mesma
   fonte do `llms.txt.ts`) e (b) `/rss.xml` no site-goiania a partir do
   registro `guias.ts`. `<link rel="alternate" type="application/rss+xml">`
   no `<head>` (Base) de cada site e referência no llms.txt. Sem dependência
   nova se possível (gerar XML na mão via endpoint `.ts`, padrão do
   `sitemap.xml.ts`).

8. `[high]` **Striking distance com dados reais.** Ler
   `Docs/Obsidian/90-medicao/rank-tracking.csv` (histórico semanal, serper.dev)
   e `rank-tracking.md`: identificar termos na posição 8–40 e reforçar a
   página correspondente (title/meta/H2, 1–2 FAQs novas respondendo variações
   do termo, interlinks internos apontando para ela com âncora exata).
   Registrar a análise e as ações em `90-medicao/striking-distance.md`.
   Se ainda estiver tudo fora do top 100 (baseline de 07-03 era 0), registrar
   o snapshot honesto no mesmo arquivo e pular o reforço — não forçar.

9. `[high]` **Expansão da malha SÓ se houver dado do GSC.** Se
   `Docs/Obsidian/90-medicao/gsc-miner.md` existir com candidatas (depende do
   secret `GSC_SA_KEY`, previsto ~07-15), criar até 2 páginas de malha novas
   seguindo o padrão existente (dados curados reais + `tagsDoProduto` +
   gate `check-matrix`). Sem o arquivo (ou sem candidata com demanda real) →
   "pulado (sem dado GSC ainda)" — NÃO expandir malha por especulação, a
   disciplina do piso de volume continua valendo.

10. `[medium]` **Passada CLS/perf verificável no build.** Nos 2 sites:
    `width`/`height` (ou `aspect-ratio`) em toda `<img>` que não tiver,
    `loading="lazy"`/`decoding="async"` onde faltar (NUNCA no LCP/hero),
    conferir `preload` de fonte/imagem de hero onde fizer sentido e o tamanho
    dos scripts client das páginas interativas (comparar, filtros do hub,
    favoritos). Verificar via `astro build` + preview/Playwright. **NÃO usar
    Lighthouse local** (não-confiável nesta máquina); a série CWV real virá do
    PSI quando o secret existir.

11. `[high]` **Auditoria schema + breadcrumb.** Varrer as páginas criadas nos
    meses 1–2 e na semana 1 (guias, glossário, comparar, favoritos, inspire-se
    por ambiente, sobre, hub de guias): todas com `BreadcrumbList` coerente e
    JSON-LD que parseia no build, sem entidade duplicada no `@graph`. Corrigir
    as faltas. Registrar o resultado (págs auditadas × corrigidas) no
    `current_state.md`.

### Semana 3 — Growth Partner: institucional B2B (/site)

12. `[medium]` **2 artigos B2B novos no blog do `/site`** (conferir os 6 slugs
    existentes antes; não repetir ângulo): (a) **"Google Shopping para loja de
    material de construção"** — a experiência real do polo (feed.xml, Merchant
    Center, o que o Google exige: imagem própria, política de devolução,
    frete), sem inventar métricas; (b) **"E-commerce próprio vs entrar num
    polo pronto: a conta real"** — CAPEX/OPEX de montar sozinho vs
    pago-pelo-sucesso, usando a fórmula do success fee que o `/simulador` já
    replica. BLUF + FAQPage + datas + CTA simulador/candidatura + interlink
    `/modelo/` e `/polo-goiania/`.

13. `[low]` **Refresh do case `/polo-goiania/` e da `/modelo/`.** Atualizar os
    fatos verificáveis que ficaram velhos (nº de páginas do build atual,
    glossário 19 termos, 11+ guias, comparador, filtros, acervo ambientado,
    feed 30 itens) e `dateModified` no schema. Nada de métrica inventada; só o
    que o build/repo prova.

14. `[low]` **Refresh de descoberta nos 2 sites.** Conferir que TUDO das
    semanas 1–3 está em sitemap, `llms.txt`, busca interna (goiânia) e RSS
    novo; rodar os builds e confirmar que `check-feed` continua passando
    (imagens no domínio próprio) e que o IndexNow postbuild lista as URLs
    novas. Corrigir o que faltar.

### Semana 4 — SplitJud (repo `..\splitjud`, só `apps/site` — ver Mecânica cross-repo)

15. `[high]` **Glossário de honorários advocatícios em `/glossario/`.** Ler
    `docs/GEO-HANDOFF.md` + `docs/PLANO-MACRO-GEO.md` antes. 15–20 termos que
    o advogado busca (sucumbência, contratuais, de êxito/quota litis, dativos,
    arbitrados, assistenciais, substabelecimento com/sem reserva,
    correspondente jurídico, rateio, destaque de honorários, tabela OAB,
    contrato de risco...), definição BLUF de 2–4 frases cada +
    `DefinedTermSet`/`DefinedTerm` + âncoras `#termo`, interlinkando os 6
    artigos e a calculadora. Mesmo padrão do glossário do goiânia; integrar ao
    `@graph` existente sem duplicar entidades e sem tocar `[PLACEHOLDER_*]`.

16. `[medium]` **2–3 artigos novos do cluster honorários** (conferir os 6
    slugs existentes; ângulos novos): (a) "Advogado associado: remuneração e
    divisão de honorários"; (b) "Saída de sócio do escritório: o que acontece
    com os honorários dos casos em andamento"; (c) "Honorários de sucumbência:
    como dividir quando mais de um advogado atuou no processo". Mesmo padrão
    dos existentes (BLUF, FAQ, interlink, **`datePublished` visível e no
    schema desde já**).

17. `[low]` **FAQ + breadcrumbs.** Verificar `/faq`: se não emite `FAQPage`
    schema, adicionar (das perguntas reais da página); conferir
    `BreadcrumbList` nos artigos e páginas públicas e adicionar onde faltar —
    sempre integrando o `@graph` único, nunca duplicando.

18. `[low]` **RSS + descoberta no SplitJud.** `/rss.xml` da content collection
    do blog (padrão da tarefa 7), `<link rel="alternate">` no layout,
    glossário/artigos novos no `llms.txt` e sitemap, interlink
    glossário ↔ artigos ↔ calculadora ↔ home conferido.

19. `[medium]` **Fechamento.** Rodar `npm run build` no `apps/site` do
    SplitJud e `astro build` nos 2 sites deste repo uma última vez; atualizar
    o `handoff.md` de CADA repo (o daqui e o do SplitJud) com o que este plano
    entregou, pendências de ops que surgiram e gotchas novos; registrar o
    resumo do mês em `Docs/Obsidian/80-dev/changelog-ciclos.md` (seção "Macro
    plan 3").

## Definição de pronto

Quando as 19 tarefas estiverem feitas (ou registradas como puladas com
justificativa), cada uma commitada com build verde e pushada — inclusive o
push manual do SplitJud nas tarefas 15–19 —, marque `status: done` em
`current_state.md`. Item já existente = "pulado (já existia)"; tarefa
condicionada a dado que não chegou (8, 9) = "pulado (sem dado)", segue o loop.
Bloqueio real (secret ausente, decisão de design/dono, working tree sujo no
SplitJud) = `status: blocked` com explicação, nunca chute.
