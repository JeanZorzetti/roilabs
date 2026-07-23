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

// ── personalizada agora fatura direto (011.1): tem preço público e faixas próprias ──
assert.equal(precoPorQuantidade('fita-transparente-personalizada', 19), null, 'personalizada: 19 < mínimo de 20');
assert.equal(precoPorQuantidade('fita-transparente-personalizada', 20).precoRolo, 16.2, 'personalizada: 20 na 1ª faixa');
assert.equal(precoPorQuantidade('fita-transparente-personalizada', 50).precoRolo, 13.9, 'personalizada: 50 na 2ª faixa');
assert.equal(precoPorQuantidade('fita-transparente-personalizada', 200).precoRolo, 10.1, 'personalizada: 200+ na faixa sem teto');
assert.equal(temPrecoPublico('fita-transparente-personalizada'), true, 'personalizada com preço público');
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
  // Caixa cúbica dentro do limite da transportadora (a torre antiga dava 120 cm e era
  // recusada). 15 rolos: vol 48000 cm³ ⇒ aresta ⌈∛48000⌉ = 37 cm.
  assert.equal(c.alturaCm, c.larguraCm, 'caixa cúbica');
  assert.equal(c.alturaCm, c.comprimentoCm, 'caixa cúbica');
  assert.equal(c.alturaCm, 37, '15 gomada ⇒ cubo de 37 cm');
  assert.ok(c.alturaCm <= 100, 'aresta dentro do limite de dimensão da transportadora');
  // Volume preservado (não subestima o peso cubado): aresta³ >= volume real dos rolos.
  assert.ok(c.alturaCm ** 3 >= 8 * 20 * 20 * 15, 'cubo não perde volume vs. a soma dos rolos');
  assert.equal(cargaDoCarrinho([{ slug: 'fita-transparente-personalizada', rolos: 20 }]).pesoKg, 6, '20 × 0,3 kg = 6 kg (personalizada agora tem carga)');
  assert.equal(cargaDoCarrinho([{ slug: 'cliche-arte', rolos: 1 }]), null, 'linha de clichê não é produto físico: sem carga, não vai ao frete');
  assert.equal(cargaDoCarrinho([]), null, 'carrinho vazio => null');
}

console.log('precos-fitas.test.mjs: all assertions passed');
