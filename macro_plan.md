# Macro plan — Ciclo 15 "fora da caixa" (autônomo, semana 1)

## Escopo (LEIA ANTES DE AGIR)

Este plano **substitui** a pausa registrada em `Docs/Obsidian/80-dev/proximos-passos-dev.md`
("não especular ciclo 15 antes de ~07-15") — decisão consciente do dono do
projeto, feita com o smoke test do `claude-loop-runner` já validado. Este é o
escopo da **semana 1** de um horizonte maior; o escopo será ampliado aos
poucos em planos futuros, não de uma vez.

Você está numa git worktree isolada, branch `claude-loop` (nunca `main`).
Regras que continuam valendo, sem exceção:

- **NÃO** toque em código de pagamento (`lib/mercadopago.ts`, `lib/asaas.ts`,
  `api/parceiros/webhook`, `api/pedidos`), nada em `/app/prisma` ou que rode
  `db push`/migração, e não conecte no Postgres de produção.
- **NÃO** faça deploy nem mexa em configuração de EasyPanel/DNS/GitHub Actions.
- **NÃO** crie/edite nada que dependa de secret que você não tem (Asaas,
  Resend, GSC_SA_KEY, PSI_API_KEY) — se uma tarefa esbarrar nisso, pare, marque
  `status: blocked` e explique.
- Todo trabalho fica em `/site-goiania` e `/site` (Astro, estático) — **não
  toque em `/app`** nesta rodada (é onde vive o código de pagamento/DB; fica
  de fora até o loop ganhar mais supervisão comprovada, por decisão do dono).
- Verifique ANTES de construir: várias ideias parecidas já foram propostas em
  ciclos anteriores e descartadas por já existirem (ver `handoff.md`, ciclo
  8). Se ao investigar você achar que um item abaixo já está implementado,
  registre isso em `current_state.md` e pule para o próximo, não refaça.
- Depois de cada item: rodar localmente (build e/ou o script relevante) antes
  de considerar feito — build/`tsc` local não é confiável nesta máquina
  (OneDrive), mas `astro build` e scripts Node puros funcionam bem.

## Tarefas

1. `[plan]` **Lista de favoritos client-side em `/site-goiania`.** Um ícone
   de coração/estrela em cada card de produto (hub `/porcelanato/`, páginas
   de categoria, página do produto), persistido em `localStorage` (sem
   login, sem DB, sem API nova). Página nova `/favoritos` lista os
   salvos com foto+nome+link, e um CTA "Pedir orçamento dos favoritos no
   WhatsApp" reaproveitando o padrão `?c=` que o carrinho já usa. Justificativa:
   revestimento é compra de inspiração — ninguém decide numa visita só, e hoje
   não existe forma de "guardar pra depois" sem já estar no carrinho.

2. `[build]` **Estimador de acessórios na `/calculadora`.** Depois do
   resultado de caixas necessárias, mostrar também uma estimativa de rejunte
   (kg, considerando espaçamento padrão de junta) e argamassa (sacos, por
   m²), com aviso claro de "estimativa — confirme com o revendedor". Puramente
   matemático, sem API nova. Cliente esquece esses custos e isso gera atrito
   na hora da compra.

3. `[build]` **Galeria "Inspire-se" reaproveitando as fotos de ambiente.**
   Página nova em `/site-goiania` reunindo as fotos de `imagensAmbiente` de
   todos os produtos (já baixadas nos ciclos 11-14, zero mineração nova) num
   mural tipo lookbook, cada foto linkando pro produto de origem. Sitemap e
   `llms.txt` atualizados com a página nova.

4. `[plan]` **Simulador de ROI para o fornecedor em `/site` (institucional).**
   Página nova (ex. `/simulador`) onde o fornecedor candidato informa ticket
   médio e pedidos/mês estimados, e vê a receita projetada e o que sobra após
   o success fee (%) — client-side, replicando só a FÓRMULA que já existe em
   `app/lib/success-fee.ts` (ler para replicar a matemática, **não importar
   nem modificar o arquivo do /app**). CTA final leva pro formulário de
   candidatura já existente na home.

5. `[build]` **Auditoria básica de acessibilidade.** Percorrer as páginas de
   `/site-goiania` (hub, produto, calculadora, carrinho, orçamento) e
   registrar problemas de alt text ausente, contraste e labels de formulário
   em `Docs/Obsidian/90-medicao/a11y-audit.md` — sem ferramenta paga, só
   inspeção do HTML gerado no build. Corrigir os problemas encontrados que
   forem seguros de corrigir sozinho (alt text faltando, label ausente); só
   documentar (não tentar corrigir) os que exigirem decisão de design.

## Definição de pronto

Quando as 5 tarefas acima estiverem feitas e commitadas nesta branch — cada
uma buildando sem erro e, onde aplicável, verificada localmente (matemática
da calculadora conferida com 2-3 casos manuais, favoritos testados no
browser/preview, galeria renderizando fotos reais) — marque `status: done`
em `current_state.md`. Se investigar e achar que algum item já existe, marque
como concluído (pulado por já existir) e siga pro próximo — não pare o loop
por isso.
