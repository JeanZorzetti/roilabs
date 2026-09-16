// Runnable check do terceiro canal do sendAlert (roihub, spec 027): o alerta em HTML vira o corpo
// de POST /api/avisos/evento, e o envio nunca derruba nem vaza o segredo.
// Run: node --import tsx test/aviso-telegram.test.mjs
import assert from 'node:assert/strict';
import { alertaParaAviso, avisarRoihub } from '../src/lib/aviso-telegram.ts';

// ── pedido pago: título até o " — ", link vira caminho, lista vira linhas ──
{
  const aviso = alertaParaAviso(
    '💰 Pedido pago — Maria &amp; Filhos · R$ 900,00',
    `<p><strong>Maria &amp; Filhos</strong> · 62 99999-0000 · maria@exemplo.com</p>
     <ul><li>Porcelanato 60×60 — 20 m²</li><li>Rejunte &lt;cinza&gt;</li></ul>
     <p>Total: <strong>R$ 900,00</strong> · entrega: retirada</p>
     <p><a href="https://app.roilabs.com.br/admin/pedidos">Abrir no admin</a></p>`,
  );
  assert.deepEqual(aviso, {
    projeto: 'roilabs',
    titulo: '💰 Pedido pago',
    texto: [
      'Maria & Filhos · 62 99999-0000 · maria@exemplo.com',
      '• Porcelanato 60×60 — 20 m²',
      '• Rejunte <cinza>',
      'Total: R$ 900,00 · entrega: retirada',
    ].join('\n'),
    caminho: '/admin/pedidos',
    acao: 'Abrir no admin',
  });
}

// ── quebra de linha do código-fonte não parte a frase; <br>, <h2> e <pre> partem ──
{
  const { titulo, texto } = alertaParaAviso(
    '🔴 Carteira: assinatura inválida — mercadopago/atma',
    `<p>O webhook recusou uma notificação de <strong>mercadopago</strong>
      para o parceiro <strong>atma</strong>.</p>
     <h2>Rank</h2><pre>termo a   3
termo b   7</pre>
     <p>linha 1<br>linha 2</p>`,
  );
  assert.equal(titulo, '🔴 Carteira: assinatura inválida');
  assert.equal(
    texto,
    ['O webhook recusou uma notificação de mercadopago para o parceiro atma.', 'Rank', 'termo a 3', 'termo b 7', 'linha 1', 'linha 2'].join('\n'),
  );
}

// ── assunto sem " — " fica inteiro; alerta sem link não tem caminho ──
{
  const aviso = alertaParaAviso('🚨 Frete quebrado', '<p>Último pedido: abc</p>');
  assert.equal(aviso.titulo, '🚨 Frete quebrado');
  assert.equal(aviso.caminho, undefined);
  assert.equal(aviso.acao, undefined);
}

// ── link de outro domínio ou fora da regra do hub fica como texto; vale o primeiro link bom ──
{
  const aviso = alertaParaAviso(
    '📊 Semana ROI Labs — 3 leads',
    `<p><a href="https://evil.com/admin">phishing</a></p>
     <p><a href="https://app.roilabs.com.br/admin/pedidos?id=1">com query</a></p>
     <p><a href="https://app.roilabs.com.br/admin">Abrir o admin</a></p>`,
  );
  assert.equal(aviso.caminho, '/admin');
  assert.equal(aviso.acao, 'Abrir o admin');
  assert.equal(aviso.texto, 'phishing\ncom query');
}

// ── avisarRoihub ──
// Guarda o que o logger escreve no stdout, também em código assíncrono.
async function capture(fn) {
  const lines = [];
  const real = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => (lines.push(String(chunk)), true);
  try {
    await fn();
  } finally {
    process.stdout.write = real;
  }
  return lines.join('');
}

function fetchFalso(resultado) {
  const chamadas = [];
  const impl = async (url, init) => {
    chamadas.push({ url, init });
    if (resultado instanceof Error) throw resultado;
    return resultado;
  };
  return { impl, chamadas };
}

const SEGREDO = 'segredo-do-hub-027';
const aviso = { projeto: 'roilabs', titulo: '💰 Pedido pago', texto: 'x', caminho: '/admin/pedidos', acao: 'Abrir no admin' };

{
  const f = fetchFalso({ ok: true, status: 200 });
  const log = await capture(() => avisarRoihub(aviso, { ROIHUB_CRM_SECRET: ' ' }, f.impl));
  assert.equal(f.chamadas.length, 0, 'sem segredo, nada sai');
  assert.match(log, /ROIHUB_CRM_SECRET/, 'a falta aparece pelo nome');
}

{
  const f = fetchFalso({ ok: true, status: 200 });
  const log = await capture(() => avisarRoihub(aviso, { ROIHUB_CRM_SECRET: SEGREDO, ROIHUB_CRM_URL: 'http://localhost:3000/' }, f.impl));
  assert.equal(f.chamadas[0].url, 'http://localhost:3000/api/avisos/evento');
  assert.equal(f.chamadas[0].init.headers.authorization, `Bearer ${SEGREDO}`);
  assert.deepEqual(JSON.parse(f.chamadas[0].init.body), aviso);
  assert.equal(log, '', 'envio aceito não loga');
}

{
  const f = fetchFalso({ ok: true, status: 200 });
  await capture(() => avisarRoihub(aviso, { ROIHUB_CRM_SECRET: SEGREDO }, f.impl));
  assert.equal(f.chamadas[0].url, 'https://hub.roilabs.com.br/api/avisos/evento', 'base padrão');
}

{
  const f = fetchFalso({ ok: false, status: 502 });
  const log = await capture(() => avisarRoihub(aviso, { ROIHUB_CRM_SECRET: SEGREDO }, f.impl));
  assert.match(log, /502/);
  assert.ok(!log.includes(SEGREDO), 'o segredo nunca vai ao log');
}

{
  const f = fetchFalso(new Error(`ECONNREFUSED Bearer ${SEGREDO}`));
  let log;
  await assert.doesNotReject(async () => {
    log = await capture(() => avisarRoihub(aviso, { ROIHUB_CRM_SECRET: SEGREDO }, f.impl));
  });
  assert.ok(log.length > 0, 'hub fora vira log');
  assert.ok(!log.includes(SEGREDO), 'nem pela mensagem do erro');
}

console.log('aviso-telegram: ok');
