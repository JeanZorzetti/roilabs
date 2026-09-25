---
tipo: spec
status: em revisão
data: 2026-09-25
dono: Jean (dev)
---

# nimblabs: painel de leads em /admin

Spec de uma funcionalidade nova do site [[nimblabs-site-design-2026-09-22]], desenhada com o Jean em 24–25/09/2026. Ela substitui o envio do formulário de contato por e-mail (Brevo) por um painel dentro do próprio nimblabs.com.

## 1. Objetivo

**O que o Jean pediu:**
- "quero que um painel administrativo receba os leads";
- o painel é novo, dentro do site, com login e banco próprios;
- nenhum aviso por e-mail.

**Para que serve:**
- cada envio do formulário `/contato` vira um lead guardado;
- a equipe vê os leads num lugar só, decide quem cuida de cada um, acompanha o andamento e anota o que foi conversado.

**Premissas (não ditas pelo Jean):**
- o WhatsApp continua sendo o canal principal e não passa pelo painel, porque a conversa acontece no aplicativo;
- o painel precisa estar pronto para o lançamento da etapa 1, em 06/10/2026.

**Critérios de sucesso:**
1. um envio do formulário aparece no painel em segundos, com nome, e-mail, mensagem, página de origem e data;
2. cada pessoa entra com o próprio login;
3. qualquer pessoa da equipe consegue assumir um lead, mudar o andamento e anotar;
4. um sócio consegue convidar e desativar pessoas e excluir um lead a pedido do titular (LGPD);
5. nada do painel é indexável nem aparece no sitemap.

## 2. Decisões do Jean (24–25/09)

| Pergunta | Resposta |
|---|---|
| Onde os leads chegam | Painel novo no site (não o Sirius, não o ROI Hub) |
| Aviso por e-mail | Não, só o painel |
| Quem entra | Sócios e mais gente, cada um com o próprio login |
| O que se faz com o lead | Andamento, dono e notas |
| Quem dá e tira acesso | Os sócios |
| Login | E-mail e senha |

## 3. Arquitetura

- **Código:** tudo no repositório do site (`C:\dev\nimblabs`, Astro 7 com adaptador da Vercel).
  - O site continua estático.
  - Só `/contato` e as rotas de `/admin` rodam no servidor (`prerender = false`).
- **Banco:** Postgres no **Neon**, pela integração da Vercel (plano gratuito, conexão com TLS).
  - O Postgres da VPS está descartado: não tem TLS, e nome e e-mail de lead atravessariam a internet em texto aberto.
- **Acesso ao banco:** SQL direto, sem ORM.
  - Um módulo expõe uma interface mínima `Banco = { query<T>(texto, params) → T[] }`, com duas implementações:
    - `@neondatabase/serverless` em produção;
    - `@electric-sql/pglite` (um Postgres que roda dentro do processo) nos testes.
  - Operações que mudam o lead e registram o histórico são **um único comando SQL** (CTE com `UPDATE … RETURNING` + `INSERT`), atômico sem precisar de transação.
- **Migrações:** arquivos `sql/NNN_nome.sql` aplicados em ordem por um script (`npm run db:migrar`), que registra o que já rodou numa tabela `migracoes`.
  - O script lê a pasta, não uma lista escrita à mão, então nenhuma migração fica de fora.
- **Proteção de `/admin`:** um middleware do Astro lê o cookie de sessão, carrega a pessoa em `Astro.locals` e manda para `/admin/entrar` quem não tem sessão válida.
  - As exceções são `/admin/entrar` e `/admin/definir-senha`.
- **Região:** banco e funções do site juntos, de preferência em São Paulo (Neon `aws-sa-east-1` e Vercel `gru1`).
  - Se a integração não oferecer São Paulo, ambos ficam na mesma região dos EUA e a política de privacidade diz isso.
  - A escolha é feita e conferida na hora de criar o banco.

## 4. Dados

