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
  data,
  onChange,
  showCenario,
}: {
  data: Params;
  onChange: (patch: Partial<Params>) => void;
  showCenario: boolean;
}) {
  const fields = [
    { key: 'markup', label: 'Markup %' },
    { key: 'comissao', label: 'Comissão %' },
    { key: 'aliqIntermediacao', label: 'Alíq. Interm. %' },
    { key: 'aliqWL', label: 'Alíq. WL %' },
  ] as const;

  return (
    <div className="cc-fields">
      {showCenario && (
        <div className="cc-presets">
          {Object.entries(CENARIOS).map(([k, v]) => (
            <button
              key={k}
              className={`cc-preset ${data.cenario === k ? 'is-active' : ''}`}
              onClick={() => onChange({ aliqIntermediacao: v.aliqIntermediacao, aliqWL: v.aliqWL, cenario: k })}
            >
              {k}
            </button>
          ))}
          {data.cenario === 'ajustado' && <span className="cc-preset__flag">ajustado</span>}
        </div>
      )}
      {fields.map(({ key, label }) => {
        const allowNull = !showCenario; // linhas herdam (placeholder), global mantém
        return (
          <label key={key} className="cc-field">
            {label}
            <input
              value={pct100(data[key])}
              placeholder={allowNull ? 'herda' : ''}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '' && allowNull) {
                  onChange({ [key]: null });
                } else {
                  const v = fromPct(raw);
                  const isAliq = key === 'aliqIntermediacao' || key === 'aliqWL';
                  onChange({
                    [key]: isNaN(v) ? data[key] : v,
                    ...(isAliq && showCenario ? { cenario: 'ajustado' } : {}),
                  });
                }
              }}
            />
          </label>
        );
      })}
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

  return (
    <div>
      {msg && <div className={`cc-msg ${msg.startsWith('✓') ? 'cc-msg--ok' : 'cc-msg--err'}`} style={{ marginBottom: '0.75rem' }}>{msg}</div>}

      {/* Global */}
      <div className="cc-section">
        <div className="cc-section__title">Parâmetros globais</div>
        <ParamFields data={global} onChange={(p) => setGlobal((g) => ({ ...g, ...p }))} showCenario />
        <div className="cc-row-actions">
          <button className="btn btn--sm" disabled={saving === 'global'} onClick={() => save('global', null, global)}>
            {saving === 'global' ? 'Salvando…' : 'Salvar global'}
          </button>
        </div>
      </div>

      {/* Linhas */}
      {linhas.map((l) => (
        <div key={l.chave} className="cc-section">
          <div className="cc-section__title">Linha: <strong>{l.chave}</strong></div>
          <ParamFields
            data={l}
            onChange={(p) => setLinhas((prev) => prev.map((x) => (x.chave === l.chave ? { ...x, ...p } : x)))}
            showCenario={false}
          />
          <div className="cc-row-actions">
            <button className="btn btn--sm" disabled={saving === `linha:${l.chave}`} onClick={() => save('linha', l.chave, l)}>
              {saving === `linha:${l.chave}` ? 'Salvando…' : `Salvar linha ${l.chave}`}
            </button>
          </div>
        </div>
      ))}

      {/* Nova linha */}
      <div className="cc-newline">
        <input
          value={novaLinha}
          onChange={(e) => setNovaLinha(e.target.value)}
          placeholder="Nome da nova linha (ex: premium)"
          onKeyDown={(e) => e.key === 'Enter' && addLinha()}
        />
        <button className="btn btn--sm btn--ghost" onClick={addLinha} style={{ color: 'var(--l-text)', borderColor: 'var(--l-line)' }}>
          + Linha
        </button>
      </div>
    </div>
  );
}
