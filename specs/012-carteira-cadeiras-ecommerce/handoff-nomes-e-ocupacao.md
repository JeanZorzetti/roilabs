# Handoff — 2 perguntas do Jean sobre a home fundida (07/08/2026)

> Arquivo NOVO. Não confundir com [handoff.md](./handoff.md) (histórico da feature) nem com
> [handoff-proxima-sessao.md](./handoff-proxima-sessao.md) (os 3 itens, **fechados** — seed
> aplicado em produção, deploy no ar, `main` em `75906c8`).

**Estado de partida, medido em 07/08 e não lembrado:** 16 cadeiras no `roilabs_db`, os 5
rótulos novos no ar, `0 novas` no seed (zero duplicata), `npm test` 18/18.

As duas perguntas têm **causas diferentes** e uma delas **não é bug**. Nenhuma das duas foi
causada pelo trabalho de hoje — as duas já eram verdade antes da fusão, só ficaram visíveis.

| # | pergunta | causa | é bug? |
|---|---|---|---|
| 1 | "Por que não tem os nomes das empresas?" | o nome está no banco e o card **joga fora** na hora de desenhar | ✅ sim, e é 1 linha |
| 2 | "Por que o admin só conta 1 cadeira ocupada?" | o painel conta **contrato assinado**, não `estado` | ⚠️ o número está certo para a pergunta que ele faz — **erradas são 2 outras coisas** |

---

# 1 — Os nomes: eles EXISTEM no banco, o card é que os descarta

Não falta dado. `Cadeira.status` guarda o nome, e `/api/cadeiras` já o serve como `status`:

```
ordem | status (lido do roilabs_db em 07/08)
  6   | "Ocupada · Tapepro"          ← este aparece na home
  7   | "Ocupada · Atma Aligner"     ← este aparece na home
  8   | "Ocupada · Polaris"
  9   | "Ocupada · Estetia CRM"
 10   | "Ocupada · Vértice"
 11   | "Ocupada · Sirius CRM"
 12   | "Ocupada · Context Keeper"
 13   | "Ocupada · Orion"
 14   | "Em preparação · Meridian"
 15   | "Em preparação · OrçaObra"
```

**A assimetria que o Jean viu é exatamente essa:** os cards 6 e 7 são cadeiras de NICHO e
renderizam `status` — por isso mostram "Tapepro" e "Atma Aligner". Os cards 8–15 são cadeiras
de PROJETO e renderizam `ESTADO[estado] · rotulo` — "No ar · Parceiro". O `status` deles é
lido, chega no navegador e é **descartado**.

Onde, nos dois lugares que precisam casar:

- [site/src/pages/index.astro](../../site/src/pages/index.astro) — o `{carteira.map(...)}` do
  skeleton (estático) **e** o `const texto = s.ordem >= 8 ? ... : s.status` do
  `<script is:inline>` (ao vivo). Mudar só um faz a legenda piscar no carregamento.
- [app/scripts/gen-carteira.ts](../../app/scripts/gen-carteira.ts) — o skeleton não carrega
  `status` hoje. Tem de passar a carregar, e depois `cd app && npm run gen:carteira`.

## ⚠️ Antes de escrever: 2 nomes da lista do Jean NÃO batem com o banco

| Jean pediu | banco tem | ação |
|---|---|---|
| Polaris IA | `Ocupada · Polaris` | editar o `status` |
| Orion ERP | `Ocupada · Orion` | editar o `status` |
| Estetia CRM · Vértice · Sirius CRM · Context Keeper | idênticos | nada |

Editar onde: o `status` é **curadoria do `/admin`** — o seed NÃO o sobrescreve de propósito
(está comentado em [app/prisma/seed.ts](../../app/prisma/seed.ts)). Então ou se edita no
`/admin` (campo de texto, instantâneo), ou se muda `status` em
[app/src/lib/seats.ts](../../app/src/lib/seats.ts) **e** se libera o seed a escrevê-lo — o que
apagaria qualquer curadoria manual futura. **Recomendação: `/admin`.**

## 🚩 A decisão que é do Jean, não de engenharia: o que fazer com "Parceiro / Da casa"

Hoje o card tem 2 segmentos: `No ar · Parceiro`. O nome quer entrar num espaço já ocupado.

| opção | como fica | o que se perde |
|---|---|---|
| **A** | `No ar · Polaris IA` | some o sinal casa/parceiro que **FR-010a existe para curar** |
| **B** | `No ar · Polaris IA · Parceiro` | 3 segmentos num card pequeno; polui |
| **C** | `No ar · Sirius CRM · Da casa` só quando `rotulo==='casa'`; senão `No ar · Polaris IA` | nada visível, mas a ausência do selo passa a **significar** "parceiro" |

👉 Sugestão: **C**. É a que preserva FR-010a e não polui os 6 cards de parceiro.

## 🚨 O efeito colateral editorial que o nome cria — vale decidir junto

`rotulo` hoje diz **"Parceiro"** para `polarisia`, `estetiacrm` e `context`. As três são
`daCasa: true` com `exibirDaCasa: false` — é curadoria deliberada do Jean (FR-010a), e o
`daCasa` cru nunca vaza (conferido: só aparece em comentário no HTML).

Só que **sem nome ninguém liga os pontos; com nome, liga.** "Polaris IA" e "Context Keeper"
são reconhecidamente produtos da ROI Labs, e o card vai dizer "Parceiro" ao lado do nome. Isso
não é vazamento de dado — é uma afirmação que fica **verificável e falsa** para quem conhece o
portfólio. Antes de publicar os nomes, o Jean decide se `exibirDaCasa` desses três continua
`false`. É decisão de curadoria, e o campo já é dado justamente para ela ser decidida, não
derivada. Ver [[roihub_portfolio_nao_cobra]] no mesmo espírito.

