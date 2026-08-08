import { NextRequest, NextResponse } from 'next/server';
import { getProduto } from '@/lib/precos';
import { precoPorQuantidade } from '@/lib/precos-fitas';
// 013 renomeou o tipo `Vertical` para `Escopo` (cupom passou a valer por cadeira, FR-018).
// O NOME NO FIO continua `vertical`: o carrinho já publicado está em cache no browser do
// comprador e envia esse campo — renomear aqui quebraria cupom de quem não recarregou.
import { validarCupom, type Escopo } from '@/lib/cupons';

export const dynamic = 'force-dynamic';

// The only endpoint the static site reads cross-origin → needs CORS (D2). Simple urlencoded
// request (no preflight). Display only; the charge re-validates at checkout (FR-014).
const SITE_ORIGIN = 'https://goiania.roilabs.com.br';
const CORS = { 'Access-Control-Allow-Origin': SITE_ORIGIN };

const money = (n: number) => Math.round(n * 100) / 100;
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const codigo = (typeof form.get('codigo') === 'string' ? (form.get('codigo') as string) : '').slice(0, 40);
  // Ausente ⇒ porcelanato: o carrinho já publicado (e em cache no browser do comprador)
  // não envia este campo e precisa continuar funcionando igual.
  const vertical: Escopo = form.get('vertical') === 'fitas' ? 'fitas' : 'porcelanato';

  // Recompute the product subtotal on the server (never trust client money, FR-017).
  let parsed: unknown;
  try {
    parsed = JSON.parse((typeof form.get('itens') === 'string' ? (form.get('itens') as string) : '[]').slice(0, 5000));
  } catch {
    return NextResponse.json({ ok: false, motivo: 'vazio' }, { headers: CORS });
  }
  if (!Array.isArray(parsed)) return NextResponse.json({ ok: false, motivo: 'vazio' }, { headers: CORS });

  // Subtotal pela tabela do vertical certo — cada unidade tem a sua autoridade de preço.
  let subtotal = 0;
  for (const i of parsed as Array<{ slug?: unknown; caixas?: unknown; rolos?: unknown }>) {
    const slug = typeof i?.slug === 'string' ? i.slug : '';
    if (!slug) continue;
    if (vertical === 'fitas') {
      const rolos = Math.floor(Number(i?.rolos));
      const faixa = Number.isFinite(rolos) ? precoPorQuantidade(slug, rolos) : null;
      if (!faixa) continue; // slug só-orçamento / abaixo do mínimo não soma
      subtotal = money(subtotal + rolos * faixa.precoRolo);
    } else {
      const caixas = Math.floor(Number(i?.caixas));
      const p = getProduto(slug);
      if (!p || !Number.isFinite(caixas) || caixas < 1) continue; // drop unknown/invalid
      subtotal = money(subtotal + caixas * p.m2_caixa * p.preco);
    }
  }
  if (subtotal <= 0) return NextResponse.json({ ok: false, motivo: 'vazio' }, { headers: CORS });

  const r = await validarCupom(codigo, subtotal, vertical);
  if (!r.ok) return NextResponse.json({ ok: false, motivo: r.motivo }, { headers: CORS });

  return NextResponse.json(
    { ok: true, codigo: r.codigo, tipo: r.tipo, desconto: r.desconto, descontoFmt: brl(r.desconto) },
    { headers: CORS },
  );
}