| Tabela | Colunas | Observações |
|---|---|---|
| `usuarios` | `id`, `nome`, `email` (único, minúsculo), `papel` (`socio` \| `equipe`), `senha_hash` (nulo até definir), `ativo`, `tentativas_falhas`, `bloqueado_ate`, `ultimo_acesso_em`, `criado_em` | nunca se apaga uma pessoa, só se desativa, para as notas antigas manterem o autor |
| `links_de_acesso` | `token_hash`, `usuario_id`, `expira_em`, `usado_em`, `criado_por`, `criado_em` | convite e senha esquecida usam o mesmo link |
| `sessoes` | `token_hash`, `usuario_id`, `expira_em`, `criado_em` | apagadas ao sair e ao desativar a pessoa |
| `leads` | `id`, `nome`, `email`, `mensagem`, `origem`, `andamento` (`novo` \| `em_conversa` \| `fechado` \| `descartado`), `dono_id` (nulo), `criado_em`, `atualizado_em` | nasce `novo`, sem dono |
| `notas` | `id`, `lead_id` (apaga junto com o lead), `autor_id`, `tipo` (`nota` \| `historico`), `texto`, `criado_em` | `historico` é escrito pelo sistema: "Ana mudou o andamento para Em conversa" |

Os tokens (sessão e link) são 32 bytes aleatórios. No banco fica só o SHA-256 de cada um, e o token em si só existe no cookie ou no link.

## 5. Acesso e segurança

- **Entrar:** e-mail e senha em `/admin/entrar`.
  - O erro é sempre o mesmo ("E-mail ou senha não conferem."), exista ou não o e-mail.
  - Depois de **5 erros seguidos**, a conta fica travada por **15 minutos**; um acerto zera a contagem.
- **Senha:** no mínimo 10 caracteres, sem regra de composição.
  - É guardada com `scrypt` do `node:crypto` (N=16384, r=8, p=1, sal de 16 bytes).
  - A comparação é feita em tempo constante.
- **Convite:**
  1. um sócio cadastra nome, e-mail e papel;
  2. o painel gera um **link de uso único, válido por 72 h**, e o mostra uma vez com "Copiar";
  3. o sócio manda o link pelo WhatsApp;
  4. a pessoa abre `/admin/definir-senha?token=…`, define a senha e já entra.
- **Senha esquecida:** o mesmo link, gerado por um sócio em "Gerar link de senha".
  - A tela de entrar diz "Esqueceu a senha? Peça um link novo a um sócio."
  - Gerar um link novo invalida os anteriores daquela pessoa.
- **Primeiro acesso:** o script `npm run admin:primeiro-socio -- <email> <nome>` cria o primeiro sócio e imprime o link dele. Ele só roda com a tabela `usuarios` vazia.
- **Sessão:**
  - cookie `HttpOnly`, `Secure`, `SameSite=Lax` e `Path=/admin`;
  - vale 30 dias;
  - "Sair" apaga a sessão no banco.
- **Papéis:**

| Ação | Equipe | Sócio |
|---|---|---|
| Ver leads, abrir um lead | ✓ | ✓ |
| Mudar andamento e dono, assumir, escrever nota | ✓ | ✓ |
| Excluir lead | | ✓ |
| Ver a equipe, convidar, gerar link de senha, desativar | | ✓ |

- **Regras de proteção:**
  - não é possível desativar o último sócio ativo;
  - os leads de quem foi desativado mantêm o dono, que aparece como "Nome (desativada)"; o seletor de dono só oferece pessoas ativas, e qualquer um pode reatribuir;
  - desativar alguém apaga as sessões dessa pessoa na hora;
  - envio de formulário vindo de outro site é recusado pela checagem de origem do Astro, que já está ligada.

## 6. Telas

Todas usam os tokens do site, na direção Placa aprovada, sem a coreografia (nada de laser nem de luz no cursor). Cada ação é um formulário que envia e recarrega a página (POST e redirecionamento) e confirma por escrito, por exemplo "Andamento salvo". O único JavaScript é o botão "Copiar link".

- **Leads (`/admin`):**
  - **Pergunta que a tela responde:** "quem precisa de atenção agora?".
  - **Número principal:** leads novos sem dono.
  - **Visão padrão:** os abertos (novo e em conversa), do mais recente para o mais antigo.
  - **Filtros:** andamento (abertos · novos · em conversa · fechados · descartados · todos) e dono (todos · meus · sem dono · por pessoa). Ficam **na URL**, sempre visíveis e removíveis um a um.
  - **Paginação:** 50 por página, com o total.
  - **Linha:** data (dd/mm/aaaa hh:mm), nome, página de origem, andamento, dono e o começo da mensagem.
  - **Celular:** a linha vira cartão.
  - **Três vazios distintos:**
    - sem leads ainda: "Nenhum lead ainda. Os envios do formulário de contato aparecem aqui.";
    - filtro sem resultado: "Nenhum lead com esse filtro.", com "Limpar filtros";
    - erro: "Não conseguimos carregar os leads.", com "Tentar de novo".
