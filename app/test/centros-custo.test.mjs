// Runnable check for the two cost centers against the anchor numbers in the vault docs
// (Docs/Obsidian/60-legal-fin/projecao-financeira.md): varejo R$9.100, atacado R$7.000.
// Run: node --import tsx test/centros-custo.test.mjs
import assert from 'node:assert/strict';
import { atacadoDe, calcIntermediacao, calcWL } from '../src/lib/centros-custo.ts';

const varejo = 9100;
const atacado = 7000;

// markup 0,30 reconstrói o atacado-âncora a partir do varejo-âncora
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

// no produto-âncora a intermediação vence (insight central dos docs)
assert.ok(i.liquido > w.liquido, 'intermediação > WL no produto-âncora');

console.log('centros-custo.test.mjs: all assertions passed');
