'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Cupom {
  id: string;
  codigo: string;
  tipo: string;
  valor: number;
  validadeInicio: string | null; // ISO date (yyyy-mm-dd) ou null
  validadeFim: string | null;
  minimo: number | null;
  ativo: boolean;
}

type Campos = {
  codigo: string;
  tipo: string;
  valor: string;
  validadeInicio: string;
  validadeFim: string;
  minimo: string;
  ativo: boolean;
};

const toCampos = (c?: Cupom): Campos => ({
  codigo: c?.codigo ?? '',
  tipo: c?.tipo ?? 'percentual',
  valor: c ? String(c.valor) : '',
  validadeInicio: c?.validadeInicio ?? '',
  validadeFim: c?.validadeFim ?? '',
  minimo: c?.minimo !== null && c?.minimo !== undefined ? String(c.minimo) : '',
  ativo: c?.ativo ?? true,
});

function toBody(f: Campos) {
  return {
    codigo: f.codigo.trim(),
    tipo: f.tipo,
    valor: f.valor === '' ? null : Number(f.valor),
    validadeInicio: f.validadeInicio || null,
    validadeFim: f.validadeFim || null,
    minimo: f.minimo === '' ? null : Number(f.minimo),
    ativo: f.ativo,
  };
}

function CupomFields({ f, onChange }: { f: Campos; onChange: (patch: Partial<Campos>) => void }) {
  return (
    <div className="cc-fields">
      <label className="cc-field">
        Código
        <input value={f.codigo} onChange={(e) => onChange({ codigo: e.target.value })} placeholder="OBRA15" />
      </label>
      <label className="cc-field">
        Tipo
        <select value={f.tipo} onChange={(e) => onChange({ tipo: e.target.value })}>
          <option value="percentual">Percentual</option>
          <option value="fixo">Fixo (R$)</option>
        </select>
      </label>
      <label className="cc-field">
        Valor
        <input value={f.valor} onChange={(e) => onChange({ valor: e.target.value })} placeholder={f.tipo === 'percentual' ? '0–100' : 'R$'} />
      </label>
      <label className="cc-field">
        Mínimo (R$)
        <input value={f.minimo} onChange={(e) => onChange({ minimo: e.target.value })} placeholder="sem mínimo" />
      </label>
      <label className="cc-field">
        Início validade
        <input type="date" value={f.validadeInicio} onChange={(e) => onChange({ validadeInicio: e.target.value })} />
      </label>
      <label className="cc-field">
        Fim validade
        <input type="date" value={f.validadeFim} onChange={(e) => onChange({ validadeFim: e.target.value })} />
      </label>
      <label className="cc-field cc-field--check">
        <input type="checkbox" checked={f.ativo} onChange={(e) => onChange({ ativo: e.target.checked })} />
        Ativo
      </label>
    </div>
  );
}

export default function CuponsForm({ cupons: initial }: { cupons: Cupom[] }) {
  const router = useRouter();
  const [cupons, setCupons] = useState(initial);
  const [edits, setEdits] = useState<Record<string, Campos>>({});
  const [novo, setNovo] = useState<Campos>(toCampos());
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  function campos(c: Cupom): Campos {
    return edits[c.id] ?? toCampos(c);
  }

  function setMsgFor(key: string, text: string) {
    setMsg((m) => ({ ...m, [key]: text }));
    setTimeout(() => setMsg((m) => ({ ...m, [key]: '' })), 4000);
  }

  async function salvarNovo() {
    setBusy('novo');
    const res = await fetch('/api/cupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toBody(novo)),
    });
    const json = await res.json();
    setBusy(null);
    if (json.ok) {
      setNovo(toCampos());
      setMsgFor('novo', '✓ Criado');
      router.refresh();
    } else {
      setMsgFor('novo', `✗ ${json.motivo}`);
    }
  }

  async function salvar(c: Cupom) {
    setBusy(c.id);
    const res = await fetch(`/api/cupons/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toBody(campos(c))),
    });
    const json = await res.json();
    setBusy(null);
    if (json.ok) {
      setMsgFor(c.id, '✓ Salvo');
      router.refresh();
    } else {
      setMsgFor(c.id, `✗ ${json.motivo}`);
    }
  }

  async function apagar(c: Cupom) {
    if (!confirm(`Apagar o cupom "${c.codigo}"? Pedidos que já o usaram mantêm o histórico.`)) return;
    setBusy(c.id);
    await fetch(`/api/cupons/${c.id}`, { method: 'DELETE' });
    setCupons((prev) => prev.filter((x) => x.id !== c.id));
    setBusy(null);
    router.refresh();
  }

  return (
    <div>
      {/* Novo cupom */}
      <div className="cc-section">
        <div className="cc-section__title">Novo cupom</div>
        <CupomFields f={novo} onChange={(p) => setNovo((f) => ({ ...f, ...p }))} />
        <div className="cc-row-actions">
          <button className="btn btn--sm" disabled={busy === 'novo'} onClick={salvarNovo}>
            {busy === 'novo' ? 'Criando…' : 'Criar cupom'}
          </button>
          {msg.novo && <span className={msg.novo.startsWith('✓') ? 'cc-msg cc-msg--ok' : 'cc-msg cc-msg--err'}>{msg.novo}</span>}
        </div>
      </div>

      {/* Cupons existentes */}
      {cupons.map((c) => (
        <div key={c.id} className="cc-section">
          <div className="cc-section__title">
            <strong>{c.codigo}</strong>
          </div>
          <CupomFields
            f={campos(c)}
            onChange={(p) => setEdits((prev) => ({ ...prev, [c.id]: { ...campos(c), ...p } }))}
          />
          <div className="cc-row-actions">
            <button className="btn btn--sm" disabled={busy === c.id} onClick={() => salvar(c)}>
              {busy === c.id ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              className="btn btn--sm btn--ghost"
              disabled={busy === c.id}
              onClick={() => apagar(c)}
              style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
            >
              Apagar
            </button>
            {msg[c.id] && <span className={msg[c.id].startsWith('✓') ? 'cc-msg cc-msg--ok' : 'cc-msg cc-msg--err'}>{msg[c.id]}</span>}
          </div>
        </div>
      ))}

      {cupons.length === 0 && <p className="cc-note">Nenhum cupom cadastrado ainda.</p>}
    </div>
  );
}
