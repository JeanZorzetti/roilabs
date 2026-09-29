// Runnable check for lib/projecao.ts: ritmo esperado de venda pela demanda de busca (017). Sem I/O.
// Run: node --import tsx test/projecao.test.mjs
import assert from 'node:assert/strict';
import { NICHOS } from '../src/lib/precificacao.ts';
import {
  CENARIOS,
  FUNIS,
  UNIDADES,
  limparTermos,
  validarTermos,
  projetar,
  arredondarVendas,
  formatarVendas,
  erroDataForSEO,
  urlSimulador,
  lerPonteSimulador,
} from '../src/lib/projecao.ts';

const perto = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ''} esperado ${b}, veio ${a}`);
const serie = (v) => Array.from({ length: 12 }, (_, i) => v + i);
const termo = (t, volume, dificuldade, mensal = volume == null ? null : serie(volume)) => ({ termo: t, volume, mensal, dificuldade });

// ── SC-002: todo nicho da Precificação tem funil, com fonte e data em cada degrau ─────
{
  const DEGRAUS_POR_MODELO = { percentual: 1, mensalidade: 2, consulta: 3 };
  for (const n of NICHOS) {
    const f = FUNIS[n.id];
    assert.ok(f, `${n.id}: sem funil`);
    assert.equal(f.nichoId, n.id);
    assert.equal(f.unidade, UNIDADES[n.modelo], `${n.id}: unidade não segue o modelo`);
    assert.equal(f.degraus.length, DEGRAUS_POR_MODELO[n.modelo], `${n.id}: degraus`);
    for (const d of f.degraus) {
      assert.ok(d?.fonte?.trim(), `${n.id}: degrau sem fonte`);
      assert.ok(d.data?.trim(), `${n.id}: degrau sem data`);
      for (const c of CENARIOS) assert.ok(d.taxa[c] > 0 && d.taxa[c] < 1, `${n.id}/${c}: taxa fora de (0, 1)`);
      assert.ok(d.taxa.conservador <= d.taxa.base && d.taxa.base <= d.taxa.otimista, `${n.id}: cenários fora de ordem`);
    }
  }
  console.log('ok funis (SC-002)');
}

// ── entrada: limpeza e validação antes de pagar a consulta ───────────────────────────
{
  const { termos, removidos } = limparTermos(['  Fita Gomada ', '', '   ', 'fita gomada', 'FITA  GOMÁDA', 'caixa  de papelão']);
  assert.deepEqual(termos, ['Fita Gomada', 'caixa de papelão'], 'mantém a 1ª ocorrência, apara e colapsa espaço');
  assert.equal(removidos, 2, 'só as duplicadas contam como removidas, não as vazias');

  const regra = (lista) => validarTermos(lista)?.regra ?? null;
  assert.equal(regra([]), 'vazia');
  assert.equal(regra(Array.from({ length: 201 }, (_, i) => `termo ${i}`)), 'limite');
  assert.equal(regra(['fita', 'a'.repeat(81)]), 'caracteres');
  assert.equal(regra(['um dois tres quatro cinco seis sete oito nove dez onze']), 'palavras');
  assert.equal(regra(['fita 🎁']), 'caractere');
  const erro = validarTermos(['fita', 'a'.repeat(81)]);
  assert.equal(erro.termo, 'a'.repeat(81), 'nomeia o termo');
  assert.match(erro.mensagem, /81 caracteres/);
  assert.match(erro.mensagem, /80/);
  // 200 termos de 80 caracteres, com hífen, apóstrofo e acento, passam
  const ok = Array.from({ length: 200 }, (_, i) => `pão-d'água ${i} `.padEnd(80, 'x'));
  assert.equal(ok[0].length, 80);
  assert.equal(validarTermos(ok), null);
  console.log('ok entrada');
}

