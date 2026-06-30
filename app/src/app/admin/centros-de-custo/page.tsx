import { prisma } from '@/lib/prisma';
import { listarProdutos } from '@/lib/precos';
import { PARAMS, atacadoDe, calcIntermediacao, calcWL } from '@/lib/centros-custo';

export const dynamic = 'force-dynamic';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export default async function CentrosDeCustoPage() {
  // Catálogo (por m², a unidade nativa do preço minerado).
  const produtos = listarProdutos().map((p) => {
    const atacado = atacadoDe(p.preco);
    return { ...p, atacado, inter: calcIntermediacao(p.preco, atacado), wl: calcWL(p.preco, atacado) };
  });

  // Agregado sobre os pedidos REAIS pagos. Centro de custo = o líquido que a operação
  // renderia se toda a venda fosse intermediação vs. se fosse WL. Usa só o produto
  // (item.subtotal); frete e cupom são repasse/desconto, fora da margem da mercadoria.
  const itens = await prisma.itemPedido.findMany({
    where: { pedido: { statusPagamento: 'pago' } },
    select: { subtotal: true },
  });
  const real = itens.reduce(
    (acc, it) => {
      const varejo = Number(it.subtotal);
      const atacado = atacadoDe(varejo);
      acc.gmv += varejo;
      acc.inter += calcIntermediacao(varejo, atacado).liquido;
      acc.wl += calcWL(varejo, atacado).liquido;
      return acc;
    },
    { gmv: 0, inter: 0, wl: 0 },
  );

  const th: React.CSSProperties = { textAlign: 'right', padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { textAlign: 'right', padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' };

  return (
    <div className="page">
      <div className="page__head">
        <h1>Centros de custo</h1>
        <p>
          A mesma venda vista por dois centros: <strong>Intermediação</strong> (comissão {pct(PARAMS.comissao)} +
          excedente, imposto de serviço {pct(PARAMS.aliqIntermediacao)}) e <strong>White Label</strong> (spread,
          imposto sobre o GMV {pct(PARAMS.aliqWL)}). Atacado estimado por markup {pct(PARAMS.markup)} sobre o varejo
          minerado — substituir pelo piso real quando o fornecedor fechar.
        </p>
      </div>

      {/* Agregado dos pedidos pagos */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          ['GMV pago', brl(real.gmv), '#888'],
          ['Centro Intermediação (líq.)', brl(real.inter), '#86efac'],
          ['Centro White Label (líq.)', brl(real.wl), '#93c5fd'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ border: '1px solid #333', borderRadius: 6, padding: '0.9rem 1.1rem', minWidth: 200 }}>
            <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <div style={{ color, fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
          </div>
        ))}
        <div style={{ alignSelf: 'center', color: '#666', fontSize: '0.8rem' }}>
          {itens.length} item(ns) de pedidos pagos · diferença{' '}
          <strong style={{ color: real.inter >= real.wl ? '#86efac' : '#93c5fd' }}>
            {brl(Math.abs(real.inter - real.wl))}
          </strong>{' '}
          a favor de {real.inter >= real.wl ? 'Intermediação' : 'White Label'}
        </div>
      </div>

      {/* Catálogo: líquido por m² em cada centro */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <th style={{ ...th, textAlign: 'left' }}>Produto (slug)</th>
            <th style={th}>Varejo/m²</th>
            <th style={th}>Atacado/m²</th>
            <th style={th}>Interm. líq./m²</th>
            <th style={th}>WL líq./m²</th>
            <th style={th}>Vence</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => {
            const interWins = p.inter.liquido >= p.wl.liquido;
            return (
              <tr key={p.slug} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ ...td, textAlign: 'left', color: '#ccc' }}>{p.slug.replace('porcelanato-', '')}</td>
                <td style={td}>{brl(p.preco)}</td>
                <td style={{ ...td, color: '#888' }}>{brl(p.atacado)}</td>
                <td style={{ ...td, color: interWins ? '#86efac' : '#ccc', fontWeight: interWins ? 700 : 400 }}>
                  {brl(p.inter.liquido)}
                </td>
                <td style={{ ...td, color: !interWins ? '#93c5fd' : '#ccc', fontWeight: !interWins ? 700 : 400 }}>
                  {brl(p.wl.liquido)}
                </td>
                <td style={{ ...td, color: interWins ? '#86efac' : '#93c5fd' }}>{interWins ? 'Interm.' : 'WL'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
