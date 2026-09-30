import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { lerVendaManual } from '@/lib/carteira/venda-manual';
import { classificarVendaParceiro } from '@/lib/carteira/classificar-venda';
import { validarOrigemNegocio } from '@/lib/carteira/origem-negocio';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

// POST — registra uma venda do parceiro fechada fora do carrinho e do gateway (orçamento no
// WhatsApp). Grava a VendaParceiro (gateway='manual', payload = a prova) e o negócio de
// origem 'manual', já 'ganho': a venda chega aqui fechada. Mesma classificação e taxa
// congelada do webhook (lib/carteira/registrar-venda.ts).
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const lido = lerVendaManual(body);
  if (!lido.ok) return NextResponse.json({ ok: false, motivo: lido.motivo }, { status: 400 });
  const v = lido.venda;

  const parceiro = await prisma.parceiro.findUnique({
    where: { id: v.parceiroId },
    include: { cadeira: { select: { daCasa: true } } },
  });
  if (!parceiro || parceiro.estagio !== 'ativa') {
    return NextResponse.json({ ok: false, motivo: 'Esse parceiro não está ativo.' }, { status: 400 });
  }
  // FR-010: cadeira da casa não gera comissão, por nenhum caminho.
  if (parceiro.cadeira?.daCasa) {
    return NextResponse.json({ ok: false, motivo: 'Cadeira da casa não gera comissão.' }, { status: 400 });
  }
  if (parceiro.comissaoAquisicao === null || parceiro.comissaoRecorrencia === null) {
    return NextResponse.json({ ok: false, motivo: 'Esse parceiro está sem as taxas de comissão.' }, { status: 400 });
  }

  // O nº do orçamento é por parceiro: a mesma venda não entra duas vezes.
  const repetida = await prisma.vendaParceiro.findFirst({
    where: { gateway: 'manual', parceiroId: parceiro.id, pagamentoId: v.orcamento },
  });
  if (repetida) {
    return NextResponse.json({ ok: false, motivo: `O orçamento ${v.orcamento} já está registrado.` }, { status: 409 });
  }

  // Anteriores não-perdidos e não-revertidos do mesmo parceiro (FR-008), como no webhook.
  const anteriores = await prisma.negocioOriginado.findMany({
    where: { parceiroId: parceiro.id, estagio: { not: 'perdido' } },
    select: {
      clienteDoc: true,
      clienteRef: true,
      pedido: { select: { statusPagamento: true } },
      venda: { select: { status: true } },
    },
  });
  const vivos = anteriores.filter(
    (n) =>
      n.pedido?.statusPagamento !== 'reembolsado' &&
      n.venda?.status !== 'reembolsada' &&
      n.venda?.status !== 'estornada',
  );
  // Sem documento, o nome do cliente é a chave de recompra (o clienteRef do webhook).
  const clienteRef = v.cliente.toUpperCase();
  const classificacao = classificarVendaParceiro({
    recorrente: false,
    clienteDoc: v.clienteDoc ?? '',
    clienteRef,
    docsAnteriores: vivos.map((n) => n.clienteDoc ?? '').filter(Boolean),
    refsAnteriores: vivos.map((n) => (n.clienteRef ?? '').toUpperCase()).filter(Boolean),
  });
  const taxaAplicada = classificacao === 'aquisicao' ? parceiro.comissaoAquisicao : parceiro.comissaoRecorrencia;
  const quando = new Date(`${v.data}T12:00:00-03:00`);

  const negocio = await prisma.$transaction(async (tx) => {
    const venda = await tx.vendaParceiro.create({
      data: {
        parceiroId: parceiro.id,
        gateway: 'manual',
        eventoId: `${parceiro.id}:${v.orcamento}`,
        pagamentoId: v.orcamento,
        valor: v.valor,
        status: 'aprovada',
        recorrente: false,
        clienteDoc: v.clienteDoc,
        clienteRef,
        recebidoEm: quando,
        payload: { fonte: 'registro manual no /admin/vendas', orcamento: v.orcamento, data: v.data, cliente: v.cliente, canal: v.canal, valorSemFrete: v.valor },
      },
    });
    const dados = { origem: 'manual', pedidoId: null, vendaId: venda.id };
    const check = validarOrigemNegocio(dados);
    if (!check.ok) throw new Error(check.motivo);
    return tx.negocioOriginado.create({
      data: {
        ...dados,
        parceiroId: parceiro.id,
        valor: v.valor,
        estagio: 'ganho',
        faturavel: true,
        clienteDoc: v.clienteDoc,
        clienteRef,
        classificacao,
        taxaAplicada,
        createdAt: quando,
      },
    });
  });

  const taxa = Number(taxaAplicada);
  const comissao = Math.round(v.valor * taxa * 100) / 100;
  log.info({ negocioId: negocio.id, parceiroId: parceiro.id, classificacao }, 'carteira: venda manual registrada');
  return NextResponse.json({ ok: true, id: negocio.id, classificacao, taxa, comissao }, { status: 201 });
}
