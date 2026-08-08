// Runnable check da máquina de estado de Assinatura.estado (014, T013, data-model.md).
// Cobre: ativa→inadimplente (1ª falha), inadimplente→inadimplente (janela não reseta),
// inadimplente→ativa (sucesso), inadimplente→cancelada (cron, cancelPreapproval ANTES do
// update — FR-009).
import assert from 'node:assert/strict';
import { decidirRenovacao, janelaEsgotada, cancelarAssinatura } from '../src/lib/assinaturas.ts';

// ── ativa → inadimplente (1ª falha da sequência) ────────────────────────────
{
  const d = decidirRenovacao({ estado: 'ativa', recorrencia: 'mensal' }, 'rejected', false);
  assert.equal(d.acao, 'falha');
  assert.equal(d.novoEstado, 'inadimplente', 'ativa + falha → inadimplente');
  assert.equal(d.setarJanela, true, '1ª falha da sequência seta janelaFalhaDesde');
}

// ── inadimplente → inadimplente (falha seguinte NÃO reseta a janela) ───────
{
  const d = decidirRenovacao({ estado: 'inadimplente', recorrencia: 'mensal' }, 'rejected', false);
  assert.equal(d.acao, 'falha');
  assert.equal(d.novoEstado, 'inadimplente', 'já inadimplente + falha → continua inadimplente');
  assert.equal(d.setarJanela, false, 'janela é fixa a partir da 1ª falha, não desliza');
}

// ── inadimplente → ativa (sucesso limpa a janela e recalcula proximaCobranca) ─
{
  const agora = new Date('2026-08-08T00:00:00Z');
  const d = decidirRenovacao({ estado: 'inadimplente', recorrencia: 'mensal' }, 'approved', false, agora);
  assert.equal(d.acao, 'sucesso');
  assert.equal(d.novoEstado, 'ativa');
  assert.equal(d.limparJanela, true, 'sucesso vindo de inadimplente limpa janelaFalhaDesde');
  assert.equal(d.proximaCobranca.toISOString(), '2026-09-08T00:00:00.000Z', 'mensal soma 1 mês');
}

// ── recorrência anual soma 12 meses ──────────────────────────────────────────
{
  const agora = new Date('2026-08-08T00:00:00Z');
  const d = decidirRenovacao({ estado: 'ativa', recorrencia: 'anual' }, 'approved', false, agora);
  assert.equal(d.proximaCobranca.toISOString(), '2027-08-08T00:00:00.000Z', 'anual soma 12 meses');
}

// ── sucesso vindo de ativa não "limpa" nada que já não existia ──────────────
{
  const d = decidirRenovacao({ estado: 'ativa', recorrencia: 'mensal' }, 'approved', false);
  assert.equal(d.limparJanela, false);
}

// ── janelaEsgotada (FR-009) — o cron decide, o webhook nunca cancela ────────
{
  const desde = new Date('2026-08-01T00:00:00Z');
  assert.equal(janelaEsgotada(desde, 7, new Date('2026-08-05T00:00:00Z')), false, 'dentro da janela → não esgotou');
  assert.equal(janelaEsgotada(desde, 7, new Date('2026-08-08T00:00:00Z')), true, 'no limite → esgotou');
  assert.equal(janelaEsgotada(desde, 7, new Date('2026-08-10T00:00:00Z')), true, 'além da janela → esgotou');
}

// ── inadimplente → cancelada: cancelPreapproval chamado ANTES do update ─────
// (data-model.md — "a ordem importa: se a chamada ao MP falhar, o cron não marca cancelada")
{
  const chamadas = [];
  const fakeAssinatura = { id: 'a1', itemPedidoId: 'i1', mpPreapprovalId: 'pre-1' };

  // Caminho feliz: cancelar no MP funciona → grava no banco DEPOIS
  const fakeDb = {
    assinatura: { update: (args) => { chamadas.push(['db.assinatura.update', args]); return 'op-assinatura'; } },
    itemPedido: { update: (args) => { chamadas.push(['db.itemPedido.update', args]); return 'op-item'; } },
    $transaction: async (ops) => { chamadas.push(['$transaction', ops.length]); },
  };
  const fakeCancelar = async (id) => { chamadas.push(['cancelar', id]); };
  await cancelarAssinatura(fakeAssinatura, { cancelar: fakeCancelar, db: fakeDb });
  assert.equal(chamadas[0][0], 'cancelar', 'MP é chamado primeiro');
  assert.equal(chamadas[0][1], 'pre-1');
  assert.ok(chamadas.slice(1).some(([op]) => op === '$transaction'), 'DB só é tocado depois do MP responder');
}

// Caminho de falha: MP recusa cancelar → NADA é gravado no banco (cron tenta de novo amanhã)
{
  let dbTocado = false;
  const fakeAssinatura = { id: 'a1', itemPedidoId: 'i1', mpPreapprovalId: 'pre-1' };
  const fakeDb = {
    assinatura: { update: () => { dbTocado = true; } },
    itemPedido: { update: () => { dbTocado = true; } },
    $transaction: async () => { dbTocado = true; },
  };
  const fakeCancelarFalha = async () => { throw new Error('MP indisponível'); };
  await assert.rejects(() => cancelarAssinatura(fakeAssinatura, { cancelar: fakeCancelarFalha, db: fakeDb }));
  assert.equal(dbTocado, false, 'MP falhou → estado local NUNCA muda (nunca "cancelada" aqui e "cobrando" lá)');
}

console.log('[OK] assinatura-maquina-estado: ativa↔inadimplente, janela fixa, janelaEsgotada (FR-009), ordem cancelPreapproval→update');
