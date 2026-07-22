import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { normalizarDoc } from '@/lib/doc';
import { classificarNegocio } from '@/lib/classificar-negocio';

export const dynamic = 'force-dynamic';

// GET ?parceiroId=… — negócios de um parceiro (tela de detalhe).
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const parceiroId = req.nextUrl.searchParams.get('parceiroId');
  const rows = await prisma.negocioOriginado.findMany({
    where: parceiroId ? { parceiroId } : undefined,
    include: { pedido: { select: { nome: true, whatsapp: true, total: true, statusPagamento: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      pedidoId: r.pedidoId,
      pedidoNome: r.pedido.nome,
      pedidoWhatsapp: r.pedido.whatsapp,
      parceiroId: r.parceiroId,
      valor: Number(r.valor),
      estagio: r.estagio,
      faturavel: r.faturavel,
      isencaoMotivo: r.isencaoMotivo,
      faturaId: r.faturaId,
      clienteDoc: r.clienteDoc,
      classificacao: r.classificacao,
      taxaAplicada: Number(r.taxaAplicada),
      pedidoReembolsado: r.pedido.statusPagamento === 'reembolsado',
      createdAt: r.createdAt,
    })),
  );
}

// POST — repassa um Pedido pago a um Parceiro ativo (FR-004/FR-004a).
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const pedidoId = typeof body.pedidoId === 'string' ? body.pedidoId : '';
  const parceiroId = typeof body.parceiroId === 'string' ? body.parceiroId : '';
  const isento = body.isento === true;
  const isencaoMotivo = typeof body.isencaoMotivo === 'string' ? body.isencaoMotivo.trim() : '';

  if (!pedidoId || !parceiroId) return NextResponse.json({ ok: false, motivo: 'pedidoId e parceiroId obrigatórios' }, { status: 400 });
  if (isento && !isencaoMotivo) return NextResponse.json({ ok: false, motivo: 'isencaoMotivo obrigatório quando isento' }, { status: 400 });

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido || pedido.statusPagamento !== 'pago') {
    return NextResponse.json({ ok: false, motivo: 'pedido inexistente ou não pago' }, { status: 400 });
  }

  const parceiro = await prisma.parceiro.findUnique({ where: { id: parceiroId } });
  if (!parceiro || parceiro.estagio !== 'ativa') {
    return NextResponse.json({ ok: false, motivo: 'parceiro inexistente ou não ativo' }, { status: 400 });
  }
  if (parceiro.comissaoAquisicao === null || parceiro.comissaoRecorrencia === null) {
    return NextResponse.json({ ok: false, motivo: 'parceiro sem taxas de aquisição/recorrência' }, { status: 400 });
  }

  const negocioAtivo = await prisma.negocioOriginado.findFirst({
    where: { pedidoId, estagio: { not: 'perdido' } },
  });
  if (negocioAtivo) {
    return NextResponse.json({ ok: false, motivo: 'pedido já tem negócio ativo' }, { status: 409 });
  }

  const valor = Number(pedido.total) - Number(pedido.frete ?? 0);

  // Snapshot na criação (010, D3/FR-005): classifica e congela a taxa do parceiro vigente.
  const clienteDoc = normalizarDoc(pedido.compradorDoc);
  let docsAnteriores: string[] = [];
  if (clienteDoc) {
    const anteriores = await prisma.negocioOriginado.findMany({
      where: { parceiroId, clienteDoc, estagio: { not: 'perdido' } },
      include: { pedido: { select: { statusPagamento: true } } },
    });
    // Negócio perdido ou pedido reembolsado não consome a aquisição (FR-008).
    docsAnteriores = anteriores.filter((n) => n.pedido.statusPagamento !== 'reembolsado').map((n) => clienteDoc);
  }
  const classificacao = classificarNegocio(clienteDoc, docsAnteriores);
  const taxaAplicada = classificacao === 'aquisicao' ? parceiro.comissaoAquisicao : parceiro.comissaoRecorrencia;

  const created = await prisma.negocioOriginado.create({
    data: {
      pedidoId,
      parceiroId,
      valor,
      estagio: 'repassado',
      faturavel: !isento,
      isencaoMotivo: isento ? isencaoMotivo : null,
      clienteDoc: clienteDoc || null,
      classificacao,
      taxaAplicada,
    },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
