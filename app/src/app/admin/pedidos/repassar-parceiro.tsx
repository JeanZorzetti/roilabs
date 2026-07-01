'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ParceiroAtivo {
  id: string;
  nome: string;
  nicho: string;
}

export function RepassarParceiro({ pedidoId, parceiros }: { pedidoId: string; parceiros: ParceiroAtivo[] }) {
  const router = useRouter();
  const [parceiroId, setParceiroId] = useState('');
  const [isento, setIsento] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function repassar() {
    if (!parceiroId) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/negocios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidoId, parceiroId, isento, isencaoMotivo: motivo || undefined }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      setDone(true);
      router.refresh();
    } else {
      setMsg(json.motivo);
    }
  }

  if (done) return <span style={{ color: '#166534', fontSize: '0.82rem' }}>Repassado ✓</span>;
  if (parceiros.length === 0) return <span className="muted" style={{ fontSize: '0.78rem' }}>sem parceiro ativo</span>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 160 }}>
      <select value={parceiroId} onChange={(e) => setParceiroId(e.target.value)} style={{ fontSize: '0.78rem' }}>
        <option value="">— parceiro —</option>
        {parceiros.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome} ({p.nicho})
          </option>
        ))}
      </select>
      <label style={{ fontSize: '0.72rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
        <input type="checkbox" checked={isento} onChange={(e) => setIsento(e.target.checked)} />
        isento
      </label>
      {isento && (
        <input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="motivo da isenção"
          style={{ fontSize: '0.72rem' }}
        />
      )}
      <button className="btn btn--sm" disabled={busy || !parceiroId || (isento && !motivo)} onClick={repassar}>
        {busy ? '…' : 'Repassar'}
      </button>
      {msg && <span style={{ color: '#f87171', fontSize: '0.72rem' }}>{msg}</span>}
    </div>
  );
}
