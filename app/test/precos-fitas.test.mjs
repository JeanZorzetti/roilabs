// Runnable check para lib/precos-fitas.ts — caminho de dinheiro, sem I/O.
// Run: node --import tsx test/precos-fitas.test.mjs
import assert from 'node:assert/strict';
import {
  precoPorQuantidade,
  temPrecoPublico,
  listarFitas,
  cargaDoCarrinho,
} from '../src/lib/precos-fitas.ts';

// ── fronteiras de faixa (o que mais quebra em tabela escalonada) ───────────────
assert.equal(precoPorQuantidade('fita-gomada', 14), null, '14 < mínimo de 15 => null');
assert.equal(precoPorQuantidade('fita-gomada', 15).precoRolo, 37.2, '15 = mínimo, faixa baixa');
assert.equal(precoPorQuantidade('fita-gomada', 100).precoRolo, 37.2, '100 fica na faixa BAIXA (a favor do comprador)');
assert.equal(precoPorQuantidade('fita-gomada', 101).precoRolo, 32.2, '101 vira faixa alta');
assert.equal(precoPorQuantidade('fita-gomada', 5000).precoRolo, 32.2, 'faixa sem teto atende qualquer volume');

assert.equal(precoPorQuantidade('fita-transparente-comum', 1).precoRolo, 7.9, 'comum: preço único a partir de 1');
assert.equal(precoPorQuantidade('fita-transparente-comum', 999).precoRolo, 7.9, 'comum: preço único não escalona');
assert.equal(precoPorQuantidade('fita-transparente-comum', 0), null, 'zero => null');

// ── só-orçamento: a AUSÊNCIA na tabela é o que marca a modalidade (FR-005/FR-040) ──
assert.equal(precoPorQuantidade('fita-transparente-personalizada', 50), null, 'personalizada é só-orçamento');
assert.equal(temPrecoPublico('fita-transparente-personalizada'), false, 'personalizada sem preço público');
assert.equal(temPrecoPublico('fita-gomada'), true);
assert.equal(precoPorQuantidade('slug-que-nao-existe', 10), null, 'slug ausente => null');

// ── entrada inválida ──────────────────────────────────────────────────────────
assert.equal(precoPorQuantidade('fita-gomada', 15.5), null, 'rolo fracionado => null (não existe meio rolo)');
assert.equal(precoPorQuantidade('fita-gomada', NaN), null, 'NaN => null');
assert.equal(precoPorQuantidade('fita-gomada', -10), null, 'negativo => null');

// ── invariante: faixas cobrem de minimoRolos ao infinito, sem lacuna e sem sobreposição ──
// (a tabela impressa original tinha as duas — é o defeito que este teste existe para pegar)
for (const f of listarFitas()) {
  const faixas = [...f.faixas].sort((a, b) => a.min - b.min);
  assert.equal(faixas[0].min, f.minimoRolos, `${f.slug}: 1ª faixa começa no mínimo do SKU`);
  assert.equal(faixas.at(-1).max, null, `${f.slug}: última faixa é sem teto`);
  for (let i = 0; i < faixas.length - 1; i++) {
    assert.equal(faixas[i].max, faixas[i + 1].min - 1, `${f.slug}: faixa ${i} encosta na seguinte, sem lacuna nem sobreposição`);
  }
  assert.ok(f.pesoKg > 0 && f.alturaCm > 0 && f.larguraCm > 0 && f.comprimentoCm > 0, `${f.slug}: carga preenchida (frete não roda sem)`);
  // Volume só faz sentido se ficar mais barato — o contrário seria erro de digitação.
  for (let i = 0; i < faixas.length - 1; i++) {
    assert.ok(faixas[i].precoRolo >= faixas[i + 1].precoRolo, `${f.slug}: faixa maior nunca é mais cara`);
  }
}

// ── subtotal = rolos × precoRolo(faixa) ───────────────────────────────────────
const money = (n) => Math.round(n * 100) / 100;
assert.equal(money(15 * precoPorQuantidade('fita-gomada', 15).precoRolo), 558, '15 × 37,20 = 558,00');
assert.equal(money(101 * precoPorQuantidade('fita-gomada', 101).precoRolo), 3252.2, '101 × 32,20 = 3.252,20');

// ── carga: derivada do slug, nunca do cliente ─────────────────────────────────
{
  const c = cargaDoCarrinho([{ slug: 'fita-gomada', rolos: 15 }]);
  assert.equal(c.pesoKg, 16.5, '15 × 1,1 kg = 16,5 kg');
  assert.ok(c.alturaCm > 0 && c.larguraCm > 0 && c.comprimentoCm > 0);
  assert.equal(cargaDoCarrinho([{ slug: 'fita-transparente-personalizada', rolos: 20 }]), null, 'SKU sem preço público não vira carga');
  assert.equal(cargaDoCarrinho([]), null, 'carrinho vazio => null');
}

console.log('precos-fitas.test.mjs: all assertions passed');
