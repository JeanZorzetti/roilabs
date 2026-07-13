import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { calcularFaturaMensal, type NegocioCalc } from '@/lib/success-fee';
import { garantirCliente, criarCobranca } from '@/lib/asaas';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const COMPETENCIA_RE = /^\d{4}-\d{2}$/;

// GET ?parceiroId=… — faturas de um parceiro (tela de detalhe).
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const parceiroId = req.nextUrl.searchParams.get('parceiroId');
  const rows = await prisma.faturaSuccessFee.findMany({
    where: parceiroId ? { parceiroId } : undefined,
    orderBy: { competencia: 'desc' },
  });
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      parceiroId: r.parceiroId,
      competencia: r.competencia,
      base: Number(r.base),
      valor: Number(r.valor),
      status: r.status,
      asaasPaymentId: r.asaasPaymentId,
      createdAt: r.createdAt,
    })),
  );
}

// POST — gera a fatura mensal (negócios ganhos/faturáveis/não faturados/não reembolsados)
// e emite a cobrança no Asaas. Idempotente por (parceiroId, competencia).
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parceiroId = typeof body.parceiroId === 'string' ? body.parceiroId : '';
  const competencia = typeof body.competencia === 'string' ? body.competencia : '';
  if (!parceiroId || !COMPETENCIA_RE.test(competencia)) {
    return NextResponse.json({ ok: false, motivo: 'parceiroId e competencia (YYYY-MM) obrigatórios' }, { status: 400 });
  }

  const parceiro = await prisma.parceiro.findUnique({ where: { id: parceiroId } });
  if (!parceiro || parceiro.estagio !== 'ativa' || parceiro.comissaoPct === null || !parceiro.cpfCnpj) {
    return NextResponse.json(
      { ok: false, motivo: 'parceiro precisa estar ativa, com comissaoPct e cpfCnpj' },
      { status: 400 },
    );
  }

  const existente = await prisma.faturaSuccessFee.findUnique({
    where: { parceiroId_competencia: { parceiroId, competencia } },
  });
  if (existente) return NextResponse.json({ ok: false, motivo: 'fatura já gerada para essa competência' }, { status: 409 });

  const negociosRows = await prisma.negocioOriginado.findMany({
    where: { parceiroId, faturaId: null },
    include: { pedido: { select: { statusPagamento: true } } },
  });
  const negocios: NegocioCalc[] = negociosRows.map((n) => ({
    id: n.id,
    valor: Number(n.valor),
    estagio: n.estagio,
    faturavel: n.faturavel,
    pedidoReembolsado: n.pedido.statusPagamento === 'reembolsado',
    jaFaturado: false,
  }));

  const calc = calcularFaturaMensal(Number(parceiro.comissaoPct), negocios);
  if (calc.negocioIds.length === 0) {
    return NextResponse.json({ ok: false, motivo: 'sem negócios faturáveis' }, { status: 400 });
  }

  const fatura = await prisma.$transaction(async (tx) => {
    const created = await tx.faturaSuccessFee.create({
      data: { parceiroId, competencia, base: calc.base, valor: calc.valor, status: 'emitida' },
    });
    await tx.negocioOriginado.updateMany({
      where: { id: { in: calc.negocioIds } },
      data: { faturaId: created.id },
    });
    return created;
  });

  try {
    const customerId = await garantirCliente({
      nome: parceiro.nome,
      cpfCnpj: parceiro.cpfCnpj,
      email: parceiro.email,
      asaasCustomerId: parceiro.asaasCustomerId,
    });
    if (!parceiro.asaasCustomerId) {
      await prisma.parceiro.update({ where: { id: parceiroId }, data: { asaasCustomerId: customerId } });
    }

    const cobranca = await criarCobranca({
      customerId,
      valor: calc.valor,
      descricao: `Success fee ${competencia} — ${parceiro.nome}`,
      externalReference: fatura.id,
    });

    await prisma.faturaSuccessFee.update({ where: { id: fatura.id }, data: { asaasPaymentId: cobranca.id } });
    return NextResponse.json({ ok: true, id: fatura.id, valor: calc.valor }, { status: 201 });
  } catch (err) {
    // Money path: the fatura row survives as status 'erro' but the Asaas charge never
    // existed. The 502 body reaches whoever clicked; this is what reaches ops.
    log.error({ err, faturaId: fatura.id, parceiroId, competencia }, 'faturas: cobrança Asaas falhou');
    await prisma.faturaSuccessFee.update({ where: { id: fatura.id }, data: { status: 'erro' } });
    return NextResponse.json({ ok: false, motivo: `fatura criada mas cobrança Asaas falhou: ${(err as Error).message}` }, { status: 502 });
  }
}
