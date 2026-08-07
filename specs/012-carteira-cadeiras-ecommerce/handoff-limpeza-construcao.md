# Handoff — limpar construção + o "1 ocupada" do /admin (07/08/2026, fim do dia)

> ## ✅ EXECUTADO em 07/08/2026 — este handoff está FECHADO
>
> **Decisões do Jean:** (a) OrçaObra **FICA** · (b) os **9 posts ficam** · (d) a cadeira de
> porcelanato é **"curadoria aberta"** (o banco manda) · escopo = itens 1 **e** 2.
>
> **Banco, medido depois:** `Cadeira: 11` · polos `Goiânia: 3` / `Carteira: 8` ·
> `ordem: 0,1,2,8..15` · `ProdutoCadeira: 0` · `Parceiro: 1` · `Candidatura: 0`.
> As 5 cadeiras (`seat-1`..`seat-5`) foram deletadas por script, com guarda fail-closed
> (aborta se qualquer uma tivesse parceiro, produto ou não estivesse `vaga`). O script foi
> apagado depois. `npm test` 18/18, `npx tsc --noEmit` limpo, `npx astro build` com
> **11 `<li class="seat">`** no HTML gerado e o `<select>` com 2 `<option>`.
>
> **O que foi ALÉM do combinado, e por quê:**
> - **`ordem` saiu do skeleton gerado** (`site/src/data/carteira.ts`). Ninguém no `site` a
>   lia, e ela era derivada de `DEFAULT_SEATS.length` — com o mapa em 3, passaria a dizer
>   3..10 contra os 8..15 do banco. O que alinha card com linha é a POSIÇÃO no grid.
> - **O seed passou a criar cadeira de projeto com `max(ordem)+1`.** `DEFAULT_SEATS.length +
>   criadas` daria `ordem: 3` na próxima cadeira nova: a API ordena por `ordem` e a serviria
>   ANTES do bloco 8..15, enquanto o skeleton a desenha por último — o laço ao vivo casa por
>   índice, então TODOS os cards receberiam o dado do vizinho.
> - **`polo` explícito nas cadeiras de projeto** (`'Carteira'`), com a mesma exceção do
>   `gen-carteira`: projeto cujo `niche` já é cadeira de nicho (a `atma`) continua em Goiânia.
>
> **O que continua aberto:** `ProdutoCadeira` vazia — **0 de 11 cadeiras conseguem receber
> pagamento**, e agora o painel diz isso na cara. Nenhuma linha de código conserta isso;
> é cadastro de produto + credencial de gateway.

> Arquivo NOVO. Não confundir com [handoff.md](./handoff.md) (histórico da feature),
> [handoff-proxima-sessao.md](./handoff-proxima-sessao.md) (fechado) nem com
> [handoff-nomes-e-ocupacao.md](./handoff-nomes-e-ocupacao.md) — **aquele está fechado**:
> os nomes das empresas estão no ar, `main` em `19f096a`, e os dois `status` divergentes
> (`Polaris IA`, `Orion ERP`) foram corrigidos direto no banco de produção.

**Estado de partida, medido agora e não lembrado** (`roilabs_db@2.24.207.200:5443`):

```
Cadeira: 16   ·   polos distintos: ["Goiânia"]   ·   Parceiro: 1   ·   ProdutoCadeira: 0
Candidatura: 0   ·   Pedido: 6   ·   LeadConsumidor: 2
```

| # | pedido do Jean | o que a medição diz | é bug? |
|---|---|---|---|
| 1 | "Remover tudo de construção, menos Revestimentos / Porcelanato" | 5 cadeiras a deletar, **4 listas** para manter em sincronia, e nenhuma tem dependente | ❌ não é bug, é escopo — mas tem 1 armadilha silenciosa |
| 2 | "O /admin continua mentindo que só tem 1 cadeira ocupada" | o `1` está certo. **O número que realmente importa é `0`, e o painel não o mostra** | ⚠️ o defeito é de PERGUNTA, não de conta |

---

# 1 — Remover construção: 5 cadeiras, 4 listas, 1 armadilha

## O que é "construção" aqui, medido

As 6 primeiras cadeiras do mapa de Goiânia são de construção. Uma fica:

| ordem | niche | estado | open | parceiros | produto | ação |
|---|---|---|---|---|---|---|
| 0 | **Revestimentos / Porcelanato** | vaga | **true** | 0 | — | ✅ **FICA** |
| 1 | Materiais de construção | vaga | false | 0 | — | 🗑️ remover |
| 2 | Esquadrias / Vidraçaria | vaga | false | 0 | — | 🗑️ remover |
| 3 | Iluminação / Elétrica | vaga | false | 0 | — | 🗑️ remover |
| 4 | Marcenaria sob medida | vaga | false | 0 | — | 🗑️ remover |
| 5 | Pisos / Deck externo | vaga | false | 0 | — | 🗑️ remover |

