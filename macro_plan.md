# Macro plan — smoke test do claude-loop-runner (ROI Labs Growth Partner)

## Escopo (LEIA ANTES DE AGIR)

Este é um teste de fumaça da ferramenta `claude-loop-runner`, não um ciclo de
produto novo. O backlog vivo deste repo (`Docs/Obsidian/80-dev/proximos-passos-dev.md`)
diz explicitamente para não especular o próximo ciclo antes de ~2026-07-15 —
por isso este plano NÃO tenta nenhum item de produto/SEO, só valida a
ferramenta com uma tarefa pequena e reversível.

Você está rodando dentro de uma git worktree isolada, numa branch própria
(`claude-loop`) — nunca `main`. Mesmo assim, respeite:

- **NÃO** toque em código de pagamento (`lib/mercadopago.ts`, `lib/asaas.ts`,
  `api/parceiros/webhook`, `api/pedidos`), nem em nada em `/app/prisma` ou que
  rode `db push`/migração. Não conecte no Postgres de produção. Não faça
  deploy nem mexa em configuração de EasyPanel/DNS.
- Se qualquer tarefa abaixo parecer exigir uma dessas coisas, pare, marque
  `status: blocked` em `current_state.md` e explique por quê — não tente.
- O objetivo é só provar que o loop consegue: ler este arquivo, fazer uma
  tarefa pequena, documentar em `current_state.md`, e reconhecer quando
  terminou. Não invente escopo maior que o listado abaixo.

## Tarefas

1. `[build]` Criar `scripts/health-check.mjs` na raiz do repo (fora de `/app`
   e `/site` — nunca deve entrar em nenhum build de deploy): um script Node
   sem dependências externas que faz `fetch` GET (somente leitura, sem
   escrever nada em lugar nenhum) nas 3 URLs já documentadas em `handoff.md`
   → seção "Como rodar / verificar":
   - `https://roilabs.com.br`
   - `https://app.roilabs.com.br/api/cadeiras`
   - `https://app.roilabs.com.br/api/health`
   Para cada uma, imprime método, URL, status HTTP e tempo de resposta em ms.
   Um 404 ou erro de rede é um resultado válido a reportar, não uma falha do
   script. Rode localmente pra confirmar que funciona antes de considerar
   este item feito.

2. `[build]` Criar `scripts/health-check.test.mjs`: um teste simples (só
   `node:assert`, sem framework) que confirma que o arquivo do item 1 lista
   exatamente essas 3 URLs. É uma checagem de regressão do próprio script,
   não um teste de rede real.

## Definição de pronto

Quando os 2 itens acima estiverem feitos e commitados nesta branch, e
`node scripts/health-check.test.mjs` passar, marque `status: done` em
`current_state.md`.
