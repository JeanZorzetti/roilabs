import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { getProduto } from '@/lib/precos';
import { calcFrete, type Entrega } from '@/lib/frete';
import { createPreference } from '@/lib/mercadopago';

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
  const total = money(totalProduto + (frete ?? 0));

  // Persist pending order + items.
  const pedido = await prisma.pedido.create({
    data: {
      nome,
      whatsapp,
      email: cap(form.get('email'), 200) || null,
      entrega,
      cep: entrega === 'retirada' ? null : cep,
      frete,
      total,
      consent: true,
      itens: { create: itens },
    },
    include: { itens: true },
  });

  // Create the Mercado Pago preference, then redirect the browser straight to it.
  try {
    const appOrigin = req.nextUrl.origin; // app.roilabs.com.br
    const pref = await createPreference({
      externalReference: pedido.id,
      items: itens.map((i) => ({ title: `${i.caixas} cx — ${i.slug}`, unitPrice: i.subtotal })),
      frete,
      backUrl: `${origin.startsWith('http') ? origin : 'https://goiania.roilabs.com.br'}/obrigado?pedido=${pedido.id}`,
      notificationUrl: `${appOrigin}/api/pagamentos/webhook`,
    });
    await prisma.pedido.update({ where: { id: pedido.id }, data: { mpPreferenceId: pref.id } });
    return NextResponse.redirect(pref.initPoint, 303);
  } catch (err) {
    console.error('checkout: MP preference failed', err);
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
