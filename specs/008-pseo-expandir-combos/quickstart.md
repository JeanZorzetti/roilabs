# Quickstart — Validar a expansão da malha pSEO

Guia de execução/validação end-to-end. Detalhes de implementação vão em `tasks.md`.

## Pré-requisitos (gate env-first — Constituição I)

1. **Subir o OpenSEO** (fonte de volume):
   ```sh
   cd open-seo && docker compose up -d
   ```
   Confirmar: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001` → `200`, e uma consulta de teste retorna volume (créditos DataForSEO ok).
   > Se não subir / sem créditos → **PARAR**. A feature está bloqueada (sem fallback).

2. Node instalado; dependências do `site-goiania` (`npm install`). ⚠️ OneDrive corrompe `node_modules` — build confiável é no Docker (Const. II).

## Fluxo de validação

### 1. Mineração + seleção (produz as entradas)
- Minerar combos candidatos no OpenSEO (seed do vocabulário de `porcelanato.ts`).
- Filtrar `volume ≥ 200`, deduplicar contra os 31 slugs existentes.
- **Esperado:** lista de ~30-50 combos qualificados, cada um com `termoAlvo` + `volume`.

### 2. Autoria + curadoria (vira `PorcelanatoPage`)
- Gerar cada entrada no padrão existente; curar honestidade (sem atributo/inventário falso).
- **Esperado:** novas entradas em `src/data/porcelanato.ts`, slugs únicos.

### 3. Gate local (rápido, não é a verificação final)
```sh
cd site-goiania && node src/scripts/check-matrix.mjs
```
- **Esperado:** `[OK] N categorias + 30 produtos — slugs únicos, volume/preço > 0, imagens e FAQ presentes.` com N = 31 + novas. Warnings listando entradas < 200 (só a de 190 grandfathered, idealmente).
- **Falha aceitável de bloqueio:** slug duplicado / volume ≤ 0 → corrigir antes de seguir.

### 4. `llms.txt` gerado
- Após criar `src/pages/llms.txt.ts`, remover `public/llms.txt` manual.
- **Esperado:** `GET /llms.txt` lista os slugs novos e **não** menciona "bairro".

### 5. Verificação real (Docker/prod — a que conta, Const. II)
Após deploy no EasyPanel (`goiania.roilabs.com.br`):
- `GET /sitemap.xml` → lista todos os slugs (31 + novos).
- `GET /porcelanato/{novo-slug}` → H1 + intro + como escolher + FAQ **sem JS** (ver fonte).
- JSON-LD do slug novo → válido no [Rich Results Test](https://search.google.com/test/rich-results).
- `GET /llms.txt` → slugs novos presentes, sem "bairro".
- Página nova sem produto casado → informacional, **sem** inventário fabricado.
- CTA WhatsApp abre `wa.me` pré-preenchido; form sem consent bloqueia, com consent → 303 `/obrigado` e lead em `/admin/leads`.

### 6. Medição (ops, defasada)
- Submeter sitemap no Search Console; acompanhar páginas indexadas + impressões ao longo de 3-6 meses (rampa conhecida).

## Definition of Done
- [ ] OpenSEO confirmado no ar antes de minerar (evidência anexada).
- [ ] Todas as entradas novas com `volume ≥ 200`, slug único, atributos reais.
- [ ] `check-matrix` passa (build não quebra); só a página de 190 dispara warning.
- [ ] `llms.txt` gerado da fonte, sem "bairro"; `sitemap` inclui os slugs novos.
- [ ] Verificação no navegador em prod (páginas + JSON-LD + sitemap + llms.txt) com evidência.
- [ ] `handoff.md` co-localizado + commit + push (Const. V).
