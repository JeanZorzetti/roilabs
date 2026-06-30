// Runnable check for the two cost centers against the anchor numbers in the vault docs
// (Docs/Obsidian/60-legal-fin/projecao-financeira.md): varejo R$9.100, atacado R$7.000.
// Feature 004: also covers resolver precedence (SKU > linha > global > PARAMS), piso
// real/estimado, snapshot stability, and modalidade-alvo default.
// Run: node --import tsx test/centros-custo.test.mjs
import assert from 'node:assert/strict';
import {
  PARAMS,
  atacadoDe,
  calcIntermediacao,
  calcWL,
  resolverParametros,
  resolverPiso,
  resolverModalidade,
} from '../src/lib/centros-custo.ts';

// ── Anchor check (SC-002) ───────────────────────────────────────────────────
const varejo = 9100;
const atacado = 7000;

assert.ok(Math.abs(atacadoDe(varejo) - atacado) < 1, 'atacado por markup bate com a âncora 7000');

const i = calcIntermediacao(varejo, atacado);
assert.equal(i.excedente, 2100, 'excedente = varejo − atacado');
assert.equal(i.comissao, 910, 'comissão = 10% do varejo');
assert.equal(i.receita, 3010, 'receita interm. = excedente + comissão (doc: R$3.010)');
assert.ok(Math.abs(i.liquido - 2700) < 10, 'líquido interm. ≈ R$2.700 (doc)');

const w = calcWL(varejo, atacado);
assert.equal(w.margem, 2100, 'margem WL = spread');
assert.equal(w.custo, 7000, 'custo WL = atacado');
assert.ok(Math.abs(w.imposto - 565) < 5, 'imposto WL ≈ R$565 (Anexo I após ST)');
assert.ok(Math.abs(w.liquido - 1535) < 10, 'líquido WL ≈ R$1.535 (doc)');

assert.ok(i.liquido > w.liquido, 'intermediação > WL no produto-âncora');

// ── resolverParametros: anchor reproduced with global defaults (SC-002) ─────
const globalDefaults = { markup: 0.3, comissao: 0.1, aliqIntermediacao: 0.102, aliqWL: 0.062 };
const anchorCamadas = { sku: null, linha: null, global: globalDefaults };
const pResolvido = resolverParametros(anchorCamadas);
const atacadoResolvido = atacadoDe(varejo, pResolvido.markup);
const iResolvido = calcIntermediacao(varejo, atacadoResolvido, pResolvido);
const wResolvido = calcWL(varejo, atacadoResolvido, pResolvido);
assert.ok(Math.abs(atacadoResolvido - atacado) < 1, 'resolver: atacado com global bate âncora');
assert.ok(Math.abs(iResolvido.liquido - 2700) < 10, 'resolver: líq. interm. ≈ R$2.700');
assert.ok(Math.abs(wResolvido.liquido - 1535) < 10, 'resolver: líq. WL ≈ R$1.535');

// ── resolverParametros: fallback a PARAMS quando não há global (FR-004) ─────
const semGlobal = resolverParametros({ sku: null, linha: null, global: null });
assert.equal(semGlobal.markup, PARAMS.markup, 'sem global: markup cai em PARAMS');
assert.equal(semGlobal.comissao, PARAMS.comissao, 'sem global: comissao cai em PARAMS');

// ── Precedência campo a campo SKU > linha > global (FR-009 / T005) ──────────
const globalCfg = { markup: 0.3, comissao: 0.1, aliqIntermediacao: 0.102, aliqWL: 0.062 };
const linhaCfg = { markup: 0.5, comissao: null, aliqIntermediacao: null, aliqWL: null };
const skuCfg = { markup: 0.4, comissao: null, aliqIntermediacao: null, aliqWL: null, piso: null, modalidadeAlvo: null };

// SKU vence linha e global
const pSku = resolverParametros({ sku: skuCfg, linha: linhaCfg, global: globalCfg });
assert.equal(pSku.markup, 0.4, 'SKU markup vence linha e global');
assert.equal(pSku.comissao, 0.1, 'campo nulo no SKU herda global (sem linha)');

