'use client';
import { useState } from 'react';

export function PedidoRow({ id }: { id: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(acao: 'confirmar' | 'reembolsar') {
    setBusy(acao);
    setErr(null);
    const res = await fetch(`/api/pedidos/${id}/acao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr((data as { error?: string }).error ?? 'Erro desconhecido');
      return;
    }
    setDone(acao === 'confirmar' ? 'Confirmado ✓' : 'Reembolsado ✓');
  }

  if (done) return <span style={{ color: '#4ade80', fontSize: '0.82rem' }}>{done}</span>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <button
        className="btn btn--sm"
        disabled={!!busy}
        onClick={() => act('confirmar')}
        style={{ background: '#14532d', color: '#fff', border: 'none' }}
      >
        {busy === 'confirmar' ? '…' : 'Confirmar'}
      </button>
      <button
        className="btn btn--sm"
        disabled={!!busy}
        onClick={() => act('reembolsar')}
        style={{ background: '#7f1d1d', color: '#fff', border: 'none' }}
      >
        {busy === 'reembolsar' ? '…' : 'Reembolsar'}
      </button>
      {err && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{err}</span>}
    </div>
  );
}
