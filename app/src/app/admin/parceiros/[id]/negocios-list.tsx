'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Negocio {
  id: string;
  // 012: null quando origem='webhook' — venda no gateway do parceiro, sem pedido interno.
  pedidoId: string | null;
  pedidoNome: string;
  pedidoWhatsapp: string;
  valor: number;
  estagio: string;
  faturavel: boolean;
  isencaoMotivo: string | null;
  faturaId: string | null;
  pedidoReembolsado: boolean;
}

const ESTAGIOS = ['repassado', 'aceito', 'ganho', 'perdido'] as const;
const ESTAGIO_COLOR: Record<string, string> = { repassado: '#1d4ed8', aceito: '#92400e', ganho: '#166534', perdido: '#7f1d1d' };
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function NegociosList({ parceiroId, negocios: initial }: { parceiroId: string; negocios: Negocio[] }) {
  const router = useRouter();
  const [negocios] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  function setMsgFor(key: string, text: string) {
    setMsg((m) => ({ ...m, [key]: text }));
    setTimeout(() => setMsg((m) => ({ ...m, [key]: '' })), 4000);
  }

  async function avancar(n: Negocio, estagio: string) {
    setBusy(n.id);
    const res = await fetch(`/api/negocios/${n.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estagio }),
    });
    const json = await res.json();
    setBusy(null);
    if (json.ok) {
      setMsgFor(n.id, '✓ Salvo');
      router.refresh();
    } else {
      setMsgFor(n.id, `✗ ${json.motivo}`);
    }
  }

  return (
    <div className="cc-section">
      <div className="cc-section__title">
        Negócios · {parceiroId ? `${negocios.length} registrado(s)` : ''}
      </div>
      <table className="cc-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Valor</th>
            <th>Estágio</th>
            <th>Faturável</th>
            <th>Fatura</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {negocios.map((n) => (
            <tr key={n.id}>
              <td>
                <div>{n.pedidoNome}</div>
                <div className="muted" style={{ fontSize: 12 }}>{n.pedidoWhatsapp}</div>
              </td>
              <td className="num">{brl(n.valor)}</td>
              <td>
                {n.faturaId ? (
                  <span style={{ color: ESTAGIO_COLOR[n.estagio], fontWeight: 700 }}>{n.estagio}</span>
                ) : (
                  <select
                    value={n.estagio}
                    disabled={busy === n.id}
                    onChange={(e) => avancar(n, e.target.value)}
                    style={{ color: ESTAGIO_COLOR[n.estagio], fontWeight: 700 }}
                  >
                    {ESTAGIOS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                )}
              </td>
              <td>
                {n.faturavel ? (
                  <span style={{ color: '#166534' }}>sim</span>
                ) : (
                  <span className="muted" title={n.isencaoMotivo ?? ''}>isento{n.isencaoMotivo ? ` (${n.isencaoMotivo})` : ''}</span>
                )}
                {n.pedidoReembolsado && <div style={{ color: '#7f1d1d', fontSize: 12 }}>pedido reembolsado</div>}
              </td>
              <td>{n.faturaId ? <span style={{ color: '#166534' }}>faturado</span> : <span className="muted">—</span>}</td>
              <td>{msg[n.id] && <span className={msg[n.id].startsWith('✓') ? 'cc-msg cc-msg--ok' : 'cc-msg cc-msg--err'}>{msg[n.id]}</span>}</td>
            </tr>
          ))}
          {negocios.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }} className="muted">
                Nenhum negócio repassado ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
