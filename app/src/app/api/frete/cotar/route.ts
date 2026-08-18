import { NextRequest, NextResponse } from 'next/server';
import { cotarFrete } from '@/lib/frete-fitas';
import { temPrecoPublico } from '@/lib/precos-fitas';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Segundo endpoint lido cross-origin pelos sites estáticos → mesmo padrão de
// /api/cupom/validar: urlencoded (requisição simples, sem preflight), origem pela allowlist
// (015 D8 — dois hosts agora, goiania e mana). O site é estático: cotar no browser vazaria
// MELHOR_ENVIO_TOKEN no bundle.
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const AVISO: Record<string, string> = {
  cep_nao_atendido: 'Não atendemos este CEP por transportadora. O frete será combinado após o pedido.',
  cep_invalido: 'Confira o CEP digitado — não encontramos esse endereço.',
  falha_tecnica: 'Não foi possível calcular o frete agora. O frete será combinado após o pedido.',
};

export async function POST(req: NextRequest) {
  const CORS = corsHeaders(req.headers.get('origin'));
  const form = await req.formData();
  const cep = (typeof form.get('cep') === 'string' ? (form.get('cep') as string) : '').slice(0, 12);

  let parsed: unknown;
  try {
    parsed = JSON.parse((typeof form.get('itens') === 'string' ? (form.get('itens') as string) : '[]').slice(0, 5000));
  } catch {
    return NextResponse.json({ ok: false, motivo: 'vazio' }, { headers: CORS });
  }
  if (!Array.isArray(parsed)) return NextResponse.json({ ok: false, motivo: 'vazio' }, { headers: CORS });

  // Slug sem preço público sai da carga (é só-orçamento, não embarca neste pedido).
  // Sobrou zero item ⇒ 'vazio', em vez de cotar carga vazia.
  const itens = (parsed as Array<{ slug?: unknown; rolos?: unknown }>)
    .map((i) => ({ slug: typeof i?.slug === 'string' ? i.slug : '', rolos: Math.floor(Number(i?.rolos)) }))
    .filter((i) => temPrecoPublico(i.slug) && Number.isFinite(i.rolos) && i.rolos > 0);
  if (itens.length === 0) return NextResponse.json({ ok: false, motivo: 'vazio' }, { headers: CORS });

  // 200 mesmo em contingência: falha de cotação é estado de negócio previsto (FR-015),
  // não erro de requisição. A estimativa (011.1) vive DENTRO de cotarFrete, para quando o
  // provedor não está ligado; se o provedor está ligado e falha, ainda volta "a combinar".
  const r = await cotarFrete(cep, itens);
  if (!r.ok) return NextResponse.json({ ok: false, motivo: r.motivo, aviso: AVISO[r.motivo] }, { headers: CORS });

  return NextResponse.json(
    { ok: true, valor: r.valor, valorFmt: brl(r.valor), prazo: r.prazo, servico: r.servico },
    { headers: CORS },
  );
}