// ── a conta: casos de referência do quickstart §1 (SC-003) ───────────────────────────
{
  const ref = [termo('fita gomada', 10000, 5)];
  const moda = projetar(ref, 'moda');

  // base → posição 5 → CTR 0,14 × 0,3% + 0,86 × 2,5% = 2,192%
  const b = moda.base;
  assert.equal(b.termos[0].posicao, 5);
  perto(b.termos[0].ctr, 0.02192, 'ctr base');
  perto(b.cliquesEstaveis, 219.2, 'cliques base');
  perto(b.vendasEstaveis, 2.192, 'vendas base');
  perto(b.porMes.reduce((s, v) => s + v, 0) / b.vendasEstaveis, 9, 'rampa base');
  perto(b.mediaAno1, 1.644, 'média base');
  assert.equal(b.porMes.length, 12);
  assert.equal(b.porMes[0], 0, 'mês 1 é zero');
  assert.equal(b.porMes[5], b.vendasEstaveis, 'base estabiliza no mês 6');

  // conservador → posição 8 → CTR 0,816 × 0,2% + 0,184 × 0,9% = 0,3288%
  const c = moda.conservador;
  assert.equal(c.termos[0].posicao, 8);
  perto(c.termos[0].ctr, 0.003288, 'ctr conservador');
  perto(c.cliquesEstaveis, 32.88, 'cliques conservador');
  perto(c.vendasEstaveis, 0.23016, 'vendas conservador');
  perto(c.porMes.reduce((s, v) => s + v, 0) / c.vendasEstaveis, 7.5, 'rampa conservador');
  perto(c.mediaAno1, 0.14385, 'média conservador');

  // otimista → posição 3 → CTR 0,14 × 0,8% + 0,86 × 5,8% = 5,1%
  const o = moda.otimista;
  assert.equal(o.termos[0].posicao, 3);
  perto(o.termos[0].ctr, 0.051, 'ctr otimista');
  perto(o.cliquesEstaveis, 510, 'cliques otimista');
  perto(o.vendasEstaveis, 6.63, 'vendas otimista');
  perto(o.porMes.reduce((s, v) => s + v, 0) / o.vendasEstaveis, 10, 'rampa otimista');
  perto(o.mediaAno1, 5.525, 'média otimista');

  // os outros dois modelos: cliques × o produto dos degraus
  perto(projetar(ref, 'saas').base.vendasEstaveis, 219.2 * 0.0183 * 0.182, 'saas');
  perto(projetar(ref, 'clinicas').base.vendasEstaveis, 219.2 * 0.0407 * 0.25 * 0.75, 'clínica');
  perto(projetar(ref, 'saas').base.mediaAno1, (219.2 * 0.0183 * 0.182 * 9) / 12, 'saas média');

  // dificuldade 25 no conservador: fora do alcance, zero real
  const dificil = projetar([termo('fita', 10000, 25)], 'moda').conservador;
  assert.equal(dificil.termos[0].posicao, null);
  assert.equal(dificil.mediaAno1, 0);
  assert.equal(dificil.demanda.foraDoAlcance, 10000);
  assert.equal(dificil.demanda.alcancavel, 0);
  assert.equal(dificil.demanda.total, 10000);

  // dificuldade não medida conta 15
  const semKd = projetar([termo('fita', 10000, null)], 'moda');
  assert.equal(semKd.base.termos[0].posicao, 7);
  assert.equal(semKd.conservador.termos[0].posicao, 10);
  assert.equal(semKd.base.demanda.semDificuldade, 1);

  // sem volume medido fica fora da soma
  const semVol = projetar([termo('fita', 10000, 5), termo('fita rara', null, 5)], 'moda').base;
  assert.equal(semVol.demanda.total, 10000);
  assert.equal(semVol.demanda.semVolume, 1);
  perto(semVol.cliquesEstaveis, 219.2, 'sem volume não soma');

  // variantes: mesma série e mesmo volume somam uma vez
  const variantes = projetar([termo('fita gomada', 10000, 5), termo('fitas gomadas', 10000, 5)], 'moda').base;
  assert.equal(variantes.demanda.total, 10000);
  assert.equal(variantes.demanda.agrupados, 1);
  assert.equal(variantes.termos[1].grupo, 'fita gomada');
  assert.equal(variantes.termos[0].grupo, null);
  perto(variantes.cliquesEstaveis, 219.2, 'variante não soma');
  // mesmo volume, série diferente: não é grupo
  const soVolume = projetar([termo('a', 10000, 5), termo('b', 10000, 5, serie(9000))], 'moda').base;
  assert.equal(soVolume.demanda.total, 20000);

  // a posição do grupo é a do 1º da lista (research D5)
  const [kd34, kd12] = [termo('fita gomada', 10000, 34), termo('fitas gomadas', 10000, 12)];
  const primeiroDificil = projetar([kd34, kd12], 'moda').conservador;
  assert.equal(primeiroDificil.demanda.alcancavel, 0);
  assert.equal(primeiroDificil.mediaAno1, 0);
  const primeiroFacil = projetar([kd12, kd34], 'moda').conservador;
  assert.equal(primeiroFacil.termos[0].posicao, 10);
  assert.equal(primeiroFacil.demanda.alcancavel, 10000);

  // arredondamento: 1 decimal abaixo de 10, inteiro a partir de 10
  assert.equal(arredondarVendas(1.644), 1.6);
  assert.equal(arredondarVendas(18.4), 18);
  assert.equal(arredondarVendas(0.7), 0.7);
  assert.equal(formatarVendas(0.7), '0,7');
  assert.equal(formatarVendas(12.4), '12');
  assert.equal(formatarVendas(1.644), '1,6');
  assert.equal(formatarVendas(0), '0');
  assert.equal(formatarVendas(0.02), 'menos de 0,1', 'venda rara não vira zero real');
  console.log('ok conta (SC-003)');
}

