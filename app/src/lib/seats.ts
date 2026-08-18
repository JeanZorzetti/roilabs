// Default Goiânia chair map — SEED + display fallback. The DB is the source of truth:
// the site fetches /api/cadeiras live in the browser and overwrites its static skeleton,
// so /admin edits reflect without a rebuild. This list seeds the DB and mirrors the
// site's no-JS fallback in site/src/pages/index.astro; live data wins when JS runs.
//
// ⚠️ 07/08/2026 (decisão do Jean): os 5 nichos de construção em ESTUDO saíram do mapa —
// `Materiais de construção`, `Esquadrias / Vidraçaria`, `Iluminação / Elétrica`,
// `Marcenaria sob medida` e `Pisos / Deck externo`. Nenhum tinha parceiro, produto ou
// candidatura. Restam 3 cadeiras de nicho, das quais só `Revestimentos / Porcelanato` está
// em curadoria aberta. 🚨 O SEED NÃO DELETA: tirar daqui não tira do banco, e a home lê o
// banco ao vivo — a remoção no banco foi por script (ver handoff-limpeza-construcao.md).
//
// `estado` é o campo que MÁQUINA lê (vaga | em-preparacao | ocupada-sem-produto |
// ocupada-vendavel). `status` continua sendo texto de exibição e nenhuma decisão o lê.
export const DEFAULT_SEATS = [
  // CORRIGIDA (Jean, 08/08): DA CASA. O porcelanato é vendido pelo carrinho da própria ROI
  // Labs (`modoCobranca: 'roilabs'` em site-goiania/src/data/lojas.ts) — não há parceiro, e
  // receita própria nunca entra na régua do success fee. `estado: 'vaga'` não contradiz:
  // a cadeira segue em curadoria aberta, e vira `daCasa: false` no dia que um parceiro a
  // ocupar, exatamente como a `Fitas adesivas` fez com a Tapepro.
  { niche: 'Revestimentos / Porcelanato', status: 'Curadoria aberta', open: true, estado: 'vaga', daCasa: true, exibirDaCasa: false },
  // Primeira cadeira ocupada: Tapepro (fitas adesivas personalizadas, B2B). open:false = fora
  // de curadoria (já preenchida). O link/estado visual "ocupada" vive no site (presentational).
  // daCasa:false — Tapepro é parceiro externo (spec 011), e a venda dela GERA success fee.
  { niche: 'Fitas adesivas', status: 'Ocupada · Tapepro', open: false, estado: 'ocupada-vendavel', daCasa: false, exibirDaCasa: false },
  // CORRIGIDA (Jean, 08/08): a Atma é DA CASA — mesmo erro que o `vertice` teve e que já
  // foi corrigido abaixo. O comentário anterior afirmava duas coisas falsas: "parceiro
  // externo" (o site é subdomínio `atma.roilabs.com.br` e o repo é da própria ROI Labs) e
  // "gateway já ligado" (`CredencialGateway` tem ZERO linhas em produção, conferido 08/08).
  { niche: 'Ortodontia / Alinhadores', status: 'Ocupada · Atma Aligner', open: false, estado: 'ocupada-vendavel', daCasa: true, exibirDaCasa: false },
  // 015 (Jean, 18/08): Maná Moda Social entra em `ordem: 3` — a faixa 3..7 ficou VAGA depois
  // da remoção dos 5 nichos de construção em 07/08 (comentário acima), então a Maná cai
  // sozinha no lugar certo sem reordenar nada. `daCasa: false`: é parceiro externo e a venda
  // gera success fee (`lojas.ts`: `pagoA: 'Maná Moda'`, `split.comissaoPct: 0.1`), mesma
  // leitura da Tapepro. `estado: 'em-preparacao'` até o checkout fechar (015 fase B) —
  // vira `ocupada-vendavel` só nesse dia, nunca antes.
  { niche: 'Moda social masculina', status: 'Em preparação · Maná Moda', open: false, estado: 'em-preparacao', daCasa: false, exibirDaCasa: false, siteUrl: 'https://mana.roilabs.com.br/' },
] as const;

