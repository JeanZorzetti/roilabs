'use client';
import { useState } from 'react';

interface Params {
  markup: number | null;
  comissao: number | null;
  aliqIntermediacao: number | null;
  aliqWL: number | null;
  cenario?: string | null;
}

interface Linha extends Params {
  chave: string | null;
}

interface Props {
  global: Params | null;
  linhas: Linha[];
}

// Presets from D4 / projecao-financeira.md
const CENARIOS = {
  conservador: { aliqIntermediacao: 0.06, aliqWL: 0.046 },
  base: { aliqIntermediacao: 0.102, aliqWL: 0.062 },
  otimista: { aliqIntermediacao: 0.127, aliqWL: 0.078 },
};

const pct100 = (v: number | null) => (v !== null ? String(Math.round(v * 10000) / 100) : '');
const fromPct = (s: string) => parseFloat(s.replace(',', '.')) / 100;

function ParamFields({
  prefix,
  data,
  onChange,
  showCenario,
}: {
  prefix: string;
  data: Params;
  onChange: (patch: Partial<Params>) => void;
  showCenario: boolean;
}) {
  const inp: React.CSSProperties = {
    background: '#111',
    color: '#eee',
    border: '1px solid #444',
    borderRadius: 4,
    padding: '0.3rem 0.5rem',
    width: 80,
    fontFamily: 'monospace',
    fontSize: '0.85rem',
  };
  return (
    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {showCenario && (
        <div style={{ display: 'flex', gap: '0.4rem', marginRight: '0.4rem' }}>
          {Object.entries(CENARIOS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => onChange({ aliqIntermediacao: v.aliqIntermediacao, aliqWL: v.aliqWL, cenario: k })}
              style={{
                background: data.cenario === k ? '#444' : '#1a1a1a',
                color: data.cenario === k ? '#eee' : '#888',
                border: '1px solid #333',
                borderRadius: 4,
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {k}
            </button>
          ))}
          {data.cenario === 'ajustado' && (
            <span style={{ color: '#f59e0b', fontSize: '0.75rem', alignSelf: 'center' }}>ajustado</span>
          )}
        </div>
      )}
      {[
        { key: 'markup', label: 'Markup %', allowNull: !showCenario },
        { key: 'comissao', label: 'Comissão %', allowNull: !showCenario },
        { key: 'aliqIntermediacao', label: 'Alíq. Interm. %', allowNull: !showCenario },
        { key: 'aliqWL', label: 'Alíq. WL %', allowNull: !showCenario },
      ].map(({ key, label, allowNull }) => (
        <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.75rem', color: '#999' }}>
          {label}
          <input
            style={inp}
            value={pct100(data[key as keyof Params] as number | null)}
            placeholder={allowNull ? '(herda)' : ''}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '' && allowNull) {
                onChange({ [key]: null });
              } else {
                const v = fromPct(raw);
                onChange({ [key]: isNaN(v) ? (data[key as keyof Params] as number | null) : v, ...(key === 'aliqIntermediacao' || key === 'aliqWL' ? { cenario: 'ajustado' } : {}) });
              }
            }}
          />
        </label>
      ))}
    </div>
  );
}

export default function ParametrosForm({ global: init, linhas: initLinhas }: Props) {
  const [global, setGlobal] = useState<Params>(init ?? { markup: 0.3, comissao: 0.1, aliqIntermediacao: 0.102, aliqWL: 0.062, cenario: 'base' });
  const [linhas, setLinhas] = useState<Linha[]>(initLinhas);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [novaLinha, setNovaLinha] = useState('');

  async function save(escopo: string, chave: string | null, data: Params) {
    const key = escopo === 'global' ? 'global' : `linha:${chave}`;
    setSaving(key);
    setMsg(null);
    const body = { escopo, ...(chave ? { chave } : {}), ...data };
    const res = await fetch('/api/centros-custo/parametros', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(null);
    setMsg(json.ok ? '✓ Salvo' : `✗ ${json.motivo}`);
    setTimeout(() => setMsg(null), 3000);
  }

  function addLinha() {
    const nome = novaLinha.trim();
    if (!nome || linhas.some((l) => l.chave === nome)) return;
    setLinhas((prev) => [...prev, { chave: nome, markup: null, comissao: null, aliqIntermediacao: null, aliqWL: null }]);
    setNovaLinha('');
  }

  const label: React.CSSProperties = { color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 };
  const section: React.CSSProperties = { border: '1px solid #333', borderRadius: 6, padding: '1rem', marginBottom: '1rem' };

  return (
    <div>
      {msg && (
        <div style={{ color: msg.startsWith('✓') ? '#86efac' : '#f87171', marginBottom: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {msg}
        </div>
      )}

      {/* Global */}
      <div style={section}>
        <div style={{ ...label, marginBottom: '0.5rem' }}>Parâmetros globais</div>
        <ParamFields prefix="global" data={global} onChange={(p) => setGlobal((g) => ({ ...g, ...p }))} showCenario />
        <button
          disabled={saving === 'global'}
          onClick={() => save('global', null, global)}
          style={{ marginTop: '0.75rem', padding: '0.35rem 0.9rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem', opacity: saving === 'global' ? 0.5 : 1 }}
        >
          {saving === 'global' ? 'Salvando…' : 'Salvar global'}
        </button>
      </div>

      {/* Linhas */}
      {linhas.map((l) => (
        <div key={l.chave} style={section}>
          <div style={{ ...label, marginBottom: '0.5rem' }}>Linha: <strong style={{ color: '#e2e8f0' }}>{l.chave}</strong></div>
          <ParamFields
            prefix={`linha-${l.chave}`}
            data={l}
            onChange={(p) => setLinhas((prev) => prev.map((x) => x.chave === l.chave ? { ...x, ...p } : x))}
            showCenario={false}
          />
          <button
            disabled={saving === `linha:${l.chave}`}
            onClick={() => save('linha', l.chave, l)}
            style={{ marginTop: '0.75rem', padding: '0.35rem 0.9rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem', opacity: saving === `linha:${l.chave}` ? 0.5 : 1 }}
          >
            {saving === `linha:${l.chave}` ? 'Salvando…' : `Salvar linha ${l.chave}`}
          </button>
        </div>
      ))}

      {/* Nova linha */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
        <input
          value={novaLinha}
          onChange={(e) => setNovaLinha(e.target.value)}
          placeholder="Nome da nova linha (ex: premium)"
          style={{ background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 4, padding: '0.3rem 0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', width: 220 }}
          onKeyDown={(e) => e.key === 'Enter' && addLinha()}
        />
        <button onClick={addLinha} style={{ padding: '0.35rem 0.8rem', background: '#333', color: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}>
          + Linha
        </button>
      </div>
    </div>
  );
}
