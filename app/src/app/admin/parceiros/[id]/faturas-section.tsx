'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Fatura {
  id: string;
  competencia: string;
  base: number;
  valor: number;
  status: string;
  asaasPaymentId: string | null;
}

const STATUS_COLOR: Record<string, string> = { emitida: '#1d4ed8', paga: '#166534', erro: '#7f1d1d' };
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const mesAtual = () => new Date().toISOString().slice(0, 7);

export default function FaturasSection({
  parceiroId,
  podeGerar,
  faturas: initial,
}: {
  parceiroId: string;
  podeGerar: boolean;
  faturas: Fatura[];
}) {
  const router = useRouter();
  const [faturas] = useState(initial);
  const [competencia, setCompetencia] = useState(mesAtual());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function gerar() {
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/faturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parceiroId, competencia }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      setMsg(`✓ Fatura gerada — ${brl(json.valor)}`);
      router.refresh();
    } else {
      setMsg(`✗ ${json.motivo}`);
    }
  }

  return (
    <div className="cc-section">
      <div className="cc-section__title">Faturas (success fee)</div>

      {podeGerar ? (
        <div className="cc-row-actions" style={{ marginBottom: '1rem' }}>
          <input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} />
          <button className="btn btn--sm" disabled={busy} onClick={gerar}>
            {busy ? 'Gerando…' : 'Gerar fatura do mês'}
          </button>
          {msg && <span className={msg.startsWith('✓') ? 'cc-msg cc-msg--ok' : 'cc-msg cc-msg--err'}>{msg}</span>}
        </div>
      ) : (
        <p className="cc-note">Parceiro precisa estar <strong>ativa</strong>, com <strong>%</strong> e <strong>CPF/CNPJ</strong> para faturar.</p>
      )}

      <table className="cc-table">
        <thead>
          <tr>
            <th>Competência</th>
            <th>Base</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Cobrança Asaas</th>
          </tr>
        </thead>
        <tbody>
          {faturas.map((f) => (
            <tr key={f.id}>
              <td>
                <a href={`/admin/parceiros/${parceiroId}/demonstrativo?mes=${f.competencia}`} style={{ color: 'inherit' }}>
                  {f.competencia}
                </a>
              </td>
              <td className="num">{brl(f.base)}</td>
              <td className="num">{brl(f.valor)}</td>
              <td style={{ color: STATUS_COLOR[f.status], fontWeight: 700 }}>{f.status}</td>
              <td className="mono" style={{ fontSize: 12 }}>{f.asaasPaymentId ?? '—'}</td>
            </tr>
          ))}
          {faturas.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem' }} className="muted">
                Nenhuma fatura ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