// linha vence global quando SKU não tem
const pLinha = resolverParametros({ sku: null, linha: linhaCfg, global: globalCfg });
assert.equal(pLinha.markup, 0.5, 'linha markup vence global');
// campo nulo na linha herda global
assert.equal(pLinha.comissao, 0.1, 'campo nulo na linha herda global');
assert.equal(pLinha.aliqIntermediacao, 0.102, 'campo nulo na linha herda aliqIntermediacao do global');

// global sem SKU nem linha
const pGlobal = resolverParametros({ sku: null, linha: null, global: globalCfg });
assert.equal(pGlobal.markup, 0.3, 'sem SKU nem linha: usa global');

// SKU vence linha vence global (precedência 3 camadas)
const skuMarca = { markup: 0.6, comissao: null, aliqIntermediacao: null, aliqWL: null, piso: null, modalidadeAlvo: null };
const pTres = resolverParametros({ sku: skuMarca, linha: linhaCfg, global: globalCfg });
assert.equal(pTres.markup, 0.6, 'SKU vence linha vence global (3 camadas)');
assert.equal(pTres.aliqWL, 0.062, 'campo nulo em SKU e linha herda aliqWL do global');

// ── resolverPiso: real vs estimado (US2) ────────────────────────────────────
const { piso: pisoEstimado, real: isReal1 } = resolverPiso(129, { sku: null, linha: null, global: globalCfg });
assert.ok(!isReal1, 'sem piso cadastrado: estimado');
assert.ok(Math.abs(pisoEstimado - 129 / 1.3) < 0.01, 'piso estimado = varejo / (1 + markup)');

const { piso: pisoReal, real: isReal2 } = resolverPiso(129, { sku: { piso: 95, modalidadeAlvo: null }, linha: null, global: globalCfg });
assert.ok(isReal2, 'com piso cadastrado: real');
assert.equal(pisoReal, 95, 'piso real = valor cadastrado');

// ── resolverModalidade: default Intermediação (FR-014 / SC-007) ─────────────
assert.equal(resolverModalidade({ sku: null, linha: null, global: null }), 'intermediacao', 'sem modalidade-alvo: Intermediação');
assert.equal(resolverModalidade({ sku: { piso: null, modalidadeAlvo: 'wl' }, linha: null, global: null }), 'wl', 'modalidade wl: WL');
assert.equal(resolverModalidade({ sku: { piso: null, modalidadeAlvo: 'intermediacao' }, linha: null, global: null }), 'intermediacao', 'modalidade intermediacao: Intermediação');
assert.equal(resolverModalidade({ sku: { piso: null, modalidadeAlvo: null }, linha: null, global: null }), 'intermediacao', 'modalidade null: Intermediação');

// ── Snapshot stability: reapurar com snapshot não muda ao alterar parâmetros vigentes (FR-011) ─
// Simula um item pago com snapshot congelado (markup=0.30, piso=7000)
const snapshotParams = { comissao: 0.1, aliqIntermediacao: 0.102, aliqWL: 0.062 };
const iSnapshot = calcIntermediacao(9100, 7000, { ...PARAMS, ...snapshotParams });
const wSnapshot = calcWL(9100, 7000, { ...PARAMS, ...snapshotParams });

// Simula mudança nos parâmetros vigentes (markup 0.30→0.20)
const novosParams = { markup: 0.2, comissao: 0.1, aliqIntermediacao: 0.102, aliqWL: 0.062 };
const atacadoNovo = atacadoDe(9100, novosParams.markup);
const iNovo = calcIntermediacao(9100, atacadoNovo, novosParams);

// O item pago com snapshot não muda — o novo parâmetro só afeta o catálogo
assert.ok(Math.abs(iSnapshot.liquido - iNovo.liquido) > 50, 'alterar markup muda o catálogo');
// Re-apurar o item pago com os mesmos snapshots retorna o mesmo valor
const iSnapshotReapurado = calcIntermediacao(9100, 7000, { ...PARAMS, ...snapshotParams });
assert.equal(iSnapshot.liquido, iSnapshotReapurado.liquido, 'snapshot estável: reapurar não muda ao trocar parâmetros vigentes');

console.log('centros-custo.test.mjs: all assertions passed');