// ── códigos da DataForSEO viram a causa que a tela mostra ────────────────────────────
{
  assert.deepEqual(erroDataForSEO(40100), { erro: 'chave', http: 503 });
  assert.deepEqual(erroDataForSEO(40200), { erro: 'saldo', http: 402 });
  assert.deepEqual(erroDataForSEO(40210), { erro: 'saldo', http: 402 });
  // 503 e não 502: a EasyPanel troca o 502 do app pela página dela e a causa some
  for (const c of [50000, 50401, 40202, 12345]) assert.deepEqual(erroDataForSEO(c), { erro: 'fonte', http: 503 }, String(c));
  console.log('ok erros da fonte');
}

// ── ponte para o simulador (research D13): leva o número que a tela mostra ─────────────
{
  assert.equal(urlSimulador('moda', 1.644, 'conservador'), '/admin/precos?nicho=moda&ritmo=1.6&cenario=conservador#simulador');
  assert.equal(urlSimulador('moda', 18.4, 'base'), '/admin/precos?nicho=moda&ritmo=18&cenario=base#simulador');
  // o simulador lê de volta o mesmo número que a Projeção escreveu
  for (const media of [0, 0.02, 0.14385, 1.644, 9.96, 18.4, 1234.5]) {
    const params = Object.fromEntries(new URLSearchParams(urlSimulador('clinicas', media, 'otimista').split('?')[1].split('#')[0]));
    assert.equal(lerPonteSimulador(params).ritmo, arredondarVendas(media), `média ${media}`);
  }
  assert.deepEqual(lerPonteSimulador({ nicho: 'moda', ritmo: '18', cenario: 'base' }), { nichoId: 'moda', ritmo: 18, cenario: 'base' });
  const ruins = [
    { nicho: 'moda', ritmo: 'abc', cenario: 'base' },
    { nicho: 'moda', ritmo: '-1', cenario: 'base' },
    { nicho: 'moda', ritmo: '100001', cenario: 'base' },
    { nicho: 'moda', ritmo: '', cenario: 'base' },
    { nicho: 'xpto', ritmo: '18', cenario: 'base' },
    { nicho: 'moda', ritmo: '18', cenario: 'xpto' },
    { nicho: 'moda', ritmo: '18' },
    { nicho: ['moda', 'pet'], ritmo: '18', cenario: 'base' },
    { nicho: 'moda', ritmo: ['18'], cenario: 'base' },
    {},
  ];
  for (const p of ruins) assert.equal(lerPonteSimulador(p), null, JSON.stringify(p));
  console.log('ok ponte do simulador');
}

