<!--
SYNC IMPACT REPORT
Version change: (template) → 1.0.0
Bump rationale: Primeira constituição ratificada (adoção inicial a partir do template).
Princípios definidos (inicial):
  I.   Variáveis de Ambiente Primeiro
  II.  Verificação em Ambiente Real (NÃO-NEGOCIÁVEL)
  III. Simplicidade Deliberada (YAGNI)
  IV.  Qualidade de Página Voltada ao Usuário
  V.   Fluxo Spec-Driven e Entrega Fechada
Seções adicionadas: Restrições Técnicas & Stack; Workflow & Quality Gates
Seções removidas: nenhuma
Templates revisadas:
  ✅ .specify/templates/plan-template.md  (Constitution Check referencia a constituição genericamente — sem mudança)
  ✅ .specify/templates/spec-template.md  (sem requisitos conflitantes — sem mudança)
  ✅ .specify/templates/tasks-template.md (categorias compatíveis — sem mudança)
TODOs deferidos: nenhum
-->

# ROI Labs Constitution

## Core Principles

### I. Variáveis de Ambiente Primeiro
Toda investigação de erro de API, falha de deploy ou problema de conexão com banco
DEVE começar lendo os arquivos `.env` relevantes e confirmando paridade com
produção — caracteres especiais (`$`, `#`), comentários inline em URLs, URL
apontando para o banco errado — ANTES de tocar no código. Rationale: a causa-raiz
da maioria dos incidentes neste stack é configuração, não lógica; ler o código
primeiro queima tempo.

### II. Verificação em Ambiente Real (NÃO-NEGOCIÁVEL)
Build, typecheck e Lighthouse locais são NÃO-CONFIÁVEIS: o OneDrive corrompe
`node_modules` (errno -4094) e resolve módulos errado. Nenhuma mudança é declarada
"funcionando", "corrigida" ou "passando" sem evidência de um ambiente real —
Docker (EasyPanel) ou o navegador em produção. Asserções de sucesso exigem output
verificado, nunca suposição. Rationale: "compilou local" aqui não prova nada.

### III. Simplicidade Deliberada (YAGNI)
Prefira a solução mais simples que funciona: recurso da plataforma antes de
dependência, uma pasta antes de um subdomínio, conteúdo informacional antes de
inventário falso. Proibido: abstração com um só uso, config para valor que nunca
muda, scaffolding "para depois". Atalhos deliberados DEVEM ser marcados
explicitamente (comentário ou nota no spec) com o teto e o caminho de upgrade.

### IV. Qualidade de Página Voltada ao Usuário
Páginas e telas voltadas ao usuário NUNCA são genéricas ou mínimas: conteúdo rico
e design premium são obrigatórios. Este princípio governa o OUTPUT visível; o
código atrás dele permanece minimalista (Princípio III). Rationale: o produto é a
percepção de qualidade do parceiro/visitante; uma página "ok" não converte.

### V. Fluxo Spec-Driven e Entrega Fechada
Features e mudanças não-triviais seguem o fluxo Spec Kit:
`specify → clarify → plan → tasks → implement` (validar com `analyze`/`checklist`).
Toda entrega fechada gera um `handoff.md` co-localizado (feito / decisões /
próximos passos / pendências / gotchas) e é commitada + pushada sem perguntar.
Rationale: decisões e contexto se perdem entre sessões; o spec e o handoff são a
memória durável.

## Restrições Técnicas & Stack

- **Monorepo por app** (ex.: `/site` Astro estático → nginx, `/app` Next 16
  standalone, `/Docs` vault de estratégia). Cada app tem seu Dockerfile e domínio
  na EasyPanel.
- **Banco:** Postgres existente; schema via `prisma db push` MANUAL de uma máquina
  que alcança o host. NÃO confiar no runner standalone para aplicar schema.
- **Patterns Next 16 (obrigatórios):** `params: Promise<…>` + `await params`;
  `getAuthFromRequest() → auth.id`; prisma singleton em `@/lib/prisma`;
  `prisma generate` antes de `next build`; tabelas snake_case com `@@map`.
- **LLM único = `claude-cli`** (assinatura). SEM API paga; escalar = somar contas.
- **Canal de crescimento = pSEO regional + GEO/AEO** (otimizar para citação por
  IA e busca local); subdomínio por polo, nicho como pasta.
- **Idioma:** comunicação em português; código e mensagens de commit em inglês.

## Workflow & Quality Gates

- **Debug:** Princípio I (env-first) antes de qualquer hipótese de código.
- **Tarefas ambíguas/estratégicas:** descrever a abordagem em 1-2 frases e aguardar
  confirmação antes de explorar arquivos ou escrever conteúdo.
- **"Pronto" exige verificação real** (Princípio II) — Docker/EasyPanel ou
  navegador em produção, com output anexado.
- **Ao fechar entrega:** `handoff.md` atualizado + commit + push (Princípio V).

## Governance

Esta constituição supersede preferências ad-hoc quando há conflito; instruções
explícitas do usuário (CLAUDE.md, pedidos diretos) têm precedência sobre ela.
Emendas exigem: registro no Sync Impact Report, bump de versão semântico
(MAJOR = remoção/redefinição incompatível; MINOR = novo princípio/seção;
PATCH = clarificação) e revisão das templates dependentes em `.specify/templates/`.
Todo plano gerado pelo Spec Kit DEVE incluir um "Constitution Check" verificando
conformidade com estes princípios; complexidade não justificada é rejeitada.
Guia de runtime: `CLAUDE.md` (raiz) e o vault de estratégia em
`Docs/Obsidian/INDEX.md`.

**Version**: 1.0.0 | **Ratified**: 2026-06-29 | **Last Amended**: 2026-06-29
