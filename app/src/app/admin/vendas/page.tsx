import { prisma } from '@/lib/prisma';
import { calcularFaturaMensal } from '@/lib/success-fee';
import VendaForm from './venda-form';
import FaturasSection from './faturas-section';

export const dynamic = 'force-dynamic';

// Vendas dos parceiros e a comissão de cada uma (30/09/2026). Volta, numa tela só, o que a
// /admin/parceiros fazia antes de 28/09 (lista de negócios + faturas) e soma o registro de
// venda fechada fora do site. O "a faturar" sai de calcularFaturaMensal, a MESMA conta que a
// rota /api/faturas faz: a tela não pode prometer um valor que a fatura não cobra.
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (t: number) => `${Math.round(t * 1000) / 10}%`.replace('.', ',');
const dia = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
// O .cc-table global alinha à direita as colunas 2, 3, 7 e 8 (feito para o centro de custo):
// aqui cada cabeçalho diz o seu, casando com a célula.
const ESQ = { textAlign: 'left' } as const;
const DIR = { textAlign: 'right' } as const;
const TIPO: Record<string, string> = { aquisicao: '1ª compra', recorrencia: 'Recompra', legado: 'Anterior à regra' };

export default async function VendasPage() {
  const parceiros = await prisma.parceiro.findMany({
    where: { estagio: 'ativa', NOT: { cadeira: { daCasa: true } } },
    orderBy: { nome: 'asc' },
    include: {
      negocios: {
        orderBy: { createdAt: 'desc' },
        include: {
          venda: { select: { pagamentoId: true, clienteRef: true } },
          pedido: { select: { nome: true, statusPagamento: true } },
          fatura: { select: { competencia: true } },
        },
      },
      faturas: { orderBy: { competencia: 'desc' } },
    },
  });

  return (
    <div className="page">
      <div className="page__head">
        <h1>Vendas</h1>
        <p>Vendas dos parceiros ativos e a comissão de cada uma.</p>
      </div>

      <VendaForm parceiros={parceiros.map((p) => ({ id: p.id, nome: p.nome }))} />

      {/* Quem tem venda primeiro; o resto em ordem alfabética (a query já ordena por nome). */}
      {[...parceiros].sort((a, b) => Number(b.negocios.length > 0) - Number(a.negocios.length > 0)).map((p) => {
        const calc = calcularFaturaMensal(
          p.negocios
            .filter((n) => n.faturaId === null)
            .map((n) => ({
              id: n.id,
              valor: Number(n.valor),
              taxaAplicada: Number(n.taxaAplicada),
              estagio: n.estagio,
              faturavel: n.faturavel,
              pedidoReembolsado: n.pedido?.statusPagamento === 'reembolsado',
              jaFaturado: false,
            })),
        );
        const aFaturar = new Set(calc.negocioIds);
        // Competência sugerida = mês (de Brasília) da venda mais recente a faturar: a fatura leva
        // todas as vendas pendentes, e o rótulo não pode ser um mês anterior a elas.
        const ultima = p.negocios.find((n) => aFaturar.has(n.id))?.createdAt ?? new Date();
        const competenciaSugerida = ultima.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);
        const bloqueio = !p.cpfCnpj
          ? 'Sem o CNPJ do parceiro a fatura não sai: o Asaas cobra pelo CNPJ.'
          : calc.negocioIds.length === 0
            ? 'Nenhuma venda a faturar.'
            : null;
        const titulo = `vendas-${p.id}`;

        return (
          <section key={p.id} className="cc-section" aria-labelledby={titulo}>
            <h2 id={titulo} className="cc-section__title">{p.nome}</h2>
            <p className="cc-note">
              {p.nicho} · {p.comissaoAquisicao !== null ? pct(Number(p.comissaoAquisicao)) : '—'} na 1ª compra,{' '}
              {p.comissaoRecorrencia !== null ? pct(Number(p.comissaoRecorrencia)) : '—'} na recompra
              {calc.negocioIds.length > 0 && <> · <strong>a faturar: {brl(calc.valor)}</strong></>}
            </p>

            {p.negocios.length === 0 ? (
              <p className="muted" style={{ marginTop: '0.75rem' }}>Nenhuma venda registrada ainda.</p>
            ) : (
              <table className="cc-table" aria-labelledby={titulo} style={{ marginTop: '0.75rem' }}>
                <thead>
                  <tr>
                    <th scope="col" style={ESQ}>Data</th>
                    <th scope="col" style={ESQ}>Orçamento</th>
                    <th scope="col" style={ESQ}>Cliente</th>
                    <th scope="col" style={DIR}>Valor</th>
                    <th scope="col" style={ESQ}>Tipo</th>
                    <th scope="col" style={DIR}>Comissão</th>
                    <th scope="col" style={ESQ}>Fatura</th>
                  </tr>
                </thead>
                <tbody>
                  {p.negocios.map((n) => {
                    const valor = Number(n.valor);
                    const taxa = Number(n.taxaAplicada);
                    return (
                      <tr key={n.id}>
                        <td>{dia(n.createdAt)}</td>
                        <td className="mono">{n.venda?.pagamentoId ?? (n.pedidoId ? 'Pedido do site' : '—')}</td>
                        <td>{n.pedido?.nome ?? n.venda?.clienteRef ?? '—'}</td>
                        <td className="num">{brl(valor)}</td>
                        <td>{TIPO[n.classificacao ?? ''] ?? '—'}</td>
                        <td className="num">{brl(Math.round(valor * taxa * 100) / 100)} ({pct(taxa)})</td>
                        <td>
                          {n.fatura
                            ? `Faturada em ${n.fatura.competencia}`
                            : aFaturar.has(n.id)
                              ? 'A faturar'
                              : 'Fora da fatura'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <FaturasSection
              parceiroId={p.id}
              nome={p.nome}
              aFaturar={calc.valor}
              competenciaSugerida={competenciaSugerida}
              bloqueio={bloqueio}
              faturas={p.faturas.map((f) => ({
                id: f.id,
                competencia: f.competencia,
                base: Number(f.base),
                valor: Number(f.valor),
                status: f.status,
                asaasPaymentId: f.asaasPaymentId,
              }))}
            />
          </section>
        );
      })}
    </div>
  );
}
