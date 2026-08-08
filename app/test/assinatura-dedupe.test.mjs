// Runnable check de FR-006 (014, T006): mesmo mpPaymentId processado 2x no ramo de
// renovação não cria 2 CicloCobranca. `decidirRenovacao` é a decisão pura que o webhook usa
// antes de gravar — o `jaProcessado` (já existe CicloCobranca com este mpPaymentId) é
// exatamente o que a checagem `findUnique` no banco produz.
import assert from 'node:assert/strict';
import { decidirRenovacao } from '../src/lib/assinaturas.ts';

const ativa = { estado: 'ativa', recorrencia: 'mensal' };

// ── 1ª notificação: processa normalmente ────────────────────────────────────
{
  const d = decidirRenovacao(ativa, 'approved', false);
  assert.equal(d.acao, 'sucesso', 'primeira notificação aprovada → grava sucesso');
}

// ── mesma notificação reprocessada (retry do MP) → ignora, não duplica ─────
{
  const d = decidirRenovacao(ativa, 'approved', true);
  assert.equal(d.acao, 'ignorar', 'FR-006: mpPaymentId já processado → ignorar, nunca duplicar');
}

// ── dedupe vale também no caminho de falha ──────────────────────────────────
{
  const d = decidirRenovacao(ativa, 'rejected', true);
  assert.equal(d.acao, 'ignorar', 'FR-006: dedupe também no ramo de falha');
}

console.log('[OK] assinatura-dedupe: FR-006 — mesmo mpPaymentId nunca duplica CicloCobranca');
