"use client";

import {
  ROTULO_CENARIO,
  formatarVendas,
  type Cenario,
  type Demanda,
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
