// Runnable check for lib/precificacao.ts: tabela de success fee por nicho (016). Sem I/O.
// Run: node --import tsx test/precificacao.test.mjs
import assert from 'node:assert/strict';
import {
  NICHOS,
  NICHOS_PERCENTUAIS,
  TAXA_MINIMA,
  CORTE_B2B,
  calcularComissao,
  encaixarPorMargem,
  nichoSugerido,
  lerNumeroBR,
} from '../src/lib/precificacao.ts';

const nicho = (id) => NICHOS_PERCENTUAIS.find((n) => n.id === id);

// ── a tabela em si: ids únicos, taxas em [mínimo, 1], aquisição ≥ recorrência ──────────
{
  assert.equal(new Set(NICHOS.map((n) => n.id)).size, NICHOS.length, 'id duplicado');
  for (const n of NICHOS_PERCENTUAIS) {
    assert.ok(n.aquisicao <= 1 && n.recorrencia >= TAXA_MINIMA, `${n.id}: taxa fora da faixa`);
    assert.ok(n.aquisicao >= n.recorrencia, `${n.id}: recompra não pode custar mais que a 1ª compra`);
  }
  assert.equal(nicho('b2b').corte, CORTE_B2B, 'B2B corta em R$ 5.000');
}

// ── os exemplos do relatório batem ─────────────────────────────────────────────────────
{
  // blusa de R$ 200: R$ 30 na 1ª compra, R$ 20 na recompra
  assert.equal(calcularComissao(nicho('moda'), 'aquisicao', 200).comissao, 30);
  assert.equal(calcularComissao(nicho('moda'), 'recorrencia', 200).comissao, 20);

  // móveis de R$ 4.000 a 12%: 1.500 × 12% + 2.500 × 8% = 180 + 200 = R$ 380 (9,5%)
  const m = calcularComissao(nicho('casa'), 'aquisicao', 4000);
  assert.equal(m.ateCorte, 180);
  assert.equal(m.acimaCorte, 200);
  assert.equal(m.comissao, 380);
  assert.equal(m.pctEfetivo, 0.095);

  // papelaria de R$ 25 a 12% daria R$ 3 → piso de R$ 5
  const p = calcularComissao(nicho('papelaria'), 'aquisicao', 25);
  assert.equal(p.pisoAplicado, true);
  assert.equal(p.comissao, 5);
  assert.equal(p.fornecedorFica, 20);
}

// ── 2/3 da taxa acima do corte, arredondado ao ponto: 18→12, 15→10, 12→8, 8→5 ──────────
{
  const acima = (id) => calcularComissao(nicho(id), 'aquisicao', 1).taxaAcimaCorte;
  assert.equal(acima('beleza'), 0.12);
  assert.equal(acima('moda'), 0.1);
  assert.equal(acima('casa'), 0.08);
  assert.equal(acima('eletronicos'), 0.05);
  // recorrência de 5%: 2/3 furaria o mínimo — fica em 5%
  assert.equal(calcularComissao(nicho('eletronicos'), 'recorrencia', 1).taxaAcimaCorte, TAXA_MINIMA);
}

// ── distribuidor: −3 pontos na aquisição, −2 na recorrência, nunca abaixo de 5% ────────
{
  assert.equal(calcularComissao(nicho('moda'), 'aquisicao', 100, true).taxaAplicada, 0.12);
  assert.equal(calcularComissao(nicho('moda'), 'recorrencia', 100, true).taxaAplicada, 0.08);
  assert.equal(calcularComissao(nicho('eletronicos'), 'recorrencia', 100, true).taxaAplicada, TAXA_MINIMA);
}

// ── B2B: corte em R$ 5.000, não em R$ 1.500 ───────────────────────────────────────────
{
  const r = calcularComissao(nicho('b2b'), 'aquisicao', 6000);
  assert.equal(r.ateCorte, 750, '5.000 × 15%');
  assert.equal(r.acimaCorte, 100, '1.000 × 10%');
  assert.equal(r.comissao, 850);
}