/**
 * 012 (T051/T052/T066) — as cadeiras de PROJETO da carteira.
 *
 * ⚠️ SÓ ENTRA AQUI O QUE A SPEC NOMEIA. A lista completa dos 35 vive no **roihub**
 * (`roihub/scripts/gateways.mjs`, que lê o GitHub), que não é este repositório. Inventar
 * slug ou URL de projeto para "completar 35" fabricaria a carteira — e a chave é a URL DO
 * SITE, não o repo. As 27 restantes entram quando a lista do roihub for exportada para cá;
 * o schema já as comporta (FR-007), que é o que esta fase precisava garantir.
 *
 * `siteUrl`/`repoUrl` ficam `null` onde não foram apurados: nulo é "não sei", e é honesto.
 * Preenchê-los com palpite quebraria FR-011 (dedupe por repo) sem ninguém perceber.
 * ✅ 07/08: os das 9 abaixo saíram de `roihub/data/projects.json` (a lista que o roihub monta
 * do GitHub), não de palpite. Enquanto eram nulos, `reposDuplicados()` não tinha o que
 * comparar e FR-011 valia por vacuidade.
 *
 * ⚠️ `daCasa` é FAIL-CLOSED aqui: na dúvida, `true`. daCasa errado para `false` faz a ROI
 * Labs cobrar success fee de si mesma e INFLAR a "receita da carteira" — o mesmo defeito
 * dos 20 pagamentos de teste da Atma, e o que FR-010 proíbe. Errado para `true` só
 * sub-reporta, que é recuperável. A curadoria definitiva é decisão do Jean (ver handoff).
 *
 * `exibirDaCasa` NÃO deriva de `daCasa`: a lista de exceções é DADO (FR-010a), e são
 * exatamente `sirius`, `meridian` e `orion`.
 */
