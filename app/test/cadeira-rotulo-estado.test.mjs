// O /admin/cadeiras mostrava "Aberta" em cadeira OCUPADA (medido 18/08/2026: Atma, Polaris,
// Estetia e Maná, todas com `estado` diferente de 'vaga'). A tela renderizava
// `derivarOcupacao(parceiros)` — a régua da 007, que responde "existe parceiro EXTERNO com
// contrato?". Como as cadeiras da carteira são `daCasa`, elas nunca têm Parceiro, e a régua
// devolvia 'aberta' para todas. A única verde era a Tapepro, o único parceiro externo do mapa.
//
// O defeito não é o checkbox nem o texto de `status`: é a tela ter lido a régua ERRADA. Este
// teste tranca a separação, que nenhum tipo declara (as duas funções devolvem string):
//
//   exibir ocupação de cadeira  → `estado`            (012)
//   apurar success fee          → `derivarOcupacao`   (007)
//
// ⚠️ Não trocar isto por um teste do dashboard (/admin): LÁ o uso de `derivarOcupacao` é
// deliberado e está documentado em admin/page.tsx — é a régua do fee, e é a régua certa.
import assert from 'node:assert/strict';
import { derivarOcupacao, rotuloEstado, ESTADO_LABEL, ESTADO_COLOR } from '../src/lib/ocupacao.ts';
import { ESTADOS } from '../src/lib/carteira/produto.ts';
import { DEFAULT_SEATS, PROJETOS_CADEIRA } from '../src/lib/seats.ts';

// 1 — O BUG. Cadeira da casa, ocupada e vendável, sem nenhum Parceiro: a régua velha diz
// 'aberta'. É o caso exato da Atma. Se algum dia derivarOcupacao passar a acertar isto, a
// premissa deste módulo mudou e alguém precisa reler a separação acima.
assert.equal(derivarOcupacao([]), 'aberta', 'premissa da 007 mudou: sem parceiro deixou de ser "aberta"');
assert.notEqual(
  rotuloEstado('ocupada-vendavel').toLowerCase(),
  'aberta',
  'REGRESSÃO: cadeira ocupada voltou a ser rotulada "Aberta" no /admin/cadeiras',
);

// 2 — Todo estado que a máquina aceita tem rótulo e cor. Estado novo em ESTADOS sem entrada
// aqui vazaria o valor cru do banco na tela (ex.: "ocupada-sem-produto").
for (const e of ESTADOS) {
  assert.ok(ESTADO_LABEL[e], `estado '${e}' sem rótulo de exibição em ESTADO_LABEL`);
  assert.ok(ESTADO_COLOR[e], `estado '${e}' sem cor em ESTADO_COLOR`);
}

// 3 — Nenhum rótulo pode dizer que a cadeira VENDE. `estado` é a marca da curadoria; quem
// sabe se o dinheiro entra é `decidirCheckout` (produto + gateway ligado), e em 07/08 ele
// dava 0 em 16. Um rótulo "vendendo" fabricaria receita na tela.
for (const [estado, label] of Object.entries(ESTADO_LABEL)) {
  assert.ok(!/vendendo|à venda|faturando/i.test(label), `rótulo de '${estado}' afirma venda ativa: "${label}"`);
}

// 4 — Todo `estado` do seed é rotulável. Pega o caso em que alguém inventa um estado novo em
// seats.ts sem passar por ESTADOS — aí a tela mostraria o valor cru sem ninguém perceber.
for (const s of [...DEFAULT_SEATS, ...PROJETOS_CADEIRA]) {
  assert.ok(
    ESTADO_LABEL[s.estado],
    `seed usa estado '${s.estado}' (${s.niche}) que a tela não sabe exibir`,
  );
}

console.log('✓ cadeira-rotulo-estado: exibição lê `estado`, success fee lê `derivarOcupacao`');
