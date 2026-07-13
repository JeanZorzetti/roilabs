# Handoff — roilabs.com.br (raiz)

## Feito
- Site raiz da ROI Labs em **Astro 5** (estático), 1 página rica + premium.
- Posicionamento: **holding + recrutamento de fornecedor** (não vitrine de consumidor).
- Design próprio (não-template): base grafite-arquitetura, seções porcelana, acento laranja hi-vis de obra. Fontes Archivo / Hanken Grotesk / Space Mono via Google Fonts.
- Seções: hero (card "cadeira" como instrumento) → manifesto → mecânica 01/02/03 → **Mapa de Cadeiras de Goiânia** (elemento-assinatura, FOMO da tese BNI) → leitura de mercado (dados reais: 1.900 buscas/mês "porcelanato" Goiânia) → ICP (3 gates: 2/3 validados + fit "pra você / não pra você") → FAQ de objeções (accordion nativo `<details>`, zero JS) → **candidatar (form)** → footer.
- **Form de candidatura real** via Web3Forms (estático, sem backend) → e-mail pra `parceria@roilabs.com.br`, honeypot anti-spam, redirect pra `/obrigado` (página própria). CTAs/nav apontam pra `#candidatar`; mailto vira fallback secundário.
- **Deploy pronto:** `Dockerfile` multi-stage (node build → nginx serve `dist/`) + `nginx.conf` (gzip, cache imutável em `/_astro/`, clean URLs) + `.dockerignore`.
- Build limpo (`npm run build` ✓, 2 páginas). Responsivo (desktop + mobile via Playwright). A11y básica: landmarks, focus-visible, prefers-reduced-motion, labels.

## Decisões
- **Stack = Astro** (sua escolha). Fase pSEO/subdomínio depois = app separado (Next) em `goiania.roilabs.com.br`, reaproveitando o design system de `src/styles/global.css`.
- **Form = Web3Forms.** Chave é PÚBLICA por design (vai no HTML). Pipar pro Sirius CRM depois = trocar o `action`/adicionar webhook.
- **Repo privado** `JeanZorzetti/roilabs`, monorepo: site em `/site`, vault em `/Docs`.

## Próximos passos (ordem)
1. ⚠️ **Web3Forms key:** pegar a chave em https://web3forms.com (e-mail `parceria@roilabs.com.br`) e colar em `WEB3FORMS_KEY` no topo de `src/pages/index.astro` (hoje = `YOUR_WEB3FORMS_ACCESS_KEY`, form não envia até trocar).
2. **EasyPanel:** criar App a partir do repo `JeanZorzetti/roilabs` (privado, já conectado ao GitHub), **Build path = `/site`**, builder = Dockerfile, porta 80. Apontar domínio `roilabs.com.br` + DNS. (UI/DNS são manuais — não tenho acesso ao painel.)
3. Quando a 1ª cadeira fechar, gerar `goiania.roilabs.com.br` (fase pSEO programática, app à parte).
4. Self-host das fontes (Fontsource) se o Lighthouse reclamar do render-block do Google Fonts.

## Pendências / gotchas
- `WEB3FORMS_KEY` é placeholder — **o form não funciona em prod até colar a chave** (passo 1).
- `npm install` rodou em pasta OneDrive (risco de corromper `node_modules`, errno -4094). Se `dev`/`build` quebrar do nada, deletar `node_modules` + reinstalar.
- Dados de mercado hard-coded em `index.astro` (`seats[]` + métricas + gates). Atualizar lá ao abrir novos nichos/polos.
- O `redirect` do form aponta pra `https://roilabs.com.br/obrigado` (absoluto/prod). Em dev/preview a confirmação só funciona depois do deploy no domínio.

---

## Auditoria de crawl budget (13/07/2026)

**Gatilho:** ROI Hub sinalizou `crawl-waste` — "40,6% OK, 6 em cada 10 hits do Googlebot desperdiçados".

**Veredito: a métrica é histórica, não há bug vivo.** O export do GSC (10/07) cobre 90 dias e é dominado por um período em que o site nem existia:

| Resposta | % | Origem |
|---|---|---|
| OK (200) | 40,60% | — |
| Erro do DNS | 22,22% | domínio sem site publicado (08–27/jun) |
| 301 | 20,94% | bug de trailing slash, vivo só de 29/jun a 03/jul |
| 302 | 11,54% | placeholder/parking pré-lançamento |
| 404 | 4,27% | idem |
| robots.txt indisponível | 0,43% | idem |

Provas: as 62 requisições com **0 bytes E 0 ms** (nunca chegaram ao servidor) param em 27/jun e batem com `Desconhecido (solicitações com falha) = 26,92%` (= DNS + 404 + robots). O `site/` nasceu em 28/jun (`84b8304`); o fix de trailing slash é de 03/jul (`02937fb`); o 404 real, de 04/jul (`13659b3`). **Só 12 das 234 requisições do export são pós-fix.**

Consequência: **o 40,6% não vai melhorar até a janela de 90 dias rolar** (~fim de setembro). Não perseguir esse número; julgar pelo mix de respostas dos dias novos.

**O que estava de fato vivo e foi corrigido:**
- `www.roilabs.com.br` servia o site inteiro com **200** (A record no mesmo IP) → host duplicado. Agora 301 → apex, no `nginx.conf`.
- `/obrigado/` estava **no sitemap e sem `noindex`** → página de agradecimento sendo rastreada e indexada. Agora noindex + fora do sitemap.
- `redirect` do form apontava pra `/obrigado` **sem barra** → hop 301 extra. Última URL sem barra do build.

**Guard:** `npm run seo:check` (roda no `postbuild`) quebra o build se qualquer URL de rota for emitida sem barra final, se `/obrigado/` voltar ao sitemap ou perder o `noindex`. Esse invariante já regrediu duas vezes (site-goiania e aqui) — agora falha alto.

**Não corrigido (de propósito):** `/favicon.ico` → 404 (o site usa `favicon.png`; Googlebot não penaliza) e `/modelo///` → 200 (barras repetidas; ninguém linka assim).
