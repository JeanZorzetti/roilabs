// Runnable check de FR-011 (014, T019): token válido cancela só a própria assinatura; token
// inválido/de outra assinatura → 404 (mesma resposta, não vaza existência); cancelar já
// cancelada é idempotente (200, sem alterar nada). `decidirCancelamento` é a decisão pura
// que a rota `api/assinaturas/cancelar` usa depois do `findUnique({ where: { cancelToken } })`.
import assert from 'node:assert/strict';
import { decidirCancelamento } from '../src/lib/assinaturas.ts';

// ── token não encontrado (errado ou de outra assinatura) → 404 ─────────────
{
  const r = decidirCancelamento(null);
  assert.equal(r.httpStatus, 404, 'FR-011: token que não bate em nada → 404');
  assert.equal(r.noop, true, '404 nunca altera linha nenhuma');
}

// ── token válido, assinatura ativa → 200, executa o cancelamento ───────────
{
  const r = decidirCancelamento({ estado: 'ativa' });
  assert.equal(r.httpStatus, 200);
  assert.equal(r.noop, false, 'assinatura ativa: cancela de verdade');
}

// ── token válido, assinatura inadimplente → também cancela normalmente ─────
{
  const r = decidirCancelamento({ estado: 'inadimplente' });
  assert.equal(r.httpStatus, 200);
  assert.equal(r.noop, false);
}

// ── já cancelada → 200 idempotente, não é erro, não repete a ação ──────────
{
  const r = decidirCancelamento({ estado: 'cancelada' });
  assert.equal(r.httpStatus, 200, 'cancelar 2x não é erro');
  assert.equal(r.noop, true, 'idempotente: não chama cancelPreapproval de novo nem regrava canceladaEm');
}

console.log('[OK] assinatura-cancel-token: FR-011 (404 sem vazar existência), idempotência de estado=cancelada');
