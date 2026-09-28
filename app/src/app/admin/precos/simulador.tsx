"use client";

import { useState } from "react";
import { FAIXAS, NICHOS, lerNumeroBR, type Faixa, type NichoPreco } from "@/lib/precificacao";
import {
  ANUIDADE,
  CONSULTA_MAX,
  CONSULTA_MIN,
  DOMINIO_ANO,
  ENTRADA_ANO,
  brl,
  simular,
} from "@/lib/precos-cadeira";

/**
 * Simulador da proposta de uma cadeira.
 *
 * Não salva nada: a proposta da ROI Labs sai do modelo em slides. Aqui é só a
 * conta, para responder na reunião "quanto eu pago no primeiro ano?" com o
 * número do nicho dele, não com o 15/10 de cabeça.
 */

const pct = (v: number) => `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const ORDEM: Faixa[] = ["premium", "padrao", "intermediaria", "margem-fina", "especial"];
const GRUPOS = ORDEM.map((f) => [f, NICHOS.filter((n) => n.faixa === f)] as const);

const CAMPO =
  "rounded-md border border-border bg-white px-2 py-1.5 text-sm font-normal text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const ROTULO = "flex flex-col gap-1 text-xs font-semibold text-muted-foreground";

function taxaDoNicho(n: NichoPreco): string {
  if (n.modelo === "percentual") return `${pct(n.aquisicao)} na 1ª compra · ${pct(n.recorrencia)} na recompra`;
  return `${n.aquisicaoTexto} · ${n.recorrenciaTexto}`;
}

function Numero({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const invalido = value.trim() !== "" && Number.isNaN(lerNumeroBR(value));
  return (
    <label htmlFor={id} className={ROTULO}>
      {label}
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalido}
        className={`${CAMPO} text-right`}
      />
      {invalido ? (
        <span className="font-normal text-red-700">Use só números, como 1.500,00.</span>
      ) : hint ? (
        <span className="font-normal">{hint}</span>
      ) : null}
    </label>
  );
}

const ler = (s: string) => {
  const v = lerNumeroBR(s);
  return Number.isNaN(v) ? 0 : v;
};

export function SimuladorCadeira() {
  const [nichoId, setNichoId] = useState("moda");
  const [pedidos, setPedidos] = useState("30");
  const [ticket, setTicket] = useState("200");
  const [recompra, setRecompra] = useState("20");
  const [distribuidor, setDistribuidor] = useState(false);
  const [assinaturas, setAssinaturas] = useState("3");
  const [mensalidade, setMensalidade] = useState("300");
  const [consultas, setConsultas] = useState("10");
  const [valorConsulta, setValorConsulta] = useState("200");
  const [copiado, setCopiado] = useState(false);

  const nicho = NICHOS.find((n) => n.id === nichoId) ?? NICHOS[0];
  const r = simular({
    nicho,
    pedidosMes: ler(pedidos),
    ticket: ler(ticket),
    recompra: ler(recompra) / 100,
    distribuidor,
    assinaturasMes: ler(assinaturas),
    mensalidade: ler(mensalidade),
    consultasMes: ler(consultas),
    valorConsulta: ler(valorConsulta),
  });

  const resumo = [
    `Cadeira — ${nicho.nicho}`,
    `Anuidade: ${brl(ANUIDADE)}/ano`,
    `Domínio próprio: ${brl(DOMINIO_ANO)}/ano`,
    `Comissão: ${taxaDoNicho(nicho)}`,
    `Estimativa no ritmo informado: ${brl(r.comissaoMes)}/mês de comissão, ${brl(r.totalAno)} no 1º ano com anuidade e domínio`,
  ].join("\n");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(resumo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* min-w-0: o nome longo do nicho no <select> esticava a coluna a 360px. */}
      <div className="min-w-0 space-y-6">
        {/* min-w-0: fieldset nasce com min-width:min-content e estourava a 360px. */}
        <fieldset className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-soft">
          <legend className="px-1 text-sm font-bold text-navy">Nicho do parceiro</legend>
          <label htmlFor="sim-nicho" className={`${ROTULO} mt-2`}>
            A faixa sai da margem do fornecedor: confira em Precificação se ele não cair no nicho
            <select
              id="sim-nicho"
              value={nichoId}
              onChange={(e) => setNichoId(e.target.value)}
              className={` w-full min-w-0`}
            >
              {GRUPOS.map(([faixa, nichos]) => (
                <optgroup key={faixa} label={FAIXAS[faixa].rotulo}>
                  {nichos.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nicho}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <p className="mt-3 rounded-md bg-card px-3 py-2 text-sm text-navy">
            <strong className="font-semibold">{FAIXAS[nicho.faixa].rotulo}:</strong> {taxaDoNicho(nicho)}
            {nicho.regra ? <span className="block text-xs text-muted-foreground">{nicho.regra}</span> : null}
          </p>
        </fieldset>

        <fieldset className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-soft">
          <legend className="px-1 text-sm font-bold text-navy">Ritmo esperado de venda</legend>
          <p className="mt-1 text-xs text-muted-foreground">
            Pergunte ao parceiro, ou use um número conservador. O orgânico leva de 3 a 6 meses para
            estabilizar: o ano 1 real tende a ficar abaixo desta conta.
          </p>

          {nicho.modelo === "percentual" ? (
            <>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Numero id="sim-pedidos" label="Pedidos pagos por mês" value={pedidos} onChange={setPedidos} />
                <Numero
                  id="sim-ticket"
                  label="Valor médio do produto (R$)"
                  value={ticket}
                  onChange={setTicket}
                  hint="Com desconto, sem frete"
                />
                <Numero
                  id="sim-recompra"
                  label="Pedidos de recompra (%)"
                  value={recompra}
                  onChange={setRecompra}
                  hint="De quem já comprou antes"
                />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={distribuidor}
                  onChange={(e) => setDistribuidor(e.target.checked)}
                  className="h-4 w-4 accent-navy"
                />
                É distribuidor ou revende marcas de outras empresas (3 e 2 pontos a menos)
              </label>
            </>
          ) : nicho.modelo === "mensalidade" ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Numero
                id="sim-assinaturas"
                label="Assinaturas novas por mês"
                value={assinaturas}
                onChange={setAssinaturas}
              />
              <Numero
                id="sim-mensalidade"
                label="Mensalidade do plano (R$)"
                value={mensalidade}
                onChange={setMensalidade}
              />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Numero
                id="sim-consultas"
                label="Consultas comparecidas por mês"
                value={consultas}
                onChange={setConsultas}
              />
              <Numero
                id="sim-valor-consulta"
                label="Valor por consulta (R$)"
                value={valorConsulta}
                onChange={setValorConsulta}
                hint={`Tabela: ${brl(CONSULTA_MIN)} a ${brl(CONSULTA_MAX)}`}
              />
            </div>
          )}
        </fieldset>
      </div>

      {/* min-w-0: item de grid se recusa a encolher abaixo do próprio min-content. */}
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-border bg-white shadow-elevated">
          <h3 className="border-b border-border px-4 py-3 font-bold text-navy">Proposta</h3>
          <div className="space-y-4 p-4" aria-live="polite">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Entrada · todo ano, sem desconto
              </h4>
              <ul className="mt-1 space-y-1">
                <li className="flex justify-between gap-2 text-sm">
                  <span className="text-foreground">Anuidade da cadeira</span>
                  <span className="shrink-0 font-mono">{brl(ANUIDADE)}</span>
                </li>
                <li className="flex justify-between gap-2 text-sm">
                  <span className="text-foreground">Domínio próprio (Hostinger)</span>
                  <span className="shrink-0 font-mono">{brl(DOMINIO_ANO)}</span>
                </li>
                <li className="flex justify-between gap-2 text-sm">
                  <span className="text-foreground">Setup</span>
                  <span className="shrink-0 font-mono">{brl(0)}</span>
                </li>
              </ul>
            </div>

            <dl className="space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="font-semibold text-navy">Entrada</dt>
                <dd className="font-mono font-bold text-navy">{brl(ENTRADA_ANO)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-semibold text-navy">
                  Comissão por mês
                  {nicho.modelo === "mensalidade" ? <span className="font-normal"> (12º mês)</span> : null}
                </dt>
                <dd className="font-mono text-lg font-bold text-navy">{brl(r.comissaoMes)}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>Comissão em 12 meses</dt>
                <dd className="font-mono">{brl(r.comissaoAno)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-semibold text-navy">ROI Labs no 1º ano</dt>
                <dd className="font-mono text-lg font-bold text-navy">{brl(r.totalAno)}</dd>
              </div>
              {r.pctDaVenda !== null ? (
                <div className="flex justify-between text-muted-foreground">
                  <dt>Sobre {brl(r.vendasAno)} vendidos</dt>
                  <dd className="font-mono">{pct(r.pctDaVenda)}</dd>
                </div>
              ) : null}
            </dl>

            {r.avisos.length > 0 ? (
              <ul role="status" className="space-y-1.5 rounded-lg border border-border bg-card p-3 text-sm text-navy">
                {r.avisos.map((aviso) => (
                  <li key={aviso}>{aviso}</li>
                ))}
              </ul>
            ) : null}

            <div className="space-y-1 border-t border-border pt-3">
              <button
                type="button"
                onClick={copiar}
                className="w-full rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {copiado ? "Copiado ✓" : "Copiar resumo"}
              </button>
              <p className="text-xs text-muted-foreground">
                Para colar na proposta em slides. Nada é salvo aqui.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