export const PROJETOS_CADEIRA = [
  // ── Fase 1: Mercado Pago (4 cadeiras) ──────────────────────────────────────
  // T052 CORRIGIDA (Jean, 08/08): `atma` é DA CASA, pela mesma leitura que corrigiu o
  // `vertice` — e classificá-la como parceiro externo a colocava na régua do success fee,
  // fazendo a ROI Labs cobrar fee de si mesma e INFLAR a receita da carteira (FR-010).
  // Vale a regra fail-closed do bloco acima: na dúvida, `true`.
  { slug: 'atma', niche: 'Ortodontia / Alinhadores', status: 'Ocupada · Atma Aligner', estado: 'ocupada-vendavel', gateway: 'mercadopago', daCasa: true, exibirDaCasa: false, siteUrl: 'https://atma.roilabs.com.br/', repoUrl: 'https://github.com/JeanZorzetti/Atma' },
  // ⚠️ `niche` aqui é RÓTULO DE EXIBIÇÃO, não chave (o seed casa por `siteUrl`). Cada um
  // saiu do que o próprio site diz de si, lido no ar em 07/08 — 5 dos 8 descreviam produto
  // que não existe mais (o `polarisia` não tinha uma palavra sobre imóvel na página inteira).
  // Trocar rótulo aqui é edição de texto: NÃO cria cadeira nova, mas exige rodar o seed.
  // ⚠️ 07/08: o trecho DEPOIS do `·` virou o nome exibido na home (`nomeExibido`). O banco
  // ainda diz "Ocupada · Polaris" — o seed NÃO escreve `status` (é curadoria do /admin), então
  // este valor só alimenta o skeleton. Corrigir no /admin, senão a home pisca "Polaris".
  { slug: 'polarisia', niche: 'Orquestração de agentes IA', status: 'Ocupada · Polaris IA', estado: 'ocupada-vendavel', gateway: 'mercadopago', daCasa: true, exibirDaCasa: false, siteUrl: 'https://polarisia.com.br/', repoUrl: 'https://github.com/JeanZorzetti/sofia-ia' },
  { slug: 'estetiacrm', niche: 'CRM / Estética', status: 'Ocupada · Estetia CRM', estado: 'ocupada-vendavel', gateway: 'mercadopago', daCasa: true, exibirDaCasa: false, siteUrl: 'https://estetiacrm.com.br/', repoUrl: 'https://github.com/JeanZorzetti/estetia' },
  // T052 CORRIGIDA (Jean, 07/08, fim do dia): `vertice` é DA CASA. A leitura anterior o
  // classificou como parceiro externo e o colocou na régua do success fee — que é o erro que
  // FR-010 proíbe (a ROI Labs cobrando fee de si mesma e INFLANDO a receita da carteira).
  // `exibirDaCasa` continua false: a lista de exceções é DADO e são só sirius/meridian/orion.
  { slug: 'vertice', niche: 'Onboarding de clientes', status: 'Ocupada · Vértice', estado: 'ocupada-vendavel', gateway: 'mercadopago', daCasa: true, exibirDaCasa: false, siteUrl: 'https://vertice.roilabs.com.br/', repoUrl: 'https://github.com/JeanZorzetti/vertice' },
  // ── Fase 1: Stripe (3 cadeiras) ────────────────────────────────────────────
  // sirius/orion: daCasa E exibirDaCasa — as exceções nomeadas em FR-010a.
  // Solar era 1 de 5 segmentos que o próprio site lista (corretores, solar, agências,
  // consultores, representantes) — o rótulo antigo estreitava a cadeira a um quinto dela.
  { slug: 'sirius', niche: 'CRM de vendas', status: 'Ocupada · Sirius CRM', estado: 'ocupada-vendavel', gateway: 'stripe', daCasa: true, exibirDaCasa: true, siteUrl: 'https://siriuscrm.com.br/', repoUrl: 'https://github.com/JeanZorzetti/sirius' },
  { slug: 'context', niche: 'Ferramentas de dev', status: 'Ocupada · Context Keeper', estado: 'ocupada-vendavel', gateway: 'stripe', daCasa: true, exibirDaCasa: false, siteUrl: 'https://context.nimblabs.com/', repoUrl: 'https://github.com/JeanZorzetti/context-keeper' },
  // ⚠️ mesma nota do `polarisia`: banco tem "Ocupada · Orion", corrigir no /admin.
  { slug: 'orion', niche: 'ERP / Gestão empresarial', status: 'Ocupada · Orion ERP', estado: 'ocupada-vendavel', gateway: 'stripe', daCasa: true, exibirDaCasa: true, siteUrl: 'https://orion.roilabs.com.br/', repoUrl: 'https://github.com/JeanZorzetti/orion-nova-ui' },
  // ── Fora da fase 1, mas nomeadas pela spec ─────────────────────────────────
  // meridian: NÃO está entre as 7 da fase 1 nem entre as 8 do SEED de nicho — ele só existe
  // como cadeira por causa de FR-010a. Sem esta linha, T052 escreveria numa linha inexistente.
  // ⚠️ O rótulo era `Beleza / Estética` e nunca descreveu o produto: o Meridian sempre foi o
  // site de um app de FINANÇAS pessoais ("See every dollar"). A "beleza" era do laboratório
  // de front-end para a vaga da FitNext — polimento visual, não o setor. Não houve pivô;
  // o rótulo nasceu de ler o apelido do projeto como se fosse o nicho dele.
  { slug: 'meridian', niche: 'Finanças pessoais', status: 'Em preparação · Meridian', estado: 'em-preparacao', gateway: null, daCasa: true, exibirDaCasa: true, siteUrl: 'https://meridian.roilabs.com.br/', repoUrl: 'https://github.com/JeanZorzetti/meridian' },
  // orcaobra: saiu da fase 1 por bloqueio de PRODUTO, não de fiação ("acho ele um produto
  // ruim do jeito que está"). Ligar checkout aqui venderia algo que não deveria estar à venda.
  // ⚠️ O repo NÃO se chama `orcaobra`: é `reforma-maestro`. Derivar repoUrl do slug erraria aqui.
  // T052 CORRIGIDA (Jean, 07/08, fim do dia): `orcaobra` é DA CASA — mesma correção do
  // `vertice`. O bloqueio dele segue sendo de PRODUTO (`em-preparacao`), não de curadoria.
  { slug: 'orcaobra', niche: 'Orçamento de obra', status: 'Em preparação · OrçaObra', estado: 'em-preparacao', gateway: null, daCasa: true, exibirDaCasa: false, siteUrl: 'https://orcaobra.roilabs.com.br/', repoUrl: 'https://github.com/JeanZorzetti/reforma-maestro' },
] as const;

/**
 * ⚠️ T069 — hosts que servem TUDO em 200 (shell de SPA). "200" nestes NÃO é caminho de
 * cobrança: eles devolvem 200 para qualquer rota, inclusive as que não existem. Apurar
 * estado de cadeira lendo o status HTTP deles produz ocupada-vendável falsa.
 */
export const HOSTS_SPA_TUDO_200 = ['tapevision', 'potencialarquitetado', 'pathfinder'] as const;