**As 5 não têm um único dependente** — zero `Parceiro`, zero `ProdutoCadeira`, e
`Candidatura` está vazia no banco inteiro. Deletar não esbarra em FK nem apaga histórico.
A única `open=true` de todo o mapa é a que fica, então o formulário de candidatura continua
tendo para onde apontar.

## Os 4 lugares que listam os nichos — mudar 1 só deixa o site mentindo

🚨 **A lista está escrita à mão em três lugares e nenhum deles é gerado do outro.**

| # | onde | o que é |
|---|---|---|
| 1 | [app/src/lib/seats.ts](../../app/src/lib/seats.ts) `DEFAULT_SEATS` | a fonte do seed |
| 2 | [site/src/pages/index.astro:32-41](../../site/src/pages/index.astro) `const seats` | **cópia à mão** do skeleton no-JS — o comentário em :28 diz "ESPELHA DEFAULT_SEATS", e nada verifica isso |
| 3 | [site/src/pages/index.astro:511-519](../../site/src/pages/index.astro) `<option>` | o dropdown do formulário de candidatura |
| 4 | o **banco** | o seed **nunca deleta** — só cria e atualiza. Tirar de `DEFAULT_SEATS` deixa a linha viva no banco, e a home a busca ao vivo |

A #4 é a que morde primeiro: apagar as 5 linhas de `seats.ts` e rodar o seed **não remove nada
da home** — a API continua servindo 16 cadeiras e o `<script is:inline>` sobrescreve o skeleton
de 11 cards com os 16 do banco. **Não existe rota `DELETE` de cadeira** (só `PATCH` em
`/api/cadeiras/[id]`), então a deleção é script, como foi a dos `status`.

A #3 é inofensiva mecanicamente: `categoria` chega como texto livre em
[api/candidaturas/route.ts:39](../../app/src/app/api/candidaturas/route.ts) e nada valida contra
a lista. É só copy — mas copy que oferece nicho que não existe mais.

## ⚠️ A armadilha: o `ordem >= 8` do laço ao vivo

[index.astro:265](../../site/src/pages/index.astro) decide a legenda do card por
`s.ordem >= 8` — "8" é a fronteira entre cadeira de nicho e cadeira de projeto, e é constante
escrita à mão.

Removidas 5 cadeiras, as de nicho passam a ser 3 (ordem 0,1,2) e **as de projeto continuam em
8..15**: o laço do seed que reescreve `ordem` é só o das cadeiras de nicho
([seed.ts:18](../../app/prisma/seed.ts)) — o das cadeiras de projeto não toca em `ordem`, de
propósito ([seed.ts:49](../../app/prisma/seed.ts)). Fica um buraco em 3..7.

Por isso **nada quebra na hora**. O que fica armado:

- [gen-carteira.ts:39](../../app/scripts/gen-carteira.ts) passa a gerar `ordem: 3..10` no
  skeleton, enquanto o banco serve `8..15`. O teste em
  [cadeira-chave-siteurl.test.mjs:34](../../app/test/cadeira-chave-siteurl.test.mjs) compara o
  skeleton com `seats.ts`, **nunca com o banco** — passa verde com os dois discordando.
- A próxima cadeira de projeto criada pelo seed nasce com
  `ordem = DEFAULT_SEATS.length + criadas` = **3**, cai no `< 8` e é desenhada com a legenda de
  cadeira de nicho (`status` cru, "Ocupada · X"). Silencioso, e só aparece na tela publicada.

👉 **Conserto recomendado (2 linhas, e mata a constante):** o skeleton já sabe quem é cadeira de
projeto — são as do `{carteira.map(...)}`. Marcar esses `<li>` com um `data-projeto` e o laço
inline ler `li.dataset.projeto` em vez de comparar `s.ordem`. Some o 8, some o acoplamento por
número, e o índice do array continua sendo o que casa card com linha.

## 🚩 Decisões do Jean antes de mexer

**a) `Orçamento de obra` / OrçaObra (ordem 15) é construção — sai também?**
É cadeira de PROJETO, não do mapa de Goiânia: `em-preparacao`, `daCasa: false`, site no ar em
`orcaobra.roilabs.com.br`. "Remover tudo de construção" o alcança pela letra; o pedido parecia
falar do mapa de Goiânia. **Sugestão: fica** — o bloqueio dele é de produto, não de nicho, e
removê-lo apaga uma cadeira com site publicado. Mas é chamada sua.

