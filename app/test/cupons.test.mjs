// Runnable check for lib/cupons.ts: avaliarCupom (regras de dinheiro, sem I/O).
// Run: node --import tsx test/cupons.test.mjs
import assert from 'node:assert/strict';
import { avaliarCupom } from '../src/lib/cupons.ts';

const DIA = 24 * 60 * 60 * 1000;
const now = Date.now();

function cupom(overrides = {}) {
  return {
    tipo: 'percentual',
    valor: 10,
    validadeInicio: null,
    validadeFim: null,
    minimo: null,
    ativo: true,
    ...overrides,
  };
}

// ── percentual ────────────────────────────────────────────────────────────────
{
  const r = avaliarCupom(cupom({ tipo: 'percentual', valor: 10 }), 1000);
  assert.equal(r.ok, true, 'percentual válido');
  assert.equal(r.desconto, 100, '10% de 1000 = 100');
}

// ── fixo ──────────────────────────────────────────────────────────────────────
{
  const r = avaliarCupom(cupom({ tipo: 'fixo', valor: 50 }), 1000);
  assert.equal(r.ok, true, 'fixo válido');
  assert.equal(r.desconto, 50, 'fixo = 50 flat');
}

// ── cupom inexistente ─────────────────────────────────────────────────────────
{
  const r = avaliarCupom(null, 1000);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'invalido', 'null => invalido');
}

// ── inativo ───────────────────────────────────────────────────────────────────
{
  const r = avaliarCupom(cupom({ ativo: false }), 1000);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'inativo');
}

// ── janela de validade: início no futuro ─────────────────────────────────────
{
  const r = avaliarCupom(cupom({ validadeInicio: now + DIA }), 1000);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'expirado', 'início no futuro => expirado');
}

// ── janela de validade: fim no passado ───────────────────────────────────────
{
  const r = avaliarCupom(cupom({ validadeFim: now - DIA }), 1000);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'expirado', 'fim no passado => expirado');
}

// ── janela de validade: dentro do intervalo ──────────────────────────────────
{
  const r = avaliarCupom(cupom({ validadeInicio: now - DIA, validadeFim: now + DIA }), 1000);
  assert.equal(r.ok, true, 'dentro da janela => válido');
}

// ── mínimo não atingido ───────────────────────────────────────────────────────
{
  const r = avaliarCupom(cupom({ minimo: 500 }), 400);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'minimo');
}

// ── mínimo atingido exatamente ────────────────────────────────────────────────
{
  const r = avaliarCupom(cupom({ minimo: 500 }), 500);
  assert.equal(r.ok, true, 'subtotal == mínimo passa');
}

// ── clamp: desconto nunca negativo ────────────────────────────────────────────
{
  const r = avaliarCupom(cupom({ tipo: 'fixo', valor: -20 }), 1000);
  assert.equal(r.ok, true);
  assert.equal(r.desconto, 0, 'fixo negativo clampa em 0');
}

// ── clamp: desconto nunca maior que o subtotal (percentual 100) ──────────────
{
  const r = avaliarCupom(cupom({ tipo: 'percentual', valor: 100 }), 250);
  assert.equal(r.ok, true);
  assert.equal(r.desconto, 250, 'percentual 100% clampa no subtotal');
}

// ── clamp: fixo maior que o subtotal ──────────────────────────────────────────
{
  const r = avaliarCupom(cupom({ tipo: 'fixo', valor: 9999 }), 250);
  assert.equal(r.ok, true);
  assert.equal(r.desconto, 250, 'fixo > subtotal clampa no subtotal');
}

console.log('cupons.test.mjs: all assertions passed');
