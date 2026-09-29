# Handoff — 020 Contrato da cadeira

## Feito

- **"Emitir contrato" no cartão da proposta de cadeira** (`/admin/propostas`) → `/admin/contratos/cadeira?proposta=<id>`.
  O formulário pede só as partes, o início, o foro, o pagamento e as condições específicas. Anuidade, comissão,
  condições e Anexo I vêm da proposta relida no servidor (`montarContratoCadeira`, `app/src/lib/contrato-cadeira.ts`).
- **Página pública `app.roilabs.com.br/c/<slug>`**, com a pele da `/p/`: 17 cláusulas (16 para PF), Anexo I e aceite
  no rodapé. O aceite é um formulário HTML sem JS (nome, CPF com dígito verificador, caixa) e grava nome, CPF, IP,
  navegador e o SHA-256 do `doc` com as chaves ordenadas.
- **Integração das telas**: o cartão da proposta mostra o contrato (link `/c/`, estado, editar), e `/admin/contratos`
  lista cadeira + Vértice juntos (`allSettled`, selo de tipo nos dois).
- **Tabela `contratos_cadeira` em produção** (`roilabs_db`), aplicada com `migrate diff` + `db execute`: o diff era só o
  CREATE + 3 índices + FK, e depois `--exit-code` = 0. A FK `proposta_id` é `RESTRICT` + `UNIQUE`.
- `PartyFields` extraído de `/admin/contratos/novo` para `components/vertice/PartyFields.tsx`, compartilhado com a
  Vértice, sem mudança visível.
- `test/contrato-cadeira.test.mjs` entrou no `npm test` (suíte inteira verde).

## Decisões (do dono, 29/09)

- Integrar = **contrato da cadeira**, não fundir as telas.
- Saída antecipada: **qualquer parte, 30 dias de aviso, sem multa; a anuidade paga não volta**.
- Fim do contrato: **o domínio vai para o parceiro; site e plataforma ficam com a ROI Labs; dados e conteúdo vão em
  arquivo**.
- Defaults (spec, Assumptions): 12 meses com renovação automática salvo aviso de 30 dias, IPCA na renovação,
  contestação em 5 dias úteis, multa de 2% + juros de 1%, suspensão após aviso de 10 dias.

## Verificação

- Local (build de produção em `C:\dev\roilabs-app-020` + `prisma dev`): emitir com pendência → `/c/` sem formulário →
  completar → CPF errado recusado (`alert` + `aria-invalid`) → hash velho recusado ("atualizou o contrato") → aceite
  só pelo teclado → registro com IP/UA/hash (o hash recalculado confere) → cartões sem editar/excluir → `RESTRICT`
  recusa excluir a proposta (P2003) → "Emitir" de aba velha redireciona para o contrato. 360/768/1440 px sem rolagem
  lateral; console sem erro.
- **Produção (29/09, `9df042b`)**: no ar ~90 s depois do push. Contrato de teste semeado por script, aberto em
  360 px (noindex, 17 cláusulas, sem rolagem lateral), aceito pelo navegador; no banco, IP real (não `::1`), UA e hash
  conferindo. `/admin/contratos` e `/admin/propostas` mostram "Aceito … · Fulano de Teste" sem editar/excluir e sem
  erro de banco. Linhas de teste apagadas direto no banco; o link voltou a "Contrato não encontrado".
- Achado e consertado na verificação: `ROI_APP` vem de módulo `"use client"` e, lido como string num server component,
  vira referência de cliente. O link da proposta no cartão do contrato agora é relativo (`/p/<slug>`).

## Próximos passos / pendências

- **O texto é minuta.** Antes do primeiro contrato real, o Jean decide se passa pelo advogado. Pontos a levar: natureza
  do contrato (a equipe de vendas da ROI Labs fecha venda do parceiro e ganha comissão, e a cláusula diz "não é
  representação comercial", mas a Lei 4.886/65 olha a substância); nicho de saúde (clínicas) com dado sensível; a
  definição de venda originada por modelo.
- Aceite forçado de contrato com pendência (POST direto na action) não foi disparado no navegador: o caminho está no
  código (`doc.pendencias.length > 0` → volta sem gravar), mas só o estado da página foi visto.
- Excluir contrato não tem `confirm()` (igual à proposta de cadeira da 019). Se um dia apagar contrato enviado por
  engano virar problema, reaproveitar o `DeleteContractButton` da Vértice.
- A cobrança da anuidade continua fora do app (spec 010/014 não cobram anuidade).

## Gotchas

- **URL do banco de produção**: usar a `DATABASE_URL` do `.env` da raiz do repo (fora do git). Montar a URL à mão com
  outro usuário falha na autenticação.
- `prisma dev` local exige `&pgbouncer=true` na URL, senão dá "prepared statement s0 already exists".
- `next build` no OneDrive falha (`tailwindcss` não resolve). Buildar numa cópia em `C:\dev` com `npm install` próprio.
- `TaskStop` de um `next start` em background mata o shell, mas não o node: a porta fica presa. Parar pelo PID.
