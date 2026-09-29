"use client";

import { useState } from "react";
import { lerNumeroBR, type Confianca } from "@/lib/precificacao";
import {
  ROTULO_CENARIO,
  formatarVendas,
  type Cenario,
  type Degrau,
  type Demanda,
  type Elo,
  type TaxasDoParceiro,
  type TermoProjetado,
  type Unidade,
} from "@/lib/projecao";

// As evidências do nível 2 e a tabela do nível 3 (contracts/ui.md). Só leem o resultado já calculado
// em projecao.tsx: nenhum estado próprio além do que cada peça abre e fecha.

const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const pouco = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
/** Cliques e buscas: 1 decimal abaixo de 10, para 0,4 clique não virar 0. */
export const numero = (n: number) => (n < 10 ? pouco : inteiro).format(n);
export const pct = (v: number) =>
  `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: v > 0 && v < 0.01 ? 2 : 1 })}%`;

const CARTAO = "min-w-0 rounded-xl border border-border bg-white p-4 shadow-soft";
const RESUMO =
  "flex min-h-11 cursor-pointer items-center text-sm font-semibold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

// ── ② Curva de 12 meses ────────────────────────────────────────────────────────────────

export function Curva({
  porMes,
  media,
  unidade,
  cenario,
}: {
  porMes: number[];
  media: number;
  unidade: Unidade;
  cenario: Cenario;
}) {
  const max = Math.max(...porMes);
  const topo = max > 0 ? max * 1.18 : 1; // folga para o rótulo do mês 12
  const alt = (v: number) => (v / topo) * 100;
  const rotulo = ROTULO_CENARIO[cenario].toLowerCase();

  return (
    <figure className={CARTAO}>
      <figcaption>
        <h3 className="font-semibold text-navy">Como o ritmo sobe no ano 1</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {unidade.plural[0].toUpperCase() + unidade.plural.slice(1)} por mês no cenário {rotulo}. A linha tracejada é
          a média do ano 1, o número que vai para o simulador.
        </p>
      </figcaption>

      {/* SVG estica sem distorcer o traço (non-scaling-stroke); os rótulos ficam em HTML para não
          encolher no celular. A calha de 5rem à direita é do rótulo da média. */}
      <div className="relative mt-5 h-44 pr-20 sm:h-52">
        <svg
          role="img"
          aria-labelledby="curva-titulo curva-desc"
          viewBox="0 0 120 100"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
        >
          <title id="curva-titulo">{`${unidade.plural} por mês, do mês 1 ao 12, cenário ${rotulo}`}</title>
          <desc id="curva-desc">
            {`Mês 1: ${formatarVendas(porMes[0])}. Mês 12: ${formatarVendas(porMes[11])}. Média do ano 1: ${formatarVendas(media)}.`}
          </desc>
          <line x1={0} x2={120} y1={100} y2={100} className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {porMes.map((v, i) =>
            alt(v) >= 0.5 ? (
              <rect key={i} x={i * 10 + 1.5} y={100 - alt(v)} width={7} height={alt(v)} className="fill-navy" />
            ) : (
              // Zero real: um traço de 2 px, a barra não some.
              <line
                key={i}
                x1={i * 10 + 1.5}
                x2={i * 10 + 8.5}
                y1={99.5}
                y2={99.5}
                className="stroke-navy"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}
          <line
            x1={0}
            x2={120}
            y1={100 - alt(media)}
            y2={100 - alt(media)}
            className="stroke-gold-dark"
            strokeWidth={2}
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          aria-hidden="true"
          className="absolute right-0 w-[4.5rem] translate-y-1/2 text-xs font-bold leading-tight text-gold-dark"
          style={{ bottom: `${alt(media)}%` }}
        >
          média {formatarVendas(media)}
        </span>
        <span
          aria-hidden="true"
          className="absolute -translate-x-1/2 pb-1 font-mono text-xs font-bold text-navy"
          style={{ left: "calc((100% - 5rem) * 0.9625)", bottom: `${alt(porMes[11])}%` }}
        >
          {formatarVendas(porMes[11])}
        </span>
      </div>
      <div aria-hidden="true" className="mt-1 grid grid-cols-12 pr-20 text-center text-[11px] tabular-nums text-muted-foreground">
        {porMes.map((_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <p aria-hidden="true" className="pr-20 text-center text-[11px] text-muted-foreground">
        mês
      </p>

      <details className="mt-2 border-t border-border">
        <summary className={RESUMO}>Números mês a mês</summary>
        <table className="mb-2 w-full max-w-sm text-sm">
          <caption className="sr-only">{`${unidade.plural} por mês, cenário ${rotulo}`}</caption>
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 font-bold">Mês</th>
              <th scope="col" className="py-1 text-right font-bold">{unidade.plural}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {porMes.map((v, i) => (
              <tr key={i}>
                <th scope="row" className="py-1 text-left font-normal">{i + 1}</th>
                <td className="py-1 text-right font-mono tabular-nums">{formatarVendas(v)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="py-1 text-left font-semibold text-navy">Média do ano 1</th>
              <td className="py-1 text-right font-mono font-bold tabular-nums text-navy">{formatarVendas(media)}</td>
            </tr>
          </tbody>
        </table>
      </details>
    </figure>
  );
}

// ── ③ Cadeia da busca à venda ─────────────────────────────────────────────────────────

const CONFIANCA: Record<Confianca, string> = {
  alta: "confiança alta",
  "media-alta": "confiança média-alta",
  media: "confiança média",
  "media-baixa": "confiança média-baixa",
  baixa: "confiança baixa",
};

export function Cadeia({
  cadeia,
  degraus,
  taxas,
  onTaxaChange,
  cenario,
}: {
  cadeia: Elo[];
  degraus: Degrau[];
  taxas: TaxasDoParceiro;
  onTaxaChange: (degrau: number, taxa: number | undefined) => void;
  cenario: Cenario;
}) {
  // O texto digitado mora aqui; a taxa válida sobe para projecao.tsx, que recalcula.
  const [textos, setTextos] = useState<Record<number, string>>({});
  const [abertos, setAbertos] = useState<Record<number, boolean>>({});

  function digitar(i: number, valor: string) {
    setTextos((t) => ({ ...t, [i]: valor }));
    const v = lerNumeroBR(valor);
    onTaxaChange(i, Number.isNaN(v) || v > 100 ? undefined : v / 100);
  }

  function fechar(i: number) {
    setAbertos((a) => ({ ...a, [i]: false }));
    setTextos((t) => ({ ...t, [i]: "" }));
    onTaxaChange(i, undefined);
  }

  return (
    <section aria-labelledby="cadeia" className={CARTAO}>
      <h3 id="cadeia" className="font-semibold text-navy">
        Da busca à venda, no mês estável
      </h3>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Cenário {ROTULO_CENARIO[cenario].toLowerCase()}. Multiplique os degraus e o resultado é o mês 12 da curva. Cada
        barra vai de 0 a 100% e mostra só a taxa daquele degrau. Se o parceiro sabe a taxa dele, troque a do mercado.
      </p>
      <ol className="mt-3">
        {cadeia.map((e, k) => {
          const i = e.degrau;
          const texto = i !== undefined ? (textos[i] ?? "") : "";
          const invalido = texto.trim() !== "" && (Number.isNaN(lerNumeroBR(texto)) || lerNumeroBR(texto) > 100);
          const id = `cadeia-taxa-${i}`;
          return (
            <li key={k} className="grid gap-1.5 border-t border-border py-3 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm text-navy">
                  <strong className="font-mono text-base font-bold tabular-nums">{formatarVendas(e.n)}</strong> {e.rotulo}
                </p>
                {e.taxa !== undefined ? (
                  <p className="font-mono text-sm font-bold tabular-nums text-navy">
                    {pct(e.taxa)}
                  </p>
                ) : null}
              </div>
              {e.taxa !== undefined ? (
                <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-border/60">
                  <div className="h-full rounded-full bg-navy" style={{ width: `max(2px, ${e.taxa * 100}%)` }} />
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {e.origem === "parceiro" ? (
                  <span className="mr-1 rounded bg-gold/15 px-1.5 py-0.5 font-semibold text-gold-dark">taxa do parceiro</span>
                ) : (
                  <>
                    {e.fonte}
                    {e.confianca ? ` · ${CONFIANCA[e.confianca]}` : ""}
                  </>
                )}
                {e.premissa ? (
                  <span className="mt-0.5 block">
                    <strong className="font-semibold text-navy">Premissa:</strong> {e.premissa}
                  </span>
                ) : null}
              </p>

              {i !== undefined ? (
                abertos[i] ? (
                  <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                    <label htmlFor={id} className="flex flex-col gap-1 text-xs font-semibold text-navy">
                      Taxa do parceiro de {degraus[i].de} para {degraus[i].para} (%)
                      <input
                        id={id}
                        inputMode="decimal"
                        value={texto}
                        onChange={(ev) => digitar(i, ev.target.value)}
                        placeholder="ex.: 1,5"
                        aria-invalid={invalido}
                        aria-describedby={`${id}-ajuda`}
                        className="w-32 rounded-md border border-border bg-white px-3 py-2 text-right text-base font-normal text-foreground sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => fechar(i)}
                      className={`min-h-11 rounded-md px-2 text-xs font-semibold text-navy underline underline-offset-2 ${FOCO_CADEIA}`}
                    >
                      Voltar à taxa do mercado
                    </button>
                    <p
                      id={`${id}-ajuda`}
                      className={`w-full text-xs ${invalido ? "text-red-700" : "text-muted-foreground"}`}
                    >
                      {invalido
                        ? "Use um percentual entre 0 e 100, como 1,5."
                        : taxas[i] !== undefined
                          ? "Vale para os 3 cenários, que passam a diferir só na posição e na rampa. Nada é salvo."
                          : "Vazio = taxa do mercado."}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAbertos((a) => ({ ...a, [i]: true }))}
                    className={`min-h-11 justify-self-start rounded-md px-1 text-xs font-semibold text-navy underline underline-offset-2 ${FOCO_CADEIA}`}
                  >
                    Usar a taxa do parceiro
                  </button>
                )
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const FOCO_CADEIA =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

// ── ④ Cobertura da demanda ────────────────────────────────────────────────────────────

export function Cobertura({ demanda, cenario }: { demanda: Demanda; cenario: Cenario }) {
  const { total, alcancavel, foraDoAlcance, semVolume, semDificuldade, agrupados } = demanda;
  const fracao = total > 0 ? alcancavel / total : 0;
  const contagens = [
    semVolume > 0 && `${semVolume} ${semVolume === 1 ? "termo sem volume medido" : "termos sem volume medido"}`,
    semDificuldade > 0 &&
      `${semDificuldade} sem dificuldade medida (${semDificuldade === 1 ? "contado" : "contados"} como 15)`,
    agrupados > 0 && `${agrupados} ${agrupados === 1 ? "variante agrupada" : "variantes agrupadas"}`,
  ].filter(Boolean);

  return (
    <section aria-labelledby="cobertura" className={CARTAO}>
      <h3 id="cobertura" className="font-semibold text-navy">
        Quanto da demanda a loja alcança no ano 1
      </h3>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {total > 0
          ? `${inteiro.format(total)} buscas por mês somadas nos termos da lista, cenário ${ROTULO_CENARIO[cenario].toLowerCase()}.`
          : "Nenhum termo da lista tem volume medido no Google Ads."}
      </p>
      {total > 0 ? (
        <>
          <div aria-hidden="true" className="mt-3 flex h-3 overflow-hidden rounded-full bg-border">
            <div className="bg-navy" style={{ width: `${fracao * 100}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
            <p className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm bg-navy" />
              <span>
                <strong className="font-mono tabular-nums text-navy">{inteiro.format(alcancavel)}</strong> alcançáveis (
                {pct(fracao)})
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm bg-border" />
              <span>
                <strong className="font-mono tabular-nums">{inteiro.format(foraDoAlcance)}</strong> fora do alcance (
                {pct(1 - fracao)})
              </span>
            </p>
          </div>
        </>
      ) : null}
      {contagens.length > 0 ? <p className="mt-2 text-xs text-muted-foreground">{contagens.join(" · ")}</p> : null}
    </section>
  );
}

// ── Tabela de termos (nível 3) ────────────────────────────────────────────────────────

export function TabelaTermos({ termos, cenario }: { termos: TermoProjetado[]; cenario: Cenario }) {
  // Do mais buscado para o menos; sem volume medido no fim.
  const ordem = [...termos].sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1));
  return (
    <section aria-labelledby="termos" className="min-w-0">
      <h3 id="termos" className="mb-1 font-semibold text-navy">
        Termos consultados
      </h3>
      <p className="mb-3 text-sm text-muted-foreground">
        Posição e cliques no cenário {ROTULO_CENARIO[cenario].toLowerCase()}, depois que a posição se estabiliza. Termo
        de intenção duvidosa se corta na conversa com o Claude e se consulta de novo.
      </p>
      <table className="pr-table pr-table--cards">
        <caption className="sr-only">Termos da lista com buscas por mês, dificuldade, posição e cliques</caption>
        <thead>
          <tr>
            <th scope="col">Termo</th>
            <th scope="col" className="md:text-right">Buscas/mês</th>
            <th scope="col" className="md:text-right">Dificuldade</th>
            <th scope="col">Posição</th>
            <th scope="col" className="md:text-right">Cliques/mês</th>
          </tr>
        </thead>
        <tbody>
          {ordem.map((t) => (
            <tr key={t.termo}>
              <td className="pr-table__nicho break-words">{t.termo}</td>
              <td data-label="Buscas/mês" className="font-mono tabular-nums md:text-right">
                {t.volume === null ? (
                  <span className="font-sans text-muted-foreground">sem volume medido</span>
                ) : t.grupo ? (
                  <s className="text-muted-foreground">{inteiro.format(t.volume)}</s>
                ) : (
                  inteiro.format(t.volume)
                )}
              </td>
              <td data-label="Dificuldade" className="tabular-nums md:text-right">
                {t.dificuldade === null ? (
                  <span className="text-muted-foreground">não medida · conta 15</span>
                ) : (
                  <span className="font-mono">{t.dificuldade}</span>
                )}
              </td>
              <td data-label="Posição" className="text-muted-foreground">
                {t.grupo ? (
                  <>agrupado com «{t.grupo}»</>
                ) : t.posicao ? (
                  <span className="font-mono font-semibold text-foreground">{t.posicao}ª</span>
                ) : (
                  "fora do alcance"
                )}
              </td>
              <td data-label="Cliques/mês" className="font-mono tabular-nums md:text-right">
                {t.grupo || t.volume === null ? "—" : numero(t.cliquesEstaveis)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
