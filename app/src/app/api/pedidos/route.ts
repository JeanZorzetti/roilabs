import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { getProduto } from '@/lib/precos';
import { calcFrete, type Entrega } from '@/lib/frete';
import { precoPorQuantidade, temPrecoPublico } from '@/lib/precos-fitas';
import { cotarFrete } from '@/lib/frete-fitas';
import { validarCupom } from '@/lib/cupons';
import { createPreference } from '@/lib/mercadopago';
import { normalizarDoc, validarDoc } from '@/lib/doc';
import { sendAlert } from '@/lib/email';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const cap = (v: FormDataEntryValue | null, max: number) =>
  (typeof v === 'string' ? v.trim() : '').slice(0, max);

const money = (n: number) => Math.round(n * 100) / 100;

function backTo(origin: string, erro: string, vertical: 'porcelanato' | 'fitas' = 'porcelanato') {
  const base = origin.startsWith('http') ? origin : 'https://goiania.roilabs.com.br';
  const path = vertical === 'fitas' ? '/carrinho-fitas/' : '/carrinho';
  return NextResponse.redirect(`${base}${path}?erro=${erro}`, 303);
}

// Public checkout: the static cart POSTs here (urlencoded, no preflight). 303 → Mercado Pago.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const origin = cap(form.get('origin'), 300); // static site base, for redirects back
  // 011: discriminador de vertical. Ausente ⇒ porcelanato — o carrinho já publicado
  // (e em cache no browser) não envia este campo e continua funcionando igual.
  const vertical = form.get('vertical') === 'fitas' ? 'fitas' : 'porcelanato';

  // Honeypot + LGPD consent (FR-008 boundary).
  if (cap(form.get('botcheck'), 100) || form.get('consent') !== '1') {
    return backTo(origin, 'validacao', vertical);
  }

  const nome = cap(form.get('nome'), 200);
  const whatsapp = cap(form.get('whatsapp'), 40);
  if (!nome || !whatsapp) return backTo(origin, 'validacao', vertical);

  if (vertical === 'fitas') return pedidoFitas(req, form, origin, nome, whatsapp);

  // Parse + recompute items on the server (FR-005: ignore any client money).
  let parsed: unknown;
  try {
    parsed = JSON.parse(cap(form.get('itens'), 5000) || '[]');
  } catch {
    return backTo(origin, 'vazio');
  }
  if (!Array.isArray(parsed)) return backTo(origin, 'vazio');

  const itens = parsed
    .map((i: { slug?: unknown; caixas?: unknown }) => {
      const slug = typeof i?.slug === 'string' ? i.slug : '';
      const caixas = Math.floor(Number(i?.caixas));
      const p = slug ? getProduto(slug) : null;
      if (!p || !Number.isFinite(caixas) || caixas < 1) return null; // drop unknown/invalid
      const m2 = money(caixas * p.m2_caixa);
      const subtotal = money(caixas * p.m2_caixa * p.preco);
      return { slug, caixas, m2, precoM2: p.preco, subtotal };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (itens.length === 0) return backTo(origin, 'vazio');

  // Freight: retirada → 0; CEP in table → value; CEP outside → null = "a combinar" (FR-016).
  const entregaInput = (cap(form.get('entrega'), 20) || 'retirada') as Entrega;
  const cep = cap(form.get('cep'), 12) || null;
  const frete = calcFrete(entregaInput, cep);
  const entrega = entregaInput === 'retirada' ? 'retirada' : frete === null ? 'a_combinar' : 'entrega';

  const totalProduto = money(itens.reduce((s, i) => s + i.subtotal, 0));

  // Coupon: re-validate on the server (authoritative, FR-014). A coupon that expired
  // between cart and checkout is charged WITHOUT discount; the customer is warned.
  const cupomInput = cap(form.get('cupom'), 40);
  const rRaw = cupomInput ? await validarCupom(cupomInput, totalProduto) : null;
  // Guard (D3): um cupom que zeraria o produto (desconto >= subtotal) é tratado como
  // inválido no checkout — reusa o caminho de "cupom rejeitado" (cobra sem desconto +
  // aviso) em vez de gerar uma linha de preço 0 no Mercado Pago.
  // ponytail: sem suporte a pedido 100% grátis via MP; upgrade = fluxo dedicado se precisar.
  const r = rRaw && rRaw.ok && rRaw.desconto >= totalProduto ? null : rRaw;
  const desconto = r && r.ok ? r.desconto : 0;
  const cupomCodigo = r && r.ok ? r.codigo : null;
  const avisoCupom = !!cupomInput && !(r && r.ok); // sent but rejected at checkout

  const total = money(Math.max(0, totalProduto - desconto) + (frete ?? 0));

  // CPF/CNPJ opcional (010): grava só os dígitos se o formato bate; inválido/ausente → null
  // (não bloqueia o checkout B2C). Chave de aquisição/recorrência no repasse ao parceiro.
  const docDigits = normalizarDoc(cap(form.get('compradorDoc'), 20));
  const compradorDoc = validarDoc(docDigits) ? docDigits : null;

  // Persist pending order + items.
  const pedido = await prisma.pedido.create({
    data: {
      nome,
      whatsapp,
      email: cap(form.get('email'), 200) || null,
      compradorDoc,
      entrega,
      cep: entrega === 'retirada' ? null : cep,
      frete,
      cupomCodigo,
      desconto: cupomCodigo ? desconto : null,
      total,
      consent: true,
      itens: { create: itens },
    },
    include: { itens: true },
  });

  // Create the Mercado Pago preference, then redirect the browser straight to it.
  try {
    const appOrigin = req.nextUrl.origin; // app.roilabs.com.br
    // Scale item unitPrice so the MP total (Σ items + frete) == server total (D7): MP has no
    // negative line. desconto < totalProduto sempre aqui — o guard acima já rejeita cupons
    // que zerariam o produto, então alvoProduto nunca é 0.
    const alvoProduto = money(Math.max(0, totalProduto - desconto));
    let acc = 0;
    const mpItems = itens.map((i, idx) => {
      const isLast = idx === itens.length - 1;
      const unitPrice = isLast ? money(alvoProduto - acc) : money((i.subtotal * alvoProduto) / totalProduto);
      acc = money(acc + unitPrice);
      return { title: `${i.caixas} cx — ${i.slug}`, unitPrice };
    });
    const backBase = origin.startsWith('http') ? origin : 'https://goiania.roilabs.com.br';
    const pref = await createPreference({
      externalReference: pedido.id,
      items: mpItems,
      frete,
      backUrl: `${backBase}/obrigado?pedido=${pedido.id}${avisoCupom ? '&aviso=cupom' : ''}`,
      notificationUrl: `${appOrigin}/api/pagamentos/webhook`,
    });
    await prisma.pedido.update({ where: { id: pedido.id }, data: { mpPreferenceId: pref.id } });
    return NextResponse.redirect(pref.initPoint, 303);
  } catch (err) {
    // pedidoId (not the buyer) is the trace key: the order is already persisted and
    // stays pendente, so this log is what tells you which one never reached MP.
    log.error({ err, pedidoId: pedido.id, total }, 'checkout: MP preference falhou');
    return backTo(origin, 'pagamento'); // order stays pendente
  }
}

// ── Ramo de FITAS (011) ───────────────────────────────────────────────────────
// Vertical paralelo: unidade em rolos, preço por faixa de volume, frete nacional
// re-cotado, CNPJ obrigatório. O ramo de porcelanato acima fica byte a byte igual.

/** Falhas técnicas seguidas que separam instabilidade de rede de credencial errada (D6). */
const ALERTA_FRETE_LIMIAR = 3;

async function pedidoFitas(
  req: NextRequest,
  form: FormData,
  origin: string,
  nome: string,
  whatsapp: string,
) {
  const erro = (e: string) => backTo(origin, e, 'fitas');

  // CPF/CNPJ é OBRIGATÓRIO em fitas (FR-007): sem ele, todo negócio da 010 seria
  // classificado como aquisição (15%) por omissão — a taxa errada, sempre.
  const docDigits = normalizarDoc(cap(form.get('compradorDoc'), 20));
  if (!validarDoc(docDigits)) return erro('documento');

  let parsed: unknown;
  try {
    parsed = JSON.parse(cap(form.get('itens'), 5000) || '[]');
  } catch {
    return erro('vazio');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return erro('vazio');

  const crus = (parsed as Array<{ slug?: unknown; rolos?: unknown }>).map((i) => ({
    slug: typeof i?.slug === 'string' ? i.slug : '',
    rolos: Math.floor(Number(i?.rolos)),
  }));

  // Trava do servidor contra carrinho misto (FR-028) — o front já separa os dois.
  if (crus.some((i) => getProduto(i.slug) !== null)) return erro('vertical_misto');

  // Item sem preço público é REJEITADO, nunca descartado em silêncio (FR-009): descarte
  // silencioso deixaria o comprador pagar um pedido incompleto sem perceber.
  if (crus.some((i) => !temPrecoPublico(i.slug))) return erro('item_orcamento');

  const itens = [];
  for (const i of crus) {
    const faixa = precoPorQuantidade(i.slug, i.rolos);
    if (!faixa) return erro('minimo'); // abaixo do mínimo do SKU ou quantidade inválida
    itens.push({
      slug: i.slug,
      rolos: i.rolos,
      precoRolo: faixa.precoRolo,
      faixaMin: faixa.min,
      faixaMax: faixa.max,
      subtotal: money(i.rolos * faixa.precoRolo),
    });
  }
  if (itens.length === 0) return erro('vazio');

  const totalProduto = money(itens.reduce((s, i) => s + i.subtotal, 0));

  // Frete RE-COTADO no servidor — o valor exibido no carrinho é display (FR-016).
  const cep = cap(form.get('cep'), 12) || null;
  const cot = await cotarFrete(cep ?? '', itens);
  const frete = cot.ok ? cot.valor : null;
  const freteMotivo = cot.ok ? null : cot.motivo;
  const entrega = cot.ok ? 'entrega' : 'a_combinar';

  // Cupom re-validado no vertical certo: cupom de porcelanato NÃO desconta fita (FR-036).
  // Fora de escopo reusa o caminho de "cupom rejeitado" — cobra sem desconto e avisa.
  const cupomInput = cap(form.get('cupom'), 40);
  const rRaw = cupomInput ? await validarCupom(cupomInput, totalProduto, 'fitas') : null;
  const r = rRaw && rRaw.ok && rRaw.desconto >= totalProduto ? null : rRaw;
  const desconto = r && r.ok ? r.desconto : 0;
  const cupomCodigo = r && r.ok ? r.codigo : null;
  const avisoCupom = !!cupomInput && !(r && r.ok);

  const total = money(Math.max(0, totalProduto - desconto) + (frete ?? 0));

  const pedido = await prisma.pedido.create({
    data: {
      nome,
      whatsapp,
      email: cap(form.get('email'), 200) || null,
      compradorDoc: docDigits,
      vertical: 'fitas',
      entrega,
      cep,
      frete,
      freteMotivo,
      cupomCodigo,
      desconto: cupomCodigo ? desconto : null,
      total,
      consent: true,
      itensFita: { create: itens },
    },
    include: { itensFita: true },
  });

  if (freteMotivo === 'falha_tecnica') await alertarFreteQuebrado(pedido.id);

  try {
    const appOrigin = req.nextUrl.origin;
    const alvoProduto = money(Math.max(0, totalProduto - desconto));
    let acc = 0;
    const mpItems = itens.map((i, idx) => {
      const isLast = idx === itens.length - 1;
      const unitPrice = isLast ? money(alvoProduto - acc) : money((i.subtotal * alvoProduto) / totalProduto);
      acc = money(acc + unitPrice);
      return { title: `${i.rolos} rolo(s) — ${i.slug}`, unitPrice };
    });
    const backBase = origin.startsWith('http') ? origin : 'https://goiania.roilabs.com.br';
    // frete = null ⇒ o Mercado Pago cobra só o produto; a operação fecha o frete depois.
    // Divergência carrinho↔checkout volta como aviso na tela de retorno (mesmo mecanismo
    // do aviso=cupom que já existe).
    const pref = await createPreference({
      externalReference: pedido.id,
      items: mpItems,
      frete,
      backUrl: `${backBase}/obrigado?pedido=${pedido.id}${avisoCupom ? '&aviso=cupom' : ''}${freteMotivo ? '&aviso=frete' : ''}`,
      notificationUrl: `${appOrigin}/api/pagamentos/webhook`,
    });
    await prisma.pedido.update({ where: { id: pedido.id }, data: { mpPreferenceId: pref.id } });
    return NextResponse.redirect(pref.initPoint, 303);
  } catch (err) {
    log.error({ err, pedidoId: pedido.id, total }, 'checkout fitas: MP preference falhou');
    return erro('pagamento');
  }
}

/**
 * Alerta de contingência (FR-035): N falhas TÉCNICAS consecutivas nos pedidos de fita.
 * Nunca alerta em `cep_nao_atendido` — isso é operação normal e viraria ruído que
 * ninguém lê. ponytail: limiar é knob de operador, não configuração.
 */
async function alertarFreteQuebrado(pedidoId: string) {
  const ultimos = await prisma.pedido.findMany({
    where: { vertical: 'fitas' },
    orderBy: { createdAt: 'desc' },
    take: ALERTA_FRETE_LIMIAR,
    select: { freteMotivo: true },
  });
  if (ultimos.length < ALERTA_FRETE_LIMIAR) return;
  if (!ultimos.every((p) => p.freteMotivo === 'falha_tecnica')) return;

  // Constituição I: a primeira coisa a conferir é a env var, e o alerta diz isso.
  sendAlert(
    '🚨 Frete de fitas quebrado — 3 pedidos seguidos sem cotação',
    `<p>Os últimos ${ALERTA_FRETE_LIMIAR} pedidos de fita saíram com frete "a combinar" por <strong>falha técnica</strong>.</p>
     <p>Conferir NESTA ordem: <code>MELHOR_ENVIO_TOKEN</code>, <code>MELHOR_ENVIO_BASE_URL</code>, <code>MELHOR_ENVIO_CEP_ORIGEM</code>. Só depois, o código.</p>
     <p>Último pedido: ${pedidoId}</p>
     <p><a href="https://app.roilabs.com.br/admin/pedidos">Abrir no admin</a></p>`,
  );
}

// Admin: list orders for manual fulfillment (espelha /api/leads-consumidor GET).
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const pedidos = await prisma.pedido.findMany({
    orderBy: { createdAt: 'desc' },
    include: { itens: true, itensFita: true },
  });
  return NextResponse.json(pedidos);
}
