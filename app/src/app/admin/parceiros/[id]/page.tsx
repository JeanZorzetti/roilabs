import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import NegociosList from './negocios-list';
import FaturasSection from './faturas-section';

export const dynamic = 'force-dynamic';

export default async function ParceiroDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const parceiro = await prisma.parceiro.findUnique({
    where: { id },
    include: { cadeira: { select: { niche: true } } },
  });
  if (!parceiro) notFound();

  const [negocios, faturas] = await Promise.all([
    prisma.negocioOriginado.findMany({
      where: { parceiroId: id },
      include: { pedido: { select: { nome: true, whatsapp: true, total: true, statusPagamento: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.faturaSuccessFee.findMany({ where: { parceiroId: id }, orderBy: { competencia: 'desc' } }),
  ]);

  return (
    <div className="page">
      <div className="page__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1>{parceiro.nome}</h1>
          <p>
            {parceiro.cadeira?.niche ?? parceiro.nicho} · {parceiro.estagio}
            {parceiro.comissaoAquisicao !== null && ` · aquisição ${(Number(parceiro.comissaoAquisicao) * 100).toFixed(1)}%`}
            {parceiro.comissaoRecorrencia !== null && ` · recorrência ${(Number(parceiro.comissaoRecorrencia) * 100).toFixed(1)}%`}
          </p>
        </div>
        <a className="btn btn--sm" href={`/admin/parceiros/${parceiro.id}/demonstrativo`}>Demonstrativo do mês</a>
      </div>

      <div className="cc-section" style={{ marginBottom: '1.5rem' }}>
        <div className="cc-section__title">Dados</div>
        <div className="cc-fields" style={{ fontSize: 14 }}>
          <span className="cc-field">WhatsApp<span>{parceiro.whatsapp ?? '—'}</span></span>
          <span className="cc-field">E-mail<span>{parceiro.email ?? '—'}</span></span>
          <span className="cc-field">Cidade<span>{parceiro.cidade ?? '—'}</span></span>
          <span className="cc-field">CPF/CNPJ<span>{parceiro.cpfCnpj ?? '— (obrigatório p/ faturar)'}</span></span>
          <span className="cc-field">Contrato<span>{parceiro.contratoEm ? parceiro.contratoEm.toISOString().slice(0, 10) : '— (não ocupa a cadeira)'}</span></span>
        </div>
      </div>

      <NegociosList
        parceiroId={parceiro.id}
        negocios={negocios.map((n) => ({
          id: n.id,
          pedidoId: n.pedidoId,
          pedidoNome: n.pedido.nome,
          pedidoWhatsapp: n.pedido.whatsapp,
          valor: Number(n.valor),
          estagio: n.estagio,
          faturavel: n.faturavel,
          isencaoMotivo: n.isencaoMotivo,
          faturaId: n.faturaId,
          pedidoReembolsado: n.pedido.statusPagamento === 'reembolsado',
        }))}
      />

      <div style={{ marginTop: '1.5rem' }}>
        <FaturasSection
          parceiroId={parceiro.id}
          podeGerar={parceiro.estagio === 'ativa' && parceiro.comissaoAquisicao !== null && parceiro.comissaoRecorrencia !== null && !!parceiro.cpfCnpj}
          faturas={faturas.map((f) => ({
            id: f.id,
            competencia: f.competencia,
            base: Number(f.base),
            valor: Number(f.valor),
            status: f.status,
            asaasPaymentId: f.asaasPaymentId,
          }))}
        />
      </div>
    </div>
  );
}
