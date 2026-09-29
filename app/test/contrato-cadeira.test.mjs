// Runnable check for lib/contrato-cadeira.ts: o contrato que nasce da proposta de cadeira. Sem I/O.
// Run: node --import tsx test/contrato-cadeira.test.mjs
import assert from 'node:assert/strict';
import { NICHOS } from '../src/lib/precificacao.ts';
import { montarPropostaCadeira } from '../src/lib/precos-cadeira.ts';
import { cpfValido, hashDoc, montarContratoCadeira, tituloPadrao } from '../src/lib/contrato-cadeira.ts';

const nicho = (id) => NICHOS.find((n) => n.id === id);
const base = {
  pedidosMes: 40, ticket: 200, recompra: 0.3, distribuidor: false,
  assinaturasMes: 5, mensalidade: 300, consultasMes: 20, valorConsulta: 200,
};
const agora = new Date('2026-09-29T12:00:00Z');
const proposta = (id, extra = {}) => ({
  slug: 'Abc123_-',
  doc: montarPropostaCadeira({ ...base, nicho: nicho(id), ...extra }, 'Loja Exemplo', agora),
});
// Dados fictícios: o repo é público.
const parte = (name, document = '12.345.678/0001-90') => ({
  name, document, address: 'Rua Exemplo, 100, Goiânia/GO', representative: 'Fulano de Tal, CPF 000.000.000-00', email: '',
});
const input = (over = {}) => ({
  titulo: '', contratante: parte('Loja Exemplo Ltda'), contratada: parte('ROI Labs Ltda', '98.765.432/0001-10'),
  inicio: '2026-10-01', foro: 'Goiânia/GO', pagamento: 'Pix à vista', extra: '', ...over,
});
const texto = (doc) => JSON.stringify(doc.clausulas);
const clausula = (doc, id) => doc.clausulas.find((c) => c.id === id);

// ── completo: nada pendente, termos copiados da proposta, sem estimativa ─────────────────
{
  const p = proposta('moda');
  const c = montarContratoCadeira(input(), p, agora);
  assert.deepEqual(c.pendencias, []);
  assert.equal(c.titulo, tituloPadrao(p.doc.nicho.nome));
  assert.deepEqual(c.entrada, p.doc.entrada);
  assert.equal(c.entradaTotal, p.doc.entradaTotal);
  assert.deepEqual(c.comissao, p.doc.comissao);
  assert.equal(c.anexo.fases.length, p.doc.entregaveis.fases.length);
  assert.ok(texto(c).includes(p.doc.comissao.resumo), 'a comissão sai da proposta');
  for (const cond of p.doc.condicoes) assert.ok(texto(c).includes(cond), `condição da proposta: ${cond}`);
  assert.ok(!('estimativa' in c) && !('ritmo' in c), 'projeção não entra no contrato');
  assert.ok(!texto(c).includes(String(p.doc.estimativa.totalAno)), 'nenhum número da estimativa no texto');
  assert.ok(texto(c).includes('01/10/2026') && texto(c).includes('01/10/2027'), 'vigência de 12 meses');
  assert.ok(texto(c).includes('pedido pago na loja'), 'venda originada do modelo percentual');
  assert.ok(clausula(c, 'responsabilidade'), 'PJ tem teto de responsabilidade');
  assert.ok(texto(c).includes('comarca de Goiânia/GO'));
  assert.ok(texto(c).includes('não é devolvida'), 'FR-012: anuidade não volta');
  assert.ok(texto(c).includes('transfere para a CONTRATANTE') && texto(c).includes('domínio'), 'FR-013: domínio vai ao parceiro');
  assert.ok(!clausula(c, 'especificas'), 'sem texto extra, sem a cláusula');
}

// ── os outros dois modelos ──────────────────────────────────────────────────────────────
{
  const saas = montarContratoCadeira(input(), proposta('saas'), agora);
  assert.ok(texto(saas).includes('assinatura contratada'));
  assert.ok(!texto(saas).includes('frete'), 'regra de pedido não vale para SaaS');
  const clinica = montarContratoCadeira(input(), proposta('clinicas'), agora);
  assert.ok(texto(clinica).includes('consulta agendada'));
  assert.ok(texto(clinica).includes('Informação clínica'), 'nicho de saúde não recebe dado clínico');
  assert.ok(!texto(montarContratoCadeira(input(), proposta('moda'), agora)).includes('Informação clínica'));
}

// ── pendências ──────────────────────────────────────────────────────────────────────────
{
  const p = proposta('moda');
  const c = montarContratoCadeira(
    input({ contratante: { ...parte('Loja'), document: '' }, foro: ' ', pagamento: 'Cartão em [parcelas]' }), p, agora);
  assert.ok(c.pendencias.includes('CNPJ ou CPF (contratante)'));
  assert.ok(c.pendencias.includes('Foro'));
  assert.ok(c.pendencias.some((x) => x.includes('[parcelas]')));
  assert.ok(texto(c).includes('[a preencher]'), 'foro vazio sai como marcador');

  // Proposta anterior a 29/09, sem entregáveis: o escopo trava o aceite.
  const antiga = { slug: p.slug, doc: { ...p.doc, entregaveis: undefined } };
  const semAnexo = montarContratoCadeira(input(), antiga, agora);
  assert.equal(semAnexo.anexo, null);
  assert.ok(semAnexo.pendencias.some((x) => x.startsWith('Entregáveis')));
}

// ── pessoa física: sem teto, foro do domicílio, sem representante ──────────────────────
{
  const pf = montarContratoCadeira(
    input({ contratante: { ...parte('Maria Exemplo', '529.982.247-25'), representative: '' }, foro: '' }), proposta('moda'), agora);
  assert.equal(pf.pessoaFisica, true);
  assert.deepEqual(pf.pendencias, [], 'PF não precisa de representante nem de foro');
  assert.ok(!clausula(pf, 'responsabilidade'), 'consumidor: sem limite de responsabilidade');
  assert.ok(texto(pf).includes('domicílio da CONTRATANTE'));
}

// ── sem início: conta do aceite; extra entra na cláusula própria ────────────────────────
{
  const c = montarContratoCadeira(input({ inicio: '', extra: '- Reunião mensal de resultado' }), proposta('moda'), agora);
  assert.ok(texto(c).includes('contados da data do aceite'));
  assert.deepEqual(clausula(c, 'especificas').body, [['Reunião mensal de resultado']]);
}

// ── hash: estável quando o jsonb reordena as chaves, muda quando o texto muda ───────────
{
  const c = montarContratoCadeira(input(), proposta('moda'), agora);
  const invertido = Object.fromEntries(Object.entries(c).reverse());
  assert.equal(hashDoc(invertido), hashDoc(c));
  assert.equal(hashDoc(JSON.parse(JSON.stringify(c))), hashDoc(c));
  assert.notEqual(hashDoc({ ...c, titulo: c.titulo + ' ' }), hashDoc(c));
  assert.match(hashDoc(c), /^[0-9a-f]{64}$/);
}

// ── CPF ─────────────────────────────────────────────────────────────────────────────────
{
  assert.equal(cpfValido('529.982.247-25'), true);
  assert.equal(cpfValido('52998224725'), true);
  assert.equal(cpfValido('529.982.247-26'), false);
  assert.equal(cpfValido('111.111.111-11'), false);
  assert.equal(cpfValido('1234'), false);
}

console.log('contrato-cadeira: ok');
