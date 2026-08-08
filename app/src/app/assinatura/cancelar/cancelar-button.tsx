'use client';
import { useState } from 'react';

// Botão único, sem opção de desfazer (não existe reativação — data-model.md).
export function CancelarButton({ token }: { token: string }) {
  const [estado, setEstado] = useState<'idle' | 'busy' | 'ok' | 'erro'>('idle');

  async function cancelar() {
    if (!confirm('Cancelar esta assinatura? Não é possível desfazer.')) return;
    setEstado('busy');
    const res = await fetch('/api/assinaturas/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    setEstado(res.ok ? 'ok' : 'erro');
  }

  if (estado === 'ok') return <p>Assinatura cancelada. Você pode fechar esta página.</p>;

  return (
    <>
      <button className="btn" type="button" disabled={estado === 'busy'} onClick={cancelar}>
        {estado === 'busy' ? 'Cancelando…' : 'Cancelar assinatura'}
      </button>
      {estado === 'erro' && <p className="err">Não foi possível cancelar agora. Tente de novo em instantes.</p>}
    </>
  );
}
