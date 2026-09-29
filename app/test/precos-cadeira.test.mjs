// Runnable check for lib/precos-cadeira.ts: o que o parceiro paga por uma cadeira da ROI Labs. Sem I/O.
// Run: node --import tsx test/precos-cadeira.test.mjs
import assert from 'node:assert/strict';
import { NICHOS } from '../src/lib/precificacao.ts';
import {
  ANUIDADE,
  DOMINIO_ANO,
  ENTRADA_ANO,
  REGRA_COMISSAO_PEDIDO,
  REGRAS_NEGOCIACAO,
  brl,
  montarPropostaCadeira,
  simular,
} from '../src/lib/precos-cadeira.ts';

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

// ── 019: documento da proposta guardada ──────────────────────────────────────────────
{
  const agora = new Date('2026-09-28T15:00:00Z');
  // Tudo que é orientação ao operador: nunca pode aparecer no documento do cliente.
  const interno = (n) => [n.regra, n.porque, 'CFO/CFM', REGRAS_NEGOCIACAO[0], 'Premium', 'Padrão', 'Margem fina'];
  const semInterno = (doc, n) => {
    const texto = JSON.stringify(doc);
    for (const t of interno(n)) if (t) assert.ok(!texto.includes(t), `vazou no doc: ${t}`);
  };

  // percentual: mesmos números do simulador, validade +15 dias, condição do piso presente
  const moda = nicho('moda');
  const doc = montarPropostaCadeira(
    { ...base, nicho: moda, pedidosMes: 30, ticket: 200, recompra: 0.2 },
    '  Loja Teste  ',
    agora,
  );
  assert.equal(doc.paraQuem, 'Loja Teste', 'para quem aparado');
  assert.equal(doc.validaAte, '2026-10-13T15:00:00.000Z');
  assert.equal(doc.entradaTotal, 2690);
  assert.deepEqual(doc.entrada.map((i) => i.item), ['Setup', 'Anuidade da cadeira', 'Domínio próprio (Hostinger)']);
  assert.equal(doc.estimativa.comissaoMes, 840);
  assert.equal(doc.estimativa.totalAno, 12770);
  assert.equal(doc.comissao.resumo, '15% na 1ª compra · 10% na recompra');
  assert.ok(doc.condicoes.includes(REGRA_COMISSAO_PEDIDO));
  semInterno(doc, moda);

  // distribuidor: as taxas saem ajustadas (15−3, 10−2)
  const dist = montarPropostaCadeira({ ...base, nicho: moda, pedidosMes: 1, ticket: 100, distribuidor: true }, 'D', agora);
  assert.equal(dist.comissao.resumo, '12% na 1ª compra · 8% na recompra');

  // ritmo zero: sem estimativa, nunca "R$ 0,00 de comissão"
  assert.equal(montarPropostaCadeira({ ...base, nicho: moda }, 'Z', agora).estimativa, null);

  // SaaS: 12º mês, sem condição do piso por pedido
  const saas = nicho('saas');
  const s = montarPropostaCadeira({ ...base, nicho: saas, assinaturasMes: 2, mensalidade: 100 }, 'S', agora);
  assert.equal(s.estimativa.comissaoMes, 480);
  assert.equal(s.estimativa.mesReferencia, 'no 12º mês');
  assert.ok(!s.condicoes.includes(REGRA_COMISSAO_PEDIDO));
  semInterno(s, saas);

  // clínica: valor digitado no resumo, sem vendas nem %, sem o aviso do CFO/CFM
  const clin = nicho('clinicas');
  const c = montarPropostaCadeira({ ...base, nicho: clin, consultasMes: 10, valorConsulta: 200 }, 'C', agora);
  assert.equal(c.comissao.resumo, `${brl(200)} por consulta comparecida`);
  assert.equal(c.estimativa.vendasAno, null);
  assert.equal(c.estimativa.pctDaVenda, null);
  semInterno(c, clin);
}

console.log('precos-cadeira: ok');
