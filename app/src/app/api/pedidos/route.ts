import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { getProduto } from '@/lib/precos';
import { calcFrete, type Entrega } from '@/lib/frete';
import { validarCupom } from '@/lib/cupons';
import { createPreference } from '@/lib/mercadopago';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const cap = (v: FormDataEntryValue | null, max: number) =>
  (typeof v === 'string' ? v.trim() : '').slice(0, max);

const money = (n: number) => Math.round(n * 100) / 100;

function backTo(origin: string, erro: string) {
  const base = origin.startsWith('http') ? origin : 'https://goiania.roilabs.com.br';
  return NextResponse.redirect(`${base}/carrinho?erro=${erro}`, 303);
}

// Public checkout: the static cart POSTs here (urlencoded, no preflight). 303 → Mercado Pago.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const origin = cap(form.get('origin'), 300); // static site base, for redirects back

  // Honeypot + LGPD consent (FR-008 boundary).
  if (cap(form.get('botcheck'), 100) || form.get('consent') !== '1') {
    return backTo(origin, 'validacao');
  }

  const nome = cap(form.get('nome'), 200);
  const whatsapp = cap(form.get('whatsapp'), 40);
  if (!nome || !whatsapp) return backTo(origin, 'validacao');

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

  // Persist pending order + items.
  const pedido = await prisma.pedido.create({
    data: {
      nome,
      whatsapp,
      email: cap(form.get('email'), 200) || null,
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

// Admin: list orders for manual fulfillment (espelha /api/leads-consumidor GET).
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const pedidos = await prisma.pedido.findMany({
    orderBy: { createdAt: 'desc' },
    include: { itens: true },
  });
  return NextResponse.json(pedidos);
}
