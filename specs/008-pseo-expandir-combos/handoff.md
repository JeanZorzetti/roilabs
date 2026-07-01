# Handoff — 008 Expandir malha pSEO porcelanato (combos validados por volume)

**Data:** 2026-07-01 | **Status:** código completo e verificado no Docker; falta deploy EasyPanel (T017)

---

## O que foi entregue

- **8 páginas novas** em `site-goiania/src/data/porcelanato.ts`, todas com volume real Goiás ≥ 200/mês (DataForSEO):
  `revestimento-cozinha` (720), `revestimento-banheiro` (720), `piso-banheiro` (590),
  `piso-antiderrapante` (390), `porcelanato-preco` (260), `porcelanato-bege` (210),
  `piso-cozinha` (210), `piso-area-externa` (210). Conteúdo rico (BLUF, comoEscolher, FAQ), honesto (sem atributo/inventário falso), interligado no silo. **Malha: 30 → 38 categorias.**
- **30 volumes existentes corrigidos** de estimativa para real (base Goiás), com comentário `// real Goiás (DataForSEO 2026-07-01)`.
- **`check-matrix.mjs`**: mantém erro fatal em `volume ≤ 0`; **novo warning não-fatal** para `< 200` (lista os slugs). Gate roda verde: `[OK] 38 categorias + 30 produtos`.
- **`site-goiania/src/pages/llms.txt.ts`** (NOVO): gera o `llms.txt` da fonte (`pages` + `produtos`), paridade com `sitemap.xml.ts`. Antes o site-goiania não tinha llms.txt.
- **`site/public/llms.txt`** (institucional): removida a menção falsa "× bairro" → "× intenção local".
- **`site-goiania/src/data/README.md`**: guia de autoria atualizado (fonte OpenSEO/Goiás, piso ≥ 200, gate > 0, warning < 200, honestidade).

## Verificação (real, Constituição II)

`docker build` do `site-goiania` (node:22-alpine limpo) — **exit 0, 72 páginas**, prebuild `check-matrix` passou. Container rodado e curl:
- `/porcelanato/revestimento-cozinha/` → **200**, H1 correto, **JSON-LD** Product+FAQPage+BreadcrumbList+Organization+WebSite.
- `/sitemap.xml` → inclui os **8 slugs novos**.
- `/llms.txt` → **200**, 68 links (38 guias + 30 produtos), sem "bairro".
- `volume` **não** aparece renderizado (metadado interno — corrigir não afeta o usuário).

## Decisões (o pivô por dado real)

- **Os 30 volumes eram ESTIMATIVAS, não minerados** — inflados ~7-10× vs. o real. Ex.: "porcelanato amadeirado" gravado 1900 → real Goiás 720, Goiânia cidade 260, Brasil 22.200. Decisão do usuário: corrigir para real (Goiás).
- **Base geográfica = Goiás estado** (melhor proxy do mercado de uma loja de Goiânia; cidade dá volumes minúsculos, nacional engana quem compra local).
- **≥ 200 em Goiás → só 8 combos novos** (não 30-50). A meta antiga vinha dos números falsos. Expansão honesta ≈ 8.
- **Fonte real = DataForSEO direto** (OpenSEO não tem API REST — só UI). Mesma fonte que o OpenSEO consome. Custo total da mineração: ~$0.45.
- **× bairro continua FORA** (herda D8 da spec 001).

## Próximos passos (ops — T017)

1. **Deploy do `site-goiania` no EasyPanel** (build context `site-goiania`, Dockerfile já ok). Confirmar em `goiania.roilabs.com.br`:
   - `/porcelanato/revestimento-cozinha/` (e os outros 7) renderiza + JSON-LD válido no Rich Results Test.
   - `/sitemap.xml` e `/llms.txt` com os slugs novos.
2. **Redeploy do `/site`** (institucional) para publicar o `llms.txt` sem "bairro".
3. Submeter o sitemap no Search Console; acompanhar indexação/impressões (rampa 3-6 meses).

## Pendências / recomendações

- **⚠️ 19 das 30 páginas existentes têm volume real < 200** (várias em 10/mês — combos tipo×ocasião e dimensão sobre-construídos na spec 001, sem demanda local real). Grandfathered (gate > 0, warning). **Candidatas a poda/consolidação** numa próxima rodada — com **redirects 301** (são URLs já indexadas). NÃO feito aqui (destrutivo, decisão de SEO do usuário). Lista completa no output do `check-matrix`.
- **⚠️ Segredo no repo:** `open-seo/.env` contém a chave DataForSEO (conta `mariazorzetti@siriuscrm.com.br`) em texto. Se estiver versionada, **gitignore + rotacionar** (ver memória `secrets_to_rotate`). Saldo atual ~$0.44.
- **`loja-porcelanato-goiania`**: DataForSEO retorna null em todos os níveis → volume proxy 10 (comentado, não fabricado). Se quiser precisão, medir por outra fonte.
- **Cannibalização a monitorar:** alguns novos (`piso-banheiro`, `piso-cozinha`, `piso-area-externa`) coexistem com os `porcelanato-*` do mesmo ambiente. Ângulos foram diferenciados + interligados, mas vale acompanhar no GSC.

## Gotchas

- `check-matrix.mjs` roda em **node puro** (regex sobre o `.ts` + `porcelanatos.json`) — **não precisa de `npm install`**. Build real = Docker.
- O gate conta `atributos.dimensao` com **valor entre aspas** por entrada (=== nº de slugs). **Toda página nova precisa de `dimensao: '...'`** ou o build quebra.
- Páginas estáticas: nginx redireciona no-trailing-slash → `301` para `/…/` (normal; use barra final ao testar).
- `volume` é metadado interno (não renderizado) — seguro corrigir.
