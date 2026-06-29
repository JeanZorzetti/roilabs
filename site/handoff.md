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
