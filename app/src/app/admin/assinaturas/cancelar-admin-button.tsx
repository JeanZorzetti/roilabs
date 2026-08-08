'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Mesma função (cancelarAssinatura) que o self-service usa, só que atrás do login (T024).
export function CancelarAdminButton({ id, slug }: { id: string; slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cancelar() {
    if (!confirm(`Cancelar a assinatura "${slug}"? Não é possível desfazer.`)) return;
    setBusy(true);
    await fetch('/api/assinaturas/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button type="button" className="card__del" disabled={busy} onClick={cancelar}>
      {busy ? 'Cancelando…' : 'Cancelar'}
    </button>
  );
}