- **Lead (`/admin/leads/<id>`):**
  - dados completos, com e-mail em `mailto:` para responder;
  - andamento, dono e "Assumir";
  - linha do tempo com notas e histórico;
  - campo "Nova nota";
  - para sócio, "Excluir lead", que abre uma confirmação com o nome do lead e avisa que as notas também são apagadas.
- **Equipe (`/admin/equipe`, só sócio):**
  - pessoas com papel, situação e data do último acesso;
  - "Convidar pessoa", "Gerar link de senha" e "Desativar".
- **Entrar e definir senha:** formulários curtos, com o erro no campo (`aria-describedby`) e o texto digitado preservado, menos a senha.
- **Ao implementar, as skills da casa entram em cada tela:**
  - `information-design` (lista);
  - `usability-heuristics` (filtros e vazios);
  - `ux-writing` (todos os textos);
  - `accessibility` e `responsive-design`;
  - `ui-verification` no fim.

## 7. LGPD

- A política de privacidade (`/privacidade`) passa a dizer que:
  - o formulário é **guardado num banco de dados (Neon)** e acessado só pela equipe da nimblabs, com login;
  - o Brevo sai da lista de quem trata os dados;
  - a região do banco é informada.
- **Pedido de exclusão:** um sócio usa "Excluir lead", e o lead e as notas somem de vez.
- **Retenção:** continua a regra atual da política ("pelo tempo necessário para responder e acompanhar a conversa, e apagamos quando você pedir"). Não há exclusão automática nesta versão.

## 8. Falhas

- **Banco fora do ar no envio do formulário:**
  - o visitante vê o aviso que já existe ("Não conseguimos enviar agora. Seu texto continua aqui…");
  - o servidor registra o erro no log da Vercel;
  - o lead não é perdido em silêncio: ou fica gravado, ou o visitante é avisado.
- **Banco fora do ar no painel:** o estado de erro da lista e da página do lead.
- **Erro de validação em qualquer formulário do painel:** a mesma página volta com o erro no campo e o texto preservado.

## 9. Testes

- **Unitários (Vitest):**
  - hash e verificação de senha;
  - geração, hash e validade dos links;
  - matriz papel × ação;
  - trava depois de 5 erros e liberação depois de 15 min;
  - leitura dos filtros da URL.
- **Com banco real em memória (PGlite + as mesmas migrações):**
  - o formulário grava o lead;
  - filtros e paginação;
  - mudar andamento ou dono gera a linha de histórico;
  - excluir lead apaga as notas;
  - o último sócio não pode ser desativado;
  - pessoa desativada ou sessão vencida não entra;
  - link usado ou vencido não serve;
  - link novo invalida o anterior.
- **Contrato do build:**
  - `/admin` fora do sitemap;
  - `Disallow: /admin` no `robots.txt`;
  - `noindex` nas páginas do painel.
- **No ar:** entrar, listar, abrir um lead, mudar o andamento e sair, em 360, 768 e 1440 px, com teclado e console limpo.

## 10. O que sai e o que entra

- **Sai:**
  - `envioBrevo` e o envio de e-mail do `/contato`;
  - as variáveis `BREVO_API_KEY`, `CONTATO_EMAIL_PARA` e `CONTATO_EMAIL_REMETENTE` (no schema do Astro e na Vercel).
- **Entra:**
  - a variável `DATABASE_URL` (secreta, definida pela integração do Neon);
  - a dependência `@neondatabase/serverless`;
  - a dependência de desenvolvimento `@electric-sql/pglite`.

## 11. O que depende do Jean

1. Aceitar a integração **Neon** no projeto `nimblabs-site` da Vercel, se a CLI não conseguir instalar sozinha.
2. Receber o próprio link de primeiro acesso e, já dentro do painel, convidar os outros sócios.

## 12. Fora de escopo nesta versão

- aviso por e-mail ou WhatsApp de lead novo;
- registro de cliques no WhatsApp como lead;
- exportar para planilha;
- exclusão automática por prazo;
- verificação em duas etapas;
- histórico de quem entrou no painel (além da data do último acesso).

## 13. Relação com o plano do site

- O plano [[nimblabs-site-plano-2026-09-23]] continua nas tarefas 16 a 18.
- A **tarefa 19 (lançamento)** passa a depender deste painel: sem ele, o formulário não tem para onde mandar o lead.
- Este painel terá um plano de implementação próprio.
