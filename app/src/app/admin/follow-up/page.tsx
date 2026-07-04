import { filaFollowUp } from '@/lib/follow-up';
import { waLeadLink, waPedidoLink } from '@/lib/wa';
import { MarkContacted } from './mark-contacted';

export const dynamic = 'force-dynamic';

type Lead = Awaited<ReturnType<typeof filaFollowUp>>['carrinhos'][number];

const idade = (d: Date) => {
  const h = Math.floor((Date.now() - d.getTime()) / 3_600_000);
  return h < 48 ? `${h}h` : `${Math.floor(h / 24)}d`;
};

function Fila({ titulo, dica, leads }: { titulo: string; dica: string; leads: Lead[] }) {
  return (
    <section className="painel-section">
      <div className="painel-section__title">
        {titulo} · {leads.length}
      </div>
      {leads.length === 0 ? (
        <p className="empty">Fila zerada 🎉</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--l-line)' }}>
              {['Nome', 'Contexto', 'Espera', 'Ações'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const cartLink = l.mensagem?.match(/https?:\/\/\S+/)?.[0];
              return (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--l-line)', verticalAlign: 'top' }}>
                  <td style={{ padding: '0.6rem 0.8rem' }}>
                    <div>{l.nome}</div>
                    <div style={{ color: 'var(--l-muted)', fontSize: '0.78rem' }}>{l.whatsapp}</div>
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', color: 'var(--l-muted)' }}>
                    {l.produto ?? '—'}
                    {cartLink && (
                      <>
                        {' · '}
                        <a href={cartLink} target="_blank" rel="noopener">carrinho →</a>
                      </>
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap', color: 'var(--l-muted)' }}>
                    {idade(l.createdAt)}
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>
                    <a
                      href={waLeadLink(l)}
                      target="_blank"
                      rel="noopener"
                      style={{ background: 'var(--green-strong)', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: 5, textDecoration: 'none', fontWeight: 600, marginRight: '0.6rem' }}
                    >
                      Chamar no WhatsApp
                    </a>
                    <MarkContacted id={l.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>{dica}</p>
    </section>
  );
}

type PedidoPendente = Awaited<ReturnType<typeof filaFollowUp>>['pendentes'][number];

const brl = (n: unknown) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function FilaPedidos({ pedidos }: { pedidos: PedidoPendente[] }) {
  return (
    <section className="painel-section">
      <div className="painel-section__title">💳 Pedido criado sem pagamento · {pedidos.length}</div>
      {pedidos.length === 0 ? (
        <p className="empty">Fila zerada 🎉</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--l-line)' }}>
              {['Nome', 'Total', 'Espera', 'Ações'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--l-line)', verticalAlign: 'top' }}>
                <td style={{ padding: '0.6rem 0.8rem' }}>
                  <div>{p.nome}</div>
                  <div style={{ color: 'var(--l-muted)', fontSize: '0.78rem' }}>{p.whatsapp}</div>
                </td>
                <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>{brl(p.total)}</td>
                <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap', color: 'var(--l-muted)' }}>
                  {idade(p.createdAt)}
                </td>
                <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>
                  <a
                    href={waPedidoLink(p)}
                    target="_blank"
                    rel="noopener"
                    style={{ background: 'var(--green-strong)', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: 5, textDecoration: 'none', fontWeight: 600, marginRight: '0.6rem' }}
                  >
                    Chamar no WhatsApp
                  </a>
                  <a href="/admin/pedidos" style={{ color: 'var(--l-muted)', fontSize: '0.78rem' }}>pedido →</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>
        Chegou ao checkout e não pagou — o lead mais quente da casa (template de recuperação pronto).
        Sai da fila quando o pedido vira pago/reembolsado em Pedidos, ou após 14 dias.
      </p>
    </section>
  );
}

export default async function FollowUpPage() {
  const { carrinhos, frios, pendentes } = await filaFollowUp();

  return (
    <div className="page">
      <div className="page__head">
        <h1>Follow-up</h1>
        <p>
          {carrinhos.length + frios.length + pendentes.length} contatos precisando de ação · &quot;Contatado ✓&quot; tira leads da fila.
        </p>
      </div>

      <FilaPedidos pedidos={pendentes} />
      <Fila
        titulo="🛒 Carrinho sem pedido pago"
        dica="Lead que salvou o carrinho e não fechou. Recente = quente: chamar agora converte."
        leads={carrinhos}
      />
      <Fila
        titulo="🧊 Sem resposta há 48h+"
        dica="Lead sem carrinho parado em 'novo'. Um oi educado reativa — ou marque como contatado/perdido."
        leads={frios}
      />
    </div>
  );
}
