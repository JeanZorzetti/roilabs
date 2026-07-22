import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { calcularFaturaMensal } from '@/lib/success-fee';
import PrintButton from './print-button';

export const dynamic = 'force-dynamic';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const money = (n: number) => Math.round(n * 100) / 100;
const pctLabel = (v: number | null) => (v !== null ? `${(v * 100).toFixed(1)}%` : '—');
const CLASSIF_LABEL: Record<string, string> = { aquisicao: 'aquisição', recorrencia: 'recorrência', legado: 'legado' };
const mesAtual = () => new Date().toISOString().slice(0, 7);
const nomeMes = (mes: string) =>
  new Date(`${mes}-15T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export default async function DemonstrativoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { id } = await params;
  const { mes: mesParam } = await searchParams;
  const mes = /^\d{4}-\d{2}$/.test(mesParam ?? '') ? (mesParam as string) : mesAtual();

  const parceiro = await prisma.parceiro.findUnique({
    where: { id },
    include: { cadeira: { select: { niche: true } } },
  });
  if (!parceiro) notFound();

  const inicio = new Date(`${mes}-01T00:00:00Z`);
  const fim = new Date(inicio);
  fim.setUTCMonth(fim.getUTCMonth() + 1);

  const [negocios, fatura] = await Promise.all([
    prisma.negocioOriginado.findMany({
      where: { parceiroId: id, createdAt: { gte: inicio, lt: fim } },
      include: { pedido: { select: { nome: true, statusPagamento: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.faturaSuccessFee.findUnique({
      where: { parceiroId_competencia: { parceiroId: id, competencia: mes } },
    }),
  ]);

  const aquisicao = parceiro.comissaoAquisicao === null ? null : Number(parceiro.comissaoAquisicao);
  const recorrencia = parceiro.comissaoRecorrencia === null ? null : Number(parceiro.comissaoRecorrencia);
  // Fatura emitida = autoridade (snapshot congelado). Sem fatura = prévia somada por negócio agora.
  const previa =
    fatura === null
      ? calcularFaturaMensal(
          negocios.map((n) => ({
            id: n.id,
            valor: Number(n.valor),
            taxaAplicada: Number(n.taxaAplicada),
            estagio: n.estagio,
            faturavel: n.faturavel,
            pedidoReembolsado: n.pedido.statusPagamento === 'reembolsado',
            jaFaturado: n.faturaId !== null,
          })),
        )
      : null;
  const naFatura = new Set(fatura ? negocios.filter((n) => n.faturaId === fatura.id).map((n) => n.id) : previa?.negocioIds ?? []);
  const base = fatura ? Number(fatura.base) : previa?.base ?? null;
  const valor = fatura ? Number(fatura.valor) : previa?.valor ?? null;

  return (
    <div className="page demo-page">
      <div className="demo-toolbar">
        <Link href={`/admin/parceiros/${id}`} className="btn btn--ghost btn--sm">← Voltar ao parceiro</Link>
        <form method="GET" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="month" name="mes" defaultValue={mes} />
          <button className="btn btn--sm" type="submit">Ver mês</button>
        </form>
        <PrintButton />
      </div>

      <div className="demo-sheet">
        <header className="demo-head">
          <div>
            <div className="demo-brand">ROI LABS</div>
            <div className="muted" style={{ fontSize: 13 }}>Growth Partner · pago pelo sucesso</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Demonstrativo de success fee</h1>
            <div className="muted" style={{ fontSize: 14 }}>Competência: {nomeMes(mes)}</div>
          </div>
        </header>

        <div className="cc-fields" style={{ fontSize: 14, marginBottom: '1.25rem' }}>
          <span className="cc-field">Parceiro<span>{parceiro.nome}</span></span>
          <span className="cc-field">Nicho<span>{parceiro.cadeira?.niche ?? parceiro.nicho}</span></span>
          <span className="cc-field">CPF/CNPJ<span>{parceiro.cpfCnpj ?? '—'}</span></span>
          <span className="cc-field">Taxa aquisição<span>{pctLabel(aquisicao)}</span></span>
          <span className="cc-field">Taxa recorrência<span>{pctLabel(recorrencia)}</span></span>
        </div>

        <table className="fin-table">
          <thead>
            <tr>
              <th>Data</th>
              <th style={{ textAlign: 'left' }}>Cliente (pedido repassado)</th>
              <th>Valor (produto)</th>
              <th>Classificação</th>
              <th>Taxa</th>
              <th>Success fee</th>
              <th>Na fatura?</th>
            </tr>
          </thead>
          <tbody>
            {negocios.map((n) => {
              const reemb = n.pedido.statusPagamento === 'reembolsado';
              const fora = !n.faturavel ? `isento — ${n.isencaoMotivo ?? 'sem motivo'}`
                : reemb ? 'reembolsado'
                : n.estagio !== 'ganho' ? 'em andamento'
                : null;
              const taxa = Number(n.taxaAplicada);
              const incluido = naFatura.has(n.id);
              const subtotal = incluido ? money(Number(n.valor) * taxa) : null;
              return (
                <tr key={n.id}>
                  <td className="num">{n.createdAt.toISOString().slice(0, 10)}</td>
                  <td>{n.pedido.nome}</td>
                  <td className="num">{brl(Number(n.valor))}</td>
                  <td>{n.classificacao ? CLASSIF_LABEL[n.classificacao] ?? n.classificacao : '—'}</td>
                  <td className="num">{pctLabel(taxa)}</td>
                  <td className="num">{subtotal !== null ? brl(subtotal) : '—'}</td>
                  <td style={fora ? { color: 'var(--l-muted)' } : { color: 'var(--green, #166534)', fontWeight: 700 }}>
                    {fora ?? 'sim'}
                  </td>
                </tr>
              );
            })}
            {negocios.length === 0 && (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  Nenhum negócio repassado nesta competência.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Base (soma dos negócios faturáveis)</td>
              <td className="num">{base !== null ? brl(base) : '—'}</td>
              <td colSpan={4} />
            </tr>
            <tr>
              <td colSpan={2}>Success fee (soma por negócio)</td>
              <td className="num" style={{ fontWeight: 800 }} colSpan={4}>{valor !== null && Number.isFinite(valor) ? brl(valor) : '—'}</td>
            </tr>
          </tfoot>
        </table>

        <p className="muted demo-status" style={{ fontSize: 13, marginTop: '1rem' }}>
          {fatura
            ? `Fatura ${fatura.status} (snapshot congelado no fechamento).`
            : aquisicao !== null && recorrencia !== null
              ? 'Prévia — a fatura desta competência ainda não foi gerada; valores podem mudar até o fechamento.'
              : 'Parceiro sem as duas taxas — defina aquisição e recorrência para calcular o valor.'}
          {' '}Base = total do pedido − frete. Reembolsos e isenções não entram na cobrança.
        </p>
      </div>
    </div>
  );
}
