# Handoff — 016 Precificação

**Última atualização: 27/09/2026.** Feature pronta e verificada **localmente**, commitada no branch
`016-precificacao`. **Não publicada** (nem push do branch, nem merge em `main`).

## 0. Por que não foi publicada

O repositório `JeanZorzetti/roilabs` é **público** (GitHub API: `visibility=public`, conferido em
27/09). Publicar esta feature põe no GitHub, legível por qualquer um — inclusive fornecedores e o
parceiro atual de fitas —, a tabela interna de preços: as faixas, a recompra de 8% sugerida para
o B2B (o contrato atual é 15/10), o "limite para negociar" e as justificativas. Isso é decisão de
negócio, não técnica. Caminhos:

1. **Publicar assim mesmo** (a home já diz "a conta é pública"): `git checkout main && git merge 016-precificacao && git push`. Push em `main` = deploy.
2. **Tornar o repo privado antes** (Settings → General → Danger Zone no GitHub). ⚠️ Conferir antes se a EasyPanel puxa o repo com token; se puxa pela URL pública, o deploy quebra até configurar credencial.
3. **Publicar sem as partes sensíveis**: tirar do `NICHOS` a linha B2B e a regra "Limite para negociar" da página.

## Feito

- `app/src/lib/precificacao.ts` — tabela (20 nichos, 5 faixas) e regras puras: `calcularComissao`,
  `encaixarPorMargem`, `nichoSugerido`, `lerNumeroBR`. Não é lido pela cobrança.
- `/admin/precificacao` — faixas, calculadora de pedido (1ª compra × recompra), encaixe pela margem,
  tabela agrupada, taxas em vigor por parceiro (compara com a tabela), regras, contrato, comparativo
  de mercado e notas de confiança. Link no menu, entre Parceiros e Centros de custo.
- Menu do topo: com 12 links, quebra em linha inteira em vez de partir o rótulo ("Leads / Goiânia").
- `app/test/precificacao.test.mjs` no `npm test`.

## Verificação (local, 27/09)

- `npm run build` limpo (TypeScript incluso); `npm test` com saída 0.
- Playwright contra `next start` com banco inexistente de propósito: página abre, seção de parceiros
  mostra o aviso, calculadora confere com o relatório (moda R$ 200 → R$ 30/R$ 20; móveis R$ 4.000 →
  R$ 380; eletrônicos R$ 30 com distribuidor → piso R$ 5; margem 20% → "não fecha"). Console sem
  erro. 390px sem rolagem lateral; tabelas viram cartões.
- **Não verificado**: a seção "Taxas em vigor" com dados reais (sem banco local) e produção.

## Próximos passos

- Decidir a publicação (seção 0). Depois do deploy: abrir `/admin/precificacao` logado e conferir a
  lista real de parceiros e a linha sugerida de cada um.
- Se o Jean aprovar a tabela: botão "preencher pela tabela" no cadastro do parceiro (toca o caminho
  de dinheiro da 010 — só pré-preenche, a validação `parseTaxa` continua igual).
- Subir a confiança dos números: CPC por nicho no Keyword Planner, margem real de cada fornecedor,
  % de recompra da Tapepro nos primeiros 6–12 meses (decide 8% ou 10%).

## Gotchas

- `next start` avisa que não combina com `output: 'standalone'`, mas serve para conferir tela local.
- `npm install` no `/app` gera `package-lock.json`; o repo não versiona lockfile — não commitar.
- A tabela está em código de propósito (Constituição III). Editar pelo admin = model Prisma + form,
  no molde dos parâmetros de centros de custo (004).