// ── entradas ruins não viram dinheiro ────────────────────────────────────────────────
{
  for (const v of [0, -10, NaN, Infinity]) {
    const r = calcularComissao(nicho('moda'), 'aquisicao', v);
    assert.equal(r.comissao, 0, `valor ${v}`);
    assert.equal(r.pisoAplicado, false);
  }
  // piso nunca passa do valor do pedido
  assert.equal(calcularComissao(nicho('papelaria'), 'aquisicao', 3).comissao, 3);
}

// ── régua de margem: cada degrau da tabela cabe na sua própria margem mínima ──────────
{
  const faixa = (m, f) => encaixarPorMargem(m, f).sugestao;
  assert.deepEqual(faixa(0.7), { faixa: 'premium', aquisicao: 0.18, recorrencia: 0.1 });
  assert.equal(faixa(0.55).faixa, 'premium');
  assert.equal(faixa(0.45).recorrencia, 0.1);
  assert.equal(faixa(0.45).aquisicao, 0.15);
  assert.equal(faixa(0.35).faixa, 'intermediaria');
  assert.equal(faixa(0.3).recorrencia, 0.06);
  assert.equal(faixa(0.25).recorrencia, 0.05);
  // 20% de margem: 1/3 da folga dá 4,7% < mínimo de 5% → nenhum percentual fecha
  assert.equal(faixa(0.2), null);
  assert.equal(faixa(0.1), null);
  // frete pesado derruba a faixa: 35% de margem com 10% de frete não sustenta 8% nem 6%
  assert.equal(faixa(0.35, 0.1).recorrencia, 0.05);
  // a recorrência sugerida nunca passa de 1/3 da folga
  for (let m = 0; m <= 1; m += 0.01) {
    for (const f of [0, 0.05, 0.1]) {
      const e = encaixarPorMargem(m, f);
      if (e.sugestao) assert.ok(e.sugestao.recorrencia <= e.recorrenciaMaxima + 1e-9, `m=${m} f=${f}`);
    }
  }
  // exemplos da tabela "Margem x comissão" do relatório (1/3 da folga, arredondado)
  assert.equal(Math.round(encaixarPorMargem(0.4).recorrenciaMaxima * 100), 11);
  assert.equal(Math.round(encaixarPorMargem(0.7).recorrenciaMaxima * 100), 20);
}

// ── sugestão pelo nicho gravado no parceiro ───────────────────────────────────────────
{
  const id = (t) => nichoSugerido(t)?.id ?? null;
  assert.equal(id('Fitas adesivas'), 'b2b');
  assert.equal(id('CRM / Estética'), 'saas', 'especial vem antes: CRM de estética é software');
  assert.equal(id('Clínica odontológica'), 'clinicas');
  assert.equal(id('Ortodontia / Alinhadores'), 'saude');
  assert.equal(id('Moda social masculina'), 'moda');
  assert.equal(id('Revestimentos / Porcelanato'), 'construcao');
  assert.equal(id('ERP / Gestão empresarial'), 'saas');
  assert.equal(id('Orquestração de agentes IA'), null);
  assert.equal(id('Finanças pessoais'), null);
  assert.equal(id('Competição'), null, 'radical casa com o INÍCIO da palavra, não no meio');
}

// ── leitura de número digitado em pt-BR ───────────────────────────────────────────────
{
  assert.equal(lerNumeroBR('1.500,50'), 1500.5);
  assert.equal(lerNumeroBR('R$ 1.500'), 1500);
  assert.equal(lerNumeroBR('1500,5'), 1500.5);
  assert.equal(lerNumeroBR('1500.5'), 1500.5);
  assert.equal(lerNumeroBR('45'), 45);
  assert.equal(lerNumeroBR('45%'), 45);
  assert.ok(Number.isNaN(lerNumeroBR('')));
  assert.ok(Number.isNaN(lerNumeroBR('abc')));
  assert.ok(Number.isNaN(lerNumeroBR('-5')));
}

process.stdout.write('precificacao: ok\n');
