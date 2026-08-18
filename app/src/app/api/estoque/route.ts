import { NextRequest, NextResponse } from 'next/server';
import { listarEstoque } from '@/lib/estoque';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Lido cross-origin pela vitrine estática (SeletorVariacao.astro, 015 T014). Sem preço,
// sem dado de comprador — só disponibilidade. SKU sem linha em EstoqueVariacao não aparece
// no mapa; a vitrine trata ausência como esgotado (falha fechada, D4).
export async function GET(req: NextRequest) {
  const headers = corsHeaders(req.headers.get('origin'));
  const cadeira = req.nextUrl.searchParams.get('cadeira');
  if (!cadeira) return NextResponse.json({ ok: false, motivo: 'cadeira' }, { headers, status: 400 });

  const estoque = await listarEstoque(cadeira);
  return NextResponse.json({ ok: true, estoque }, { headers });
}
