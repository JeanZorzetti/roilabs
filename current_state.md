---
status: in_progress
next_effort: high
iteration: 14
updated_at: 2026-07-06T13:50:00.000Z
---

## Last completed
Tarefa 14 (Semana 3, Macro plan 3): **Refresh de descoberta nos 2 sites** —
verificação pura, **nenhuma correção necessária** (os registros via `guias.ts`
e content collection já alimentam tudo automaticamente):
- site-goiania (`npm run build`, 98 págs verde): os 4 guias novos
  (como-limpar, como-assentar, erros-ao-comprar, piso-vinilico-vs-porcelanato)
  E o hub `/guia/` presentes em sitemap.xml, llms.txt, busca-index.json e
  rss.xml (conferido no dist/). `check-feed OK — 30 itens` (imagens no domínio
  próprio). IndexNow postbuild enviou 93 URLs do sitemap (inclui as novas,
  pois lê o próprio sitemap).
- /site (`npm run build`, 15 págs verde): os 2 artigos B2B
  (google-shopping-loja-material-construcao, ecommerce-proprio-vs-polo-pronto)
  presentes em sitemap.xml, llms.txt e rss.xml. IndexNow: 14 URLs, HTTP 200.
- Observação (não-blocker): IndexNow do goiânia retornou HTTP 403 nas 2
  tentativas locais, embora a chave esteja servida em prod (200 em
  /e72cab81d95c41fd915ce3331a10d1ad.txt) e o mesmo script do /site retorne
  200. Script é non-fatal por design; provável rate-limit/transiente do
  api.indexnow.org para esse host. Vigiar no próximo build; se persistir,
  anotar no handoff da tarefa 19.

## Next step
Tarefa 15 do `macro_plan.md` (Semana 4, `[high]`, **repo SplitJud**):
**Glossário de honorários advocatícios em `/glossario/`** no
`C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud`, `apps/site` (Astro).
ANTES de tudo: (1) `git -C ...\splitjud status` — precisa estar em `main` com
working tree limpo; sujo/outra branch → `status: blocked`; (2) ler
`docs/GEO-HANDOFF.md` e `docs/PLANO-MACRO-GEO.md` do SplitJud. Criar 15–20
termos (sucumbência, contratuais, êxito/quota litis, dativos, arbitrados,
assistenciais, substabelecimento com/sem reserva, correspondente jurídico,
rateio, destaque de honorários, tabela OAB, contrato de risco...), definição
BLUF 2–4 frases + `DefinedTermSet`/`DefinedTerm` + âncoras `#termo`,
interlinkando os 6 artigos do blog e a calculadora. Mesmo padrão do glossário
do site-goiania; integrar ao `@graph` existente sem duplicar entidades e SEM
tocar `[PLACEHOLDER_*]` de `apps/site/src/lib/schema.ts`. `npm run build` em
`apps/site` verde, registrar em sitemap/llms.txt, e **push manual**:
`git -C ...\splitjud push origin main` (o runner só pusha este repo).
`current_state.md` continua aqui neste repo.
