# Handoff — roilabs.com.br (raiz)

## Feito
- Site raiz da ROI Labs em **Astro 5** (estático), 1 página rica + premium.
- Posicionamento: **holding + recrutamento de fornecedor** (não vitrine de consumidor).
- Design próprio (não-template): base grafite-arquitetura, seções porcelana, acento laranja hi-vis de obra. Fontes Archivo / Hanken Grotesk / Space Mono via Google Fonts.
- Seções: hero (card "cadeira" como instrumento) → manifesto → mecânica 01/02/03 → **Mapa de Cadeiras de Goiânia** (elemento-assinatura, FOMO da tese BNI) → leitura de mercado (dados reais: 1.900 buscas/mês "porcelanato" Goiânia) → ICP (3 gates: 2/3 validados + fit "pra você / não pra você") → FAQ de objeções (accordion nativo `<details>`, zero JS) → CTA de candidatura → footer.
- Build limpo (`npm run build` ✓). Responsivo (desktop + mobile verificados via Playwright). A11y básica: landmarks, focus-visible, prefers-reduced-motion.

## Decisões
- **Stack = Astro** (sua escolha). A fase pSEO/subdomínio depois entra como app separado (Next) em `goiania.roilabs.com.br`, reaproveitando o design system de `src/styles/global.css`.
- CTA de candidatura = `mailto:parceria@roilabs.com.br` por enquanto (sem backend).
- Conteúdo é real (tese + dados validados do Keyword Planner), não placeholder.

## Próximos passos
1. **Deploy:** subir `site/` na EasyPanel/Vercel apontando `roilabs.com.br` (build context = esta pasta, output `dist/`).
2. Trocar o `mailto` por form real (Formspree/route) quando quiser captura estruturada.
3. Quando a 1ª cadeira fechar, gerar `goiania.roilabs.com.br` (fase pSEO programática, app à parte).
4. Self-host das fontes (Fontsource) se o Lighthouse reclamar do render-block do Google Fonts.

## Pendências / gotchas
- **Não está em git** (a pasta-raiz ROI Labs não é repo). Para versionar/push: `git init` aqui + criar remote. Não fiz sem remote definido — me fala se quer que eu inicialize.
- `npm install` rodou em pasta OneDrive (risco de corromper `node_modules`, errno -4094). Se `dev`/`build` quebrar do nada, deletar `node_modules` + reinstalar.
- `mailto`/form sem backend = sem validação server-side; ok pro MVP de recrutamento.
- Dados de mercado hard-coded no `index.astro` (`seats[]` + métricas). Atualizar lá quando abrir novos nichos/polos.
