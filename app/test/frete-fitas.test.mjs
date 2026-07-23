// Runnable check para lib/frete-fitas.ts — a função PURA de mapeamento, sem I/O.
// Run: node --import tsx test/frete-fitas.test.mjs
//
// O que este teste protege: a distinção entre `cep_nao_atendido` (operação normal) e
// `falha_tecnica` (incidente que dispara alerta). Errar essa separação ou enche a caixa
// de alerta-ruído, ou esconde a credencial errada que está matando 100% das cotações.
import assert from 'node:assert/strict';
import { mapearResposta, estimarFrete } from '../src/lib/frete-fitas.ts';

// ── resposta válida ───────────────────────────────────────────────────────────
{
  const r = mapearResposta([
    { name: '.Package', price: '87.40', delivery_time: 5, company: { name: 'JadLog' } },
    { name: 'PAC', price: '120.00', delivery_time: 9, company: { name: 'Correios' } },
  ]);
  assert.equal(r.ok, true);
  assert.equal(r.valor, 87.4, 'escolhe o mais barato');
  assert.equal(r.servico, 'JadLog .Package');
  assert.match(r.prazo, /5/);
}

// ── preço numérico e custom_price têm precedência sobre price ─────────────────
{
  const r = mapearResposta([{ name: 'X', price: 100, custom_price: 80, delivery_time: 3, company: { name: 'Y' } }]);
  assert.equal(r.valor, 80, 'custom_price (preço negociado) vence o de tabela');
}

// ── CEP não atendido: provedor respondeu, mas nenhum serviço cobre ────────────
{
  const r = mapearResposta([
    { name: 'PAC', company: { name: 'Correios' }, error: 'CEP de destino não atendido' },
    { name: 'SEDEX', company: { name: 'Correios' }, error: 'CEP de destino não atendido' },
  ]);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'cep_nao_atendido', 'todos com error => operação normal, SEM alerta');
}

// ── falha técnica: resposta ilegível ──────────────────────────────────────────
assert.equal(mapearResposta(null).motivo, 'falha_tecnica', 'null => falha técnica');
assert.equal(mapearResposta({ message: 'Unauthenticated.' }).motivo, 'falha_tecnica', 'objeto de erro (401) => falha técnica');
assert.equal(mapearResposta('<html>502</html>').motivo, 'falha_tecnica', 'HTML de gateway => falha técnica');
assert.equal(mapearResposta([]).motivo, 'falha_tecnica', 'array vazio não é "não atendo", é resposta suspeita');

// ── valor 0 ou negativo NÃO é frete grátis, é resposta suspeita ───────────────
{
  const r = mapearResposta([{ name: 'X', price: '0.00', delivery_time: 3, company: { name: 'Y' } }]);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'cep_nao_atendido', 'único serviço com valor 0 é descartado; sobrou resposta legível sem cotação');
}
{
  const r = mapearResposta([
    { name: 'Zero', price: '0', delivery_time: 3, company: { name: 'A' } },
    { name: 'Real', price: '55.10', delivery_time: 4, company: { name: 'B' } },
  ]);
  assert.equal(r.ok, true);
  assert.equal(r.valor, 55.1, 'serviço com valor 0 nunca vira o "mais barato"');
}
{
  const r = mapearResposta([{ name: 'X', price: '-10', delivery_time: 3, company: { name: 'Y' } }]);
  assert.equal(r.ok, false, 'valor negativo é descartado');
}

// ── prazo ausente não invalida a cotação (o dinheiro é o valor, não o prazo) ──
{
  const r = mapearResposta([{ name: 'X', price: '40.00', company: { name: 'Y' } }]);
  assert.equal(r.ok, true);
  assert.equal(r.prazo, 'a confirmar');
}

// ── estimativa (011.1): base + R$/kg × peso × banda de distância, origem Goiânia ───
{
  // gomada 15 rolos = 16,5 kg. Goiânia (74x, banda 1,0): 20 + 3,5 × 16,5 × 1,0.
  const r = estimarFrete('74934577', [{ slug: 'fita-gomada', rolos: 15 }]);
  assert.equal(r.ok, true);
  assert.equal(r.valor, 77.75, 'estimativa Goiânia = 20 + 3,5×16,5×1,0');
  assert.equal(r.servico, 'Frete estimado');
}
{
  // O bug que o operador achou: Goiânia (74x) e Palmas-TO (77x) caíam no mesmo "7" e davam
  // IGUAL. Agora a banda de 3 dígitos separa — Palmas (outro estado, 700 km) sai mais caro.
  const goiania = estimarFrete('74934577', [{ slug: 'fita-gomada', rolos: 15 }]).valor;
  const palmas = estimarFrete('77001002', [{ slug: 'fita-gomada', rolos: 15 }]).valor;
  const salvador = estimarFrete('40010000', [{ slug: 'fita-gomada', rolos: 15 }]).valor;
  assert.ok(palmas > goiania, 'Palmas-TO custa mais que a origem (não mais igual)');
  assert.ok(salvador > palmas, 'Nordeste custa mais que Tocantins');
}
assert.equal(estimarFrete('123', [{ slug: 'fita-gomada', rolos: 15 }]).motivo, 'cep_nao_atendido', 'CEP malformado');
assert.equal(estimarFrete('74934577', []).motivo, 'falha_tecnica', 'carrinho sem carga cotável');
assert.equal(estimarFrete('74934577', [{ slug: 'cliche-arte', rolos: 1 }]).motivo, 'falha_tecnica', 'só clichê: não é carga física');

console.log('frete-fitas.test.mjs: all assertions passed');