// ── a cadeia aberta (US3): multiplicar os degraus mostrados reproduz o mês estável ──────
{
  const termos = [termo('fita gomada', 10000, 5), termo('fita kraft', 3000, 18), termo('fita difícil', 5000, 60), termo('rara', null, 3)];
  for (const nichoId of ['moda', 'saas', 'clinicas']) {
    const p = projetar(termos, nichoId);
    for (const c of CENARIOS) {
      const r = p[c];
      assert.equal(r.cadeia[0].n, r.demanda.alcancavel, `${nichoId}/${c}: começa pela demanda alcançável`);
      assert.equal(r.cadeia.length, 2 + FUNIS[nichoId].degraus.length, `${nichoId}: buscas, cliques e um elo por degrau`);
      const produto = r.cadeia.slice(1).reduce((v, e) => v * e.taxa, r.cadeia[0].n);
      perto(produto, r.vendasEstaveis, `${nichoId}/${c}: produto da cadeia`);
      for (let i = 1; i < r.cadeia.length; i++) perto(r.cadeia[i].n, r.cadeia[i - 1].n * r.cadeia[i].taxa, `${nichoId}/${c} elo ${i}`);
      perto(r.cadeia.at(-1).n, r.vendasEstaveis, `${nichoId}/${c}: último elo = vendas`);
      assert.equal(r.vendasEstaveis, r.porMes[11], `${nichoId}/${c}: mês 12 = mês estável`);
      for (const e of r.cadeia) assert.ok(e.fonte, `${nichoId}/${c}: elo "${e.rotulo}" sem fonte`);
    }
  }

  // taxa do parceiro: vale nos 3 cenários, que passam a diferir só na captura
  const parceiro = projetar([termo('fita gomada', 10000, 5)], 'moda', { 0: 0.02 });
  perto(parceiro.base.vendasEstaveis, 219.2 * 0.02, 'base com a taxa do parceiro');
  perto(parceiro.conservador.vendasEstaveis, 32.88 * 0.02, 'conservador com a taxa do parceiro');
  for (const c of CENARIOS) {
    assert.equal(parceiro[c].cadeia[2].origem, 'parceiro');
    assert.equal(parceiro[c].cadeia[2].taxa, 0.02);
  }
  assert.equal(projetar([termo('fita gomada', 10000, 5)], 'moda').base.cadeia[2].origem, 'mercado');
  // só o degrau informado muda; os outros continuam no benchmark
  const clinica = projetar([termo('dentista', 10000, 5)], 'clinicas', { 1: 0.5 }).base;
  assert.deepEqual(clinica.cadeia.slice(2).map((e) => e.origem), ['mercado', 'parceiro', 'mercado']);
  perto(clinica.vendasEstaveis, 219.2 * 0.0407 * 0.5 * 0.75, 'clínica com agendamento do parceiro');
  // taxa inválida é ignorada, nunca vira NaN
  for (const t of [NaN, -0.1, 1.5, Infinity]) {
    const r = projetar([termo('fita gomada', 10000, 5)], 'moda', { 0: t }).base;
    perto(r.vendasEstaveis, 2.192, `taxa ${t}`);
    assert.equal(r.cadeia[2].origem, 'mercado');
  }
  console.log('ok cadeia (US3)');
}

process.stdout.write('projecao: ok\n');