---

# 2 — O admin não está errado. Ele responde OUTRA pergunta

O card diz **`1 ocupadas · 0 em prospecção · 15 abertas · 16 cadeiras no total`**.

A causa está em [app/src/lib/ocupacao.ts:12](../../app/src/lib/ocupacao.ts) — o painel
([app/src/app/admin/page.tsx:69](../../app/src/app/admin/page.tsx)) chama:

```ts
export function derivarOcupacao(parceiros) {
  if (parceiros.some((p) => p.contratoEm !== null)) return 'ocupada';
  if (parceiros.some((p) => p.estagio === 'sondagem' || p.estagio === 'ativa')) return 'prospeccao';
  return 'aberta';
}
```

Ele **não lê `estado`**. Lê a relação `Parceiro`. E o banco tem, medido:

```
total de Parceiro no roilabs_db: 1   (TapePro, estagio=ativa, contratoEm=SIM)
```

**Um. No banco inteiro.** Por isso 1 ocupada. O número está correto para a pergunta *"quantas
cadeiras têm contrato assinado?"*. `estado` responde outra: *"quantas têm produto vendável no
ar?"* — e são **10**. Duas réguas, dois números, os dois verdadeiros. É o mesmo par
`status` × `estado` que já mordeu, agora num **terceiro eixo**: `parceiros`.

⚠️ **Não "consertar" trocando `derivarOcupacao` por `estado`.** Isso passaria a chamar de
ocupada uma cadeira sem contrato — e a régua do success fee depende de `Parceiro`, não de
`estado`. O conserto certo é o painel dizer QUAL pergunta responde.

## O que está REALMENTE errado ali — 3 coisas, e nenhuma é o "1"

**a) 🚨 As 8 cadeiras de projeto estão no polo Goiânia, e não são de Goiânia.**
`polo String @default("Goiânia")` em [schema.prisma:189](../../app/prisma/schema.prisma), e
`PROJETOS_CADEIRA` nunca seta `polo`. Medido: **`polos distintos: ["Goiânia"]`** nas 16. Por
isso o card soma "16 cadeiras no total" sob um polo que tem 8. A home já diz o contrário na
copy nova ("as cadeiras que a ROI Labs já opera **fora dele**"). Conserto: `polo` explícito em
`PROJETOS_CADEIRA` (ex.: `'Carteira'`) + seed. **Isso muda o agrupamento do painel** —
passariam a ser dois cards de ocupação, que é o comportamento certo.

**b) As 8 cadeiras de projeto têm ZERO `Parceiro`.** Nenhuma tem contrato, nenhuma tem
credencial de gateway, e é por isso que o success fee não tem de quem cobrar. Não é defeito de
UI: é o estado real do negócio, e casa com o que a memória já registrava — SDK escrito, um
ligado, zero faturado. O painel está sendo **honesto** e ninguém tinha percebido.

**c) O rótulo do card mente por omissão.** "Ocupação · Goiânia" com 16 cadeiras vira, depois de
(a), "Ocupação · Goiânia" com 8. Enquanto (a) não for feito, o card mistura duas populações.

---

# O que NÃO investigar de novo (já medido em 07/08)

- **Não há cadeira duplicada.** `seeded 9 cadeiras de projeto (0 novas)`, total 16, `siteUrl`
  repetido: **0**. A chave por `siteUrl` funcionou.
- **`daCasa` não vaza** para o HTML público — só aparece dentro de um comentário do script.
- **O skeleton e a API concordam nos 16** (rodado o laço JS do deploy contra o HTML publicado).
- **A `DATABASE_URL` do `app` é `roilabs_db@2.24.207.200:5443`.** A que parece óbvia
  (`roihub_db@…:5445`) é **outro projeto** — tem `hub_tasks`/`seo_projects` e nenhuma tabela
  `Cadeira`. Rodar seed lá cria o schema da 012 no banco errado.

# Comandos

```bash
# a carteira como a home a lê — inclui o `status` que hoje é descartado
curl -s https://app.roilabs.com.br/api/cadeiras | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>JSON.parse(d).forEach(c=>console.log(c.ordem,'|',c.niche,'|',c.status,'|',c.rotulo)))"

cd app && npm test && npx tsc --noEmit     # 18/18
cd app && npm run gen:carteira             # regerar o skeleton APÓS mexer em seats.ts
cd site && npx astro build                 # 🚨 `npm run build` SUBMETE ao IndexNow
```

# Armadilhas que continuam valendo

- **🚨 `git push` em `main` É DEPLOY** (EasyPanel). Sem branch, sem PR.
- **🚨 `npm run build` no `site`/`site-goiania` publica** no Bing via `postbuild`.
- **🚨 API em 200 ≠ a TELA mudou.** Vale para este handoff inteiro: editar o `status` no
  `/admin` só aparece na home depois de o card passar a renderizá-lo.
- **Dois lugares para a legenda do card:** o skeleton gerado E o laço `is:inline`. Mudar um só
  faz a legenda piscar.
- **`status` é curadoria do `/admin`** — o seed não o escreve. Se alguém ligar isso, a edição
  manual do Jean passa a ser apagada a cada seed.

# Ordem sugerida

1. Jean decide: **opção A/B/C** da legenda + se `exibirDaCasa` dos três muda.
2. Editar `Ocupada · Polaris` → `Polaris IA` e `Ocupada · Orion` → `Orion ERP` no `/admin`.
3. Renderizar o nome (skeleton + inline + `gen-carteira.ts`), `npm test`, `npx astro build`,
   push.
4. Só então o `polo` das 8 (item 2a) — mexe no agrupamento do painel e merece um deploy próprio.