**b) Os posts de blog não seguem as cadeiras.** 5 dos 9 posts são do tema, mas **4 são de
revestimento/porcelanato — o nicho que FICA**. Só
`quanto-custa-loja-materiais-construcao-google-goiania` mira o nicho que sai.
🚨 **Não deletar sem checar o GSC**: URL indexada deletada vira 404 e leva o tráfego junto, e
esse post captura demanda vizinha da cadeira que continua aberta. **Sugestão: manter os 9.**

**c) Duas frases do site ficam falsas** e não estão em nenhuma das 4 listas:
- [polo-goiania.astro:158](../../site/src/pages/polo-goiania.astro) — "As demais — outros nichos
  de material de alto padrão — seguem em curadoria." Depois da limpeza não há "demais".
- [index.astro:224](../../site/src/pages/index.astro) — a legenda "novos nichos abrem após a
  primeira cadeira faturar" continua verdadeira, mas com 3 cards de nicho ela lê diferente.

**d) 🚨 Achado de brinde: o site se contradiz sobre a cadeira que FICA.**
[polo-goiania.astro:97](../../site/src/pages/polo-goiania.astro) afirma *"A cadeira de
porcelanato de Goiânia está ocupada"*, e o mapa da home diz **"Curadoria aberta"** — porque no
banco ela é `estado: vaga, open: true`. As duas páginas são públicas e discordam. Isso já era
verdade antes deste pedido; com 3 cards em vez de 8, a contradição fica no centro da tela.
Decidir qual das duas é a verdade **antes** de publicar a limpeza.

---

# 2 — O /admin não mente. Ele mostra a régua errada — e a certa dá ZERO

O card diz `1 ocupadas · 0 em prospecção · 15 abertas · 16 cadeiras no total`.

A causa continua sendo [ocupacao.ts:12](../../app/src/lib/ocupacao.ts): `derivarOcupacao` lê a
relação `Parceiro`, não `estado`. E o banco tem, medido agora:

```
Parceiro (banco inteiro): 1
{"nome":"TapePro","estagio":"ativa","contratoEm":"2026-07-22","cadeiraId":"cmrw63puh..."}
```

**Um. Por isso 1 ocupada, e está certo** para a pergunta *"quantas cadeiras têm contrato
assinado?"*.

## 🚨 O que mudou desde o handoff anterior: existe uma TERCEIRA régua, e ela dá 0

O handoff de manhã falou em duas réguas e disse que `estado` daria **10**. Medido agora, são
**8** — e, mais importante, apareceu a terceira:

| régua | pergunta que responde | número |
|---|---|---|
| `Parceiro.contratoEm` (a que o painel usa) | quantas têm contrato assinado? | **1** |
| `estado === 'ocupada-vendavel'` | quantas têm produto no ar? | **8** |
| `decidirCheckout` — a que decide se entra dinheiro | **quantas conseguem receber um pagamento?** | **0** |

A terceira saiu da própria API de produção, não de leitura de código:

```
checkout por tipo: {"indisponivel:estado":8, "indisponivel:sem-produto":8}
com produto servido: 0        ProdutoCadeira no banco: 0
```

**`ProdutoCadeira` está VAZIA.** As 8 cadeiras marcadas `ocupada-vendavel` não têm produto, e
`decidirCheckout` devolve `indisponivel` para **16 de 16**. Nenhuma cadeira da carteira pode
receber dinheiro hoje. Casa exatamente com o que a memória já registrava
([[roihub_portfolio_nao_cobra]]) — só que agora está medido no schema, não inferido do site.

Ou seja: o `1` incomoda, mas **é o número mais generoso dos três**. Trocar a régua para `estado`
faria o painel dizer "8 ocupadas" e ficaria ainda mais longe da verdade operacional.

## ⚠️ O que NÃO fazer

**Não trocar `derivarOcupacao` por `estado`.** Isso chamaria de ocupada uma cadeira sem
contrato, e a régua do success fee depende de `Parceiro`, não de `estado` — é a mesma classe de
erro de medir a palavra em vez da permissão. `derivarOcupacao` também é o que alimenta a coluna
de ocupação em `/admin/cadeiras`; mexer nela move dois lugares.

## O conserto: o card diz QUAL pergunta responde, e ganha a terceira

Em [admin/page.tsx:194-204](../../app/src/app/admin/page.tsx), o card "Ocupação · {polo}".
Sugestão concreta, sem tocar em `derivarOcupacao`:

```
Ocupação · Goiânia
1 com contrato · 0 em prospecção · 15 sem parceiro
8 com produto no ar · 0 conseguem receber pagamento     ← a linha que falta
16 cadeiras no total
```

O terceiro número sai de `decidirCheckout` — a mesma função que a API pública já chama, então é
import, não regra nova. Enquanto ele não estiver na tela, o painel responde uma pergunta que
ninguém faz e esconde a que decide o mês.

## E o `polo`, que continua pendente do handoff anterior

`polos distintos: ["Goiânia"]` nas 16 — `polo String @default("Goiânia")` em
[schema.prisma:189](../../app/prisma/schema.prisma) e `PROJETOS_CADEIRA` nunca seta `polo`. Por
isso "16 cadeiras no total" sob um polo que tem 8. **Depois da limpeza do item 1 ele fica pior,
não melhor**: passa a ser "11 cadeiras" sob um polo que tem 3. Conserto: `polo` explícito nas
cadeiras de projeto (ex.: `'Carteira'`) + seed — e aí viram dois cards, que é o certo.

---

# O que NÃO investigar de novo (medido em 07/08)

- **Os nomes das empresas estão no ar.** As 16 legendas conferidas no HTML publicado e na API;
  skeleton e ao vivo batem. `nomeExibido` corta o `status` no `·`.
- **Não há cadeira duplicada** e `siteUrl` repetido é 0. A chave por `siteUrl` segurou o seed.
- **`daCasa` não vaza** para o HTML público.
- **Só `Revestimentos / Porcelanato` tem `aceitaCandidatura: true`** — conferido na API.
- **`Candidatura` está vazia**, então nenhuma das 5 cadeiras a remover tem lead preso a ela.
- **A `DATABASE_URL` do `app` é `roilabs_db@2.24.207.200:5443`.** A parecida
  (`roihub_db@…:5445`) é OUTRO projeto, sem tabela `Cadeira`. Não existe `.env` local — só
  `.env.example` com `CHANGE_ME`; a credencial vem do Jean.

# Comandos

```bash
# as 16 como a home as lê, com a régua de checkout junto
curl -s https://app.roilabs.com.br/api/cadeiras | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>JSON.parse(d).forEach(c=>console.log(c.ordem,'|',c.niche,'|',c.status,'|',c.estado,'|',c.checkout.tipo,c.checkout.motivo||'')))"

cd app && npm test && npx tsc --noEmit     # 18/18
cd app && npm run gen:carteira             # regerar o skeleton APÓS mexer em seats.ts
cd site && npx astro build                 # 🚨 `npm run build` SUBMETE ao IndexNow

# ler/escrever no banco: script temporário DENTRO de app/ (o scratchpad não resolve @prisma/client)
# DATABASE_URL='...' node --import tsx .tmp-x.mts   e apagar o arquivo depois
```

# Armadilhas que continuam valendo

- **🚨 `git push` em `main` É DEPLOY** (EasyPanel). Sem branch, sem PR. Publicou em ~30s hoje.
- **🚨 `npm run build` no `site`/`site-goiania` publica** no Bing via `postbuild`. Use
  `npx astro build`.
- **🚨 O seed NÃO deleta e NÃO escreve `status`.** Remover da lista não remove do banco;
  `status` é curadoria do `/admin`.
- **🚨 API em 200 ≠ a TELA mudou.** Vale para tudo aqui.
- **A lista de nichos vive em 3 arquivos + o banco.** Mudar um só deixa o site mentindo, e
  nenhum teste pega — o que existe compara o skeleton com `seats.ts`, nunca com o banco.
- **O `ordem >= 8` é constante escrita à mão** em [index.astro:265](../../site/src/pages/index.astro).

# Ordem sugerida

1. Jean decide: **(a)** OrçaObra sai ou fica · **(b)** os 9 posts ficam · **(d)** a cadeira de
   porcelanato é "ocupada" ou "curadoria aberta" — as duas páginas têm de dizer o mesmo.
2. Matar o `ordem >= 8` primeiro (`data-projeto`), **antes** de mexer nas cadeiras. Feito
   depois, ele já entrou como landmine.
3. Remover as 5: `seats.ts` + o array à mão do `index.astro` + os `<option>` + **script de
   delete no banco**. Depois `gen:carteira`, `npm test`, `npx astro build`, push.
4. Conferir o HTML publicado card a card (o laço do `curl` acima) — 11 cadeiras, não 16.
5. Só então o painel: a terceira linha (`0 conseguem receber pagamento`) e o `polo` das 8.
   Deploy próprio, porque muda o agrupamento.
