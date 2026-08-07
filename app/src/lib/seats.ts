// Default Goiânia chair map — SEED + display fallback. The DB is the source of truth:
// the site fetches /api/cadeiras live in the browser and overwrites its static skeleton,
// so /admin edits reflect without a rebuild. This list seeds the DB and mirrors the
// site's no-JS fallback in site/src/pages/index.astro; live data wins when JS runs.
//
// ⚠️ 012: NÃO confundir os dois "8". Aqui há 8 cadeiras de NICHO (o mapa do marketplace de
// Goiânia, 2 ocupadas). A fase 1 da 012 tem 7 PROJETOS vendáveis — outra contagem, de outra
// coisa, que por acidente ficou perto. Os projetos vivem em PROJETOS_CADEIRA, abaixo.
//
// `estado` é o campo que MÁQUINA lê (vaga | em-preparacao | ocupada-sem-produto |
// ocupada-vendavel). `status` continua sendo texto de exibição e nenhuma decisão o lê.
export const DEFAULT_SEATS = [
  { niche: 'Revestimentos / Porcelanato', status: 'Curadoria aberta', open: true, estado: 'vaga', daCasa: false, exibirDaCasa: false },
  { niche: 'Materiais de construção', status: 'Em estudo', open: false, estado: 'vaga', daCasa: false, exibirDaCasa: false },
  { niche: 'Esquadrias / Vidraçaria', status: 'Em estudo', open: false, estado: 'vaga', daCasa: false, exibirDaCasa: false },
  { niche: 'Iluminação / Elétrica', status: 'Em estudo', open: false, estado: 'vaga', daCasa: false, exibirDaCasa: false },
  { niche: 'Marcenaria sob medida', status: 'Em estudo', open: false, estado: 'vaga', daCasa: false, exibirDaCasa: false },
  { niche: 'Pisos / Deck externo', status: 'Em estudo', open: false, estado: 'vaga', daCasa: false, exibirDaCasa: false },
  // Primeira cadeira ocupada: Tapepro (fitas adesivas personalizadas, B2B). open:false = fora
  // de curadoria (já preenchida). O link/estado visual "ocupada" vive no site (presentational).
  // daCasa:false — Tapepro é parceiro externo (spec 011), e a venda dela GERA success fee.
  { niche: 'Fitas adesivas', status: 'Ocupada · Tapepro', open: false, estado: 'ocupada-vendavel', daCasa: false, exibirDaCasa: false },
  // Atma Aligner: parceiro externo, gateway já ligado (o único da carteira em 07/08).
  { niche: 'Ortodontia / Alinhadores', status: 'Ocupada · Atma Aligner', open: false, estado: 'ocupada-vendavel', daCasa: false, exibirDaCasa: false },
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
  { slug: 'atma', niche: 'Ortodontia / Alinhadores', status: 'Ocupada · Atma Aligner', estado: 'ocupada-vendavel', gateway: 'mercadopago', daCasa: false, exibirDaCasa: false, siteUrl: 'https://atma.roilabs.com.br/', repoUrl: 'https://github.com/JeanZorzetti/Atma' },
  // ⚠️ `niche` aqui é RÓTULO DE EXIBIÇÃO, não chave (o seed casa por `siteUrl`). Cada um
  // saiu do que o próprio site diz de si, lido no ar em 07/08 — 5 dos 8 descreviam produto
  // que não existe mais (o `polarisia` não tinha uma palavra sobre imóvel na página inteira).
  // Trocar rótulo aqui é edição de texto: NÃO cria cadeira nova, mas exige rodar o seed.
  { slug: 'polarisia', niche: 'Orquestração de agentes IA', status: 'Ocupada · Polaris', estado: 'ocupada-vendavel', gateway: 'mercadopago', daCasa: true, exibirDaCasa: false, siteUrl: 'https://polarisia.com.br/', repoUrl: 'https://github.com/JeanZorzetti/sofia-ia' },
  { slug: 'estetiacrm', niche: 'CRM / Estética', status: 'Ocupada · Estetia CRM', estado: 'ocupada-vendavel', gateway: 'mercadopago', daCasa: true, exibirDaCasa: false, siteUrl: 'https://estetiacrm.com.br/', repoUrl: 'https://github.com/JeanZorzetti/estetia' },
  // T052 RESOLVIDA (Jean, 07/08): `vertice` é parceiro externo → daCasa:false. Sai do
  // fail-closed e ENTRA na régua do success fee.
  { slug: 'vertice', niche: 'Onboarding de clientes', status: 'Ocupada · Vértice', estado: 'ocupada-vendavel', gateway: 'mercadopago', daCasa: false, exibirDaCasa: false, siteUrl: 'https://vertice.roilabs.com.br/', repoUrl: 'https://github.com/JeanZorzetti/vertice' },
  // ── Fase 1: Stripe (3 cadeiras) ────────────────────────────────────────────
  // sirius/orion: daCasa E exibirDaCasa — as exceções nomeadas em FR-010a.
  // Solar era 1 de 5 segmentos que o próprio site lista (corretores, solar, agências,
  // consultores, representantes) — o rótulo antigo estreitava a cadeira a um quinto dela.
  { slug: 'sirius', niche: 'CRM de vendas', status: 'Ocupada · Sirius CRM', estado: 'ocupada-vendavel', gateway: 'stripe', daCasa: true, exibirDaCasa: true, siteUrl: 'https://siriuscrm.com.br/', repoUrl: 'https://github.com/JeanZorzetti/sirius' },
  { slug: 'context', niche: 'Ferramentas de dev', status: 'Ocupada · Context Keeper', estado: 'ocupada-vendavel', gateway: 'stripe', daCasa: true, exibirDaCasa: false, siteUrl: 'https://context.nimblabs.com/', repoUrl: 'https://github.com/JeanZorzetti/context-keeper' },
  { slug: 'orion', niche: 'ERP / Gestão empresarial', status: 'Ocupada · Orion', estado: 'ocupada-vendavel', gateway: 'stripe', daCasa: true, exibirDaCasa: true, siteUrl: 'https://orion.roilabs.com.br/', repoUrl: 'https://github.com/JeanZorzetti/orion-nova-ui' },
  // ── Fora da fase 1, mas nomeadas pela spec ─────────────────────────────────
  // meridian: NÃO está entre as 7 da fase 1 nem entre as 8 do SEED de nicho — ele só existe
  // como cadeira por causa de FR-010a. Sem esta linha, T052 escreveria numa linha inexistente.
  // ⚠️ O rótulo era `Beleza / Estética` (o laboratório para a vaga da FitNext). O produto
  // PIVOTOU (Jean, 07/08): meridian.roilabs.com.br serve "See every dollar", um motor de
  // finanças pessoais. O subdomínio está certo; a memória é que estava velha.
  { slug: 'meridian', niche: 'Finanças pessoais', status: 'Em preparação · Meridian', estado: 'em-preparacao', gateway: null, daCasa: true, exibirDaCasa: true, siteUrl: 'https://meridian.roilabs.com.br/', repoUrl: 'https://github.com/JeanZorzetti/meridian' },
  // orcaobra: saiu da fase 1 por bloqueio de PRODUTO, não de fiação ("acho ele um produto
  // ruim do jeito que está"). Ligar checkout aqui venderia algo que não deveria estar à venda.
  // ⚠️ O repo NÃO se chama `orcaobra`: é `reforma-maestro`. Derivar repoUrl do slug erraria aqui.
  // T052 RESOLVIDA (Jean, 07/08): parceiro externo → daCasa:false. O bloqueio dele segue
  // sendo de PRODUTO (`em-preparacao`), que é o que impede a venda — não a curadoria.
  { slug: 'orcaobra', niche: 'Orçamento de obra', status: 'Em preparação · OrçaObra', estado: 'em-preparacao', gateway: null, daCasa: false, exibirDaCasa: false, siteUrl: 'https://orcaobra.roilabs.com.br/', repoUrl: 'https://github.com/JeanZorzetti/reforma-maestro' },
] as const;

/**
 * ⚠️ T069 — hosts que servem TUDO em 200 (shell de SPA). "200" nestes NÃO é caminho de
 * cobrança: eles devolvem 200 para qualquer rota, inclusive as que não existem. Apurar
 * estado de cadeira lendo o status HTTP deles produz ocupada-vendável falsa.
 */
export const HOSTS_SPA_TUDO_200 = ['tapevision', 'potencialarquitetado', 'pathfinder'] as const;
