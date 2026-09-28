// Runnable check for lib/precos-cadeira.ts: o que o parceiro paga por uma cadeira da ROI Labs. Sem I/O.
// Run: node --import tsx test/precos-cadeira.test.mjs
import assert from 'node:assert/strict';
import { NICHOS } from '../src/lib/precificacao.ts';
import { ANUIDADE, DOMINIO_ANO, ENTRADA_ANO, simular } from '../src/lib/precos-cadeira.ts';

const nicho = (id) => NICHOS.find((n) => n.id === id);
const base = {
  pedidosMes: 0, ticket: 0, recompra: 0, distribuidor: false,
  assinaturasMes: 0, mensalidade: 0, consultasMes: 0, valorConsulta: 0,
};

// ── entrada: anuidade + domínio, sem setup ─────────────────────────────────────────────
{
  assert.equal(ANUIDADE, 2640);
  assert.equal(DOMINIO_ANO, 50);
  assert.equal(ENTRADA_ANO, 2690);
  const zero = simular({ ...base, nicho: nicho('moda') });
  assert.equal(zero.comissaoAno, 0, 'vendeu zero, comissão zero');
  assert.equal(zero.totalAno, 2690, 'vendeu zero, fica só a entrada');
  assert.equal(zero.pctDaVenda, null);
}

// ── percentual: mistura 1ª compra e recompra pela fração informada ────────────────────
{
  // moda 15/10, 30 pedidos de R$ 200, 20% recompra: 24×30 + 6×20 = 840/mês
  const r = simular({ ...base, nicho: nicho('moda'), pedidosMes: 30, ticket: 200, recompra: 0.2 });
  assert.equal(r.comissaoMes, 840);
  assert.equal(r.comissaoAno, 10080);
  assert.equal(r.totalAno, 12770);
  assert.equal(r.vendasAno, 72000);
  assert.deepEqual(r.avisos, []);
}
{
  // piso de R$ 5: 15% de R$ 20 = R$ 3
  const r = simular({ ...base, nicho: nicho('moda'), pedidosMes: 10, ticket: 20 });
  assert.equal(r.comissaoMes, 50);
  assert.ok(r.avisos.some((a) => a.includes('piso')));
}
{
  // acima do corte: aviso de 2/3
  const r = simular({ ...base, nicho: nicho('casa'), pedidosMes: 1, ticket: 3000 });
  assert.equal(r.comissaoMes, 1500 * 0.12 + 1500 * 0.08);
  assert.ok(r.avisos.some((a) => a.includes('2/3')));
}

// ── SaaS: 20% nas 12 primeiras mensalidades; no ano 1 toda assinatura está nelas ─────
{
  // 2 novas/mês a R$ 100: 12º mês = 24 assinaturas × 100 × 20% = 480; ano = 2 × 78 × 100 × 20%
  const r = simular({ ...base, nicho: nicho('saas'), assinaturasMes: 2, mensalidade: 100 });
  assert.equal(r.comissaoMes, 480);
  assert.equal(r.comissaoAno, 3120);
  assert.equal(r.vendasAno, 15600);
}

// ── clínica: valor fixo por consulta, fora da faixa avisa ─────────────────────────────
{
  const r = simular({ ...base, nicho: nicho('clinicas'), consultasMes: 10, valorConsulta: 200 });
  assert.equal(r.comissaoMes, 2000);
  assert.equal(r.pctDaVenda, null, 'sem % sobre tratamento');
  const fora = simular({ ...base, nicho: nicho('clinicas'), consultasMes: 1, valorConsulta: 400 });
  assert.ok(fora.avisos.some((a) => a.includes('Fora da faixa')));
}

// ── entrada inválida não vira NaN ────────────────────────────────────────────────────
{
  const r = simular({ ...base, nicho: nicho('moda'), pedidosMes: NaN, ticket: -5, recompra: 7 });
  assert.equal(r.comissaoMes, 0);
  assert.ok(Number.isFinite(r.totalAno));
}

console.log('precos-cadeira: ok');
