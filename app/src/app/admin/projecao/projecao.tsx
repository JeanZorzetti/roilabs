"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FAIXAS, NICHOS, type Faixa } from "@/lib/precificacao";
import {
  CENARIOS,
  CENARIO_PADRAO,
  FUNIS,
  ROTULO_CENARIO,
  arredondarVendas,
  formatarVendas,
  limiteDificuldade,
  limparTermos,
  projetar,
  urlSimulador,
  validarTermos,
  type Cenario,
  type TaxasDoParceiro,
  type TermoConsultado,
  type Unidade,
} from "@/lib/projecao";
import { Cadeia, Cobertura, Curva, TabelaTermos } from "./resultado";

/**
 * Projeção do ritmo de venda (spec 017). A consulta paga só acontece no clique (FR-003); trocar
 * nicho ou cenário recalcula em cima dos termos já consultados. Nada é gravado (FR-012).
 */

type Local = { codigo: number; nome: string };
type Consulta = {
  termos: TermoConsultado[];
  janela: { de: string; ate: string } | null;
  local: Local;
  custoUsd: number;
  consultadoEm: string;
  removidos: number;
};
type ErroConsulta = { erro: "sessao" | "chave" | "saldo" | "fonte"; mensagem: string };

const BRASIL: Local = { codigo: 2076, nome: "Brasil" };
const ORDEM: Faixa[] = ["premium", "padrao", "intermediaria", "margem-fina", "especial"];
const GRUPOS = ORDEM.map((f) => [f, NICHOS.filter((n) => n.faixa === f)] as const);

// text-base no celular: abaixo de 16px o iOS dá zoom ao focar o campo.
const CAMPO =
  "w-full min-w-0 rounded-md border border-border bg-white px-3 py-2 text-base font-normal text-foreground sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const ROTULO = "flex flex-col gap-1 text-sm font-semibold text-navy";
const FOCO = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const mesAno = (ym: string) => `${MESES[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`;
const usd = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const unidadeDe = (u: Unidade, n: number) => (arredondarVendas(n) === 1 ? u.singular : u.plural);

export function Projecao() {
  const [nichoId, setNichoId] = useState("moda");
  const [texto, setTexto] = useState("");
  const [textoCidade, setTextoCidade] = useState("");
  const [sugestoes, setSugestoes] = useState<Local[]>([]);
  const [cidadesFora, setCidadesFora] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [erro, setErro] = useState<ErroConsulta | null>(null);
  const [erroTermos, setErroTermos] = useState<string | null>(null);
  const [erroCidade, setErroCidade] = useState<string | null>(null);
  const [cenario, setCenario] = useState<Cenario>(CENARIO_PADRAO);
  const [taxas, setTaxas] = useState<TaxasDoParceiro>({});
  const titulo = useRef<HTMLHeadingElement>(null);
  const campoTermos = useRef<HTMLTextAreaElement>(null);
  const campoCidade = useRef<HTMLInputElement>(null);

  const nicho = NICHOS.find((n) => n.id === nichoId) ?? NICHOS[0];
  const funil = FUNIS[nicho.id];
  // Só vale cidade que a rota devolveu: o nome precisa ser o que a DataForSEO aceita.
  const cidade = textoCidade.trim() ? (sugestoes.find((l) => l.nome === textoCidade) ?? null) : null;

  const resultado = useMemo(
    () => (consulta ? projetar(consulta.termos, nicho.id, taxas) : null),
    [consulta, nicho.id, taxas],
  );

  useEffect(() => {
    const q = textoCidade.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/projecao/cidades?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const j = await r.json();
        setCidadesFora(!r.ok);
        if (r.ok) setSugestoes(j.locais);
      } catch {
        if (!ctrl.signal.aborted) setCidadesFora(true);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [textoCidade]);

  // Ao terminar a consulta (ou falhar), o foco vai para a resposta: o leitor de tela ouve o número e,
  // no celular, a tela rola até ela.
  useEffect(() => {
    if (consulta || erro) titulo.current?.focus();
  }, [consulta, erro]);

  async function consultar(e: FormEvent) {
    e.preventDefault();
    setErroTermos(null);
    setErroCidade(null);
    const linhas = texto.split("\n");
    const invalido = validarTermos(limparTermos(linhas).termos);
    if (invalido) {
      setErroTermos(invalido.mensagem);
      campoTermos.current?.focus();
      return;
    }
    if (textoCidade.trim() && !cidade) {
      setErroCidade("Escolha uma das cidades sugeridas, ou apague o campo para consultar o Brasil.");
      campoCidade.current?.focus();
      return;
    }
    setConsultando(true);
    try {
      const r = await fetch("/api/projecao/consultar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termos: linhas, local: cidade ?? BRASIL }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j) {
        setErro(null);
        setConsulta(j);
      } else if (j?.erro === "entrada") {
        setErroTermos(j.mensagem);
        campoTermos.current?.focus();
      } else {
        setErro(
          j?.erro
            ? j
            : { erro: "fonte", mensagem: `O servidor respondeu ${r.status} sem dizer a causa. Tente de novo em 1 minuto.` },
        );
      }
    } catch {
      setErro({ erro: "fonte", mensagem: "Não deu para falar com o servidor. Confira a conexão e tente de novo." });
    } finally {
      setConsultando(false);
    }
  }

  const r = resultado?.[cenario];
  const maxMedia = resultado ? Math.max(...CENARIOS.map((c) => resultado[c].mediaAno1)) : 0;
  const fontesConversao = r
    ? [...new Set(r.cadeia.filter((e) => e.degrau !== undefined).map((e) => e.fonte.split(/ [·(]/)[0]))].join(" + ")
    : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Entrada. min-w-0: item de grid se recusa a encolher abaixo do min-content. */}
      <form onSubmit={consultar} noValidate className="min-w-0 lg:col-start-1 lg:row-start-1">
        <fieldset className="min-w-0 space-y-4 rounded-xl border border-border bg-white p-4 shadow-soft">
          <legend className="px-1 text-sm font-bold text-navy">O que consultar</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="proj-nicho" className={ROTULO}>
              Nicho do parceiro
              <select
                id="proj-nicho"
                value={nichoId}
                onChange={(e) => {
                  setNichoId(e.target.value);
                  setTaxas({}); // os degraus são outros: a taxa do parceiro não vale para o nicho novo
                }}
                className={CAMPO}
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
              <span className="text-xs font-normal text-muted-foreground">
                Trocar o nicho depois de consultar não custa nada: só muda o funil.
              </span>
            </label>

            <label htmlFor="proj-cidade" className={ROTULO}>
              Cidade (opcional)
              <input
                id="proj-cidade"
                ref={campoCidade}
                list="proj-cidades"
                value={textoCidade}
                onChange={(e) => {
                  setTextoCidade(e.target.value);
                  setErroCidade(null);
                  if (e.target.value.trim().length < 2) setSugestoes([]);
                }}
                placeholder="ex.: Goiânia"
                autoComplete="off"
                aria-invalid={!!erroCidade}
                aria-describedby="proj-cidade-ajuda"
                className={CAMPO}
              />
              <datalist id="proj-cidades">
                {sugestoes.map((l) => (
                  <option key={l.codigo} value={l.nome} />
                ))}
              </datalist>
              <span
                id="proj-cidade-ajuda"
                className={`text-xs font-normal ${erroCidade ? "text-red-700" : "text-muted-foreground"}`}
              >
                {erroCidade ??
                  (cidadesFora
                    ? "Lista de cidades indisponível agora: projete com o Brasil ou tente de novo."
                    : cidade
                      ? `Volume de ${cidade.nome.split(",")[0]}. A dificuldade continua nacional.`
                      : "Vazio = Brasil. Clínica atende uma cidade: escolha a dela.")}
              </span>
            </label>
          </div>

          <label htmlFor="proj-termos" className={ROTULO}>
            Termos de compra, um por linha
            <textarea
              id="proj-termos"
              ref={campoTermos}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setErroTermos(null);
              }}
              rows={8}
              spellCheck={false}
              placeholder={"ex.:\nvestido de festa longo\ncomprar vestido midi"}
              aria-invalid={!!erroTermos}
              aria-describedby="proj-termos-ajuda"
              className={`${CAMPO} font-mono`}
            />
            <span
              id="proj-termos-ajuda"
              className={`text-xs font-normal ${erroTermos ? "text-red-700" : "text-muted-foreground"}`}
            >
              {erroTermos ??
                (consulta && consulta.removidos > 0
                  ? `${consulta.removidos} ${consulta.removidos === 1 ? "linha repetida foi ignorada" : "linhas repetidas foram ignoradas"} na última consulta.`
                  : "Até 200 termos, com até 80 caracteres e 10 palavras cada. Linhas repetidas contam uma vez.")}
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="submit"
              disabled={consultando}
              className={`min-h-11 rounded-md bg-navy px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:cursor-wait disabled:opacity-70 ${FOCO}`}
            >
              {consultando ? "Consultando…" : "Consultar termos"}
            </button>
            <span className="text-xs text-muted-foreground">
              Cerca de US$ 0,10 por consulta, na conta da DataForSEO.
            </span>
          </div>
        </fieldset>
      </form>

      {/* Nível 1: a resposta. Na tela larga, coluna direita fixa; no celular, logo depois da entrada. */}
      <div className="min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <section aria-labelledby="proj-resposta" className="rounded-xl border border-border bg-white shadow-elevated">
          <h2
            id="proj-resposta"
            ref={titulo}
            tabIndex={-1}
            className={`rounded-t-xl border-b border-border px-4 py-3 font-bold text-navy ${FOCO}`}
          >
            Vendas por mês no ano 1
          </h2>
          <div className="space-y-4 p-4" aria-busy={consultando}>
            {erro ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <p className="flex items-center gap-2 font-semibold">
                  <span aria-hidden="true">⚠</span> Não deu para consultar
                </p>
                <p className="mt-1">{erro.mensagem}</p>
                {erro.erro === "sessao" ? (
                  <a href="/login" className={`mt-2 inline-block font-semibold underline underline-offset-2 ${FOCO}`}>
                    Entrar de novo
                  </a>
                ) : null}
                {consulta ? <p className="mt-2 text-xs">A projeção abaixo é da consulta anterior.</p> : null}
              </div>
            ) : null}

            {!consulta && !consultando && !erro ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  A projeção estima quantas vendas por mês a busca orgânica traz para a cadeira no ano 1, em três
                  cenários.
                </p>
                <ol className="mt-3 space-y-2 text-sm text-navy">
                  {[
                    "Explique o nicho ao Claude e peça os termos de compra.",
                    "Cole os termos aqui, um por linha.",
                    "Consulte (cerca de US$ 0,10).",
                  ].map((passo, i) => (
                    <li key={passo} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card font-mono text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{passo}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {consultando && !consulta ? (
              <div className="space-y-3" aria-hidden="true">
                <div className="h-10 w-32 rounded-md bg-card motion-safe:animate-pulse" />
                <div className="h-4 w-48 rounded bg-card motion-safe:animate-pulse" />
                <div className="h-24 rounded-lg bg-card motion-safe:animate-pulse" />
              </div>
            ) : null}
            {consultando && consulta ? (
              <p className="text-xs font-semibold text-navy" role="status">
                Consultando a lista nova…
              </p>
            ) : null}

            {resultado && r && consulta ? (
              <div className={consultando ? "space-y-4 opacity-60" : "space-y-4"}>
                <div aria-live="polite">
                  <p className="font-mono text-4xl font-bold leading-none text-navy">{formatarVendas(r.mediaAno1)}</p>
                  <p className="mt-1 text-sm text-navy">
                    {unidadeDe(funil.unidade, r.mediaAno1)} por mês · média do ano 1, cenário{" "}
                    {ROTULO_CENARIO[cenario].toLowerCase()}
                  </p>
                </div>

                <fieldset className="min-w-0">
                  <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cenário</legend>
                  <div className="mt-2 space-y-2">
                    {CENARIOS.map((c) => {
                      const m = resultado[c].mediaAno1;
                      return (
                        <label
                          key={c}
                          className="grid min-h-11 cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-lg border border-border px-3 py-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold has-[:checked]:border-navy has-[:checked]:bg-card"
                        >
                          <input
                            type="radio"
                            name="proj-cenario"
                            value={c}
                            checked={cenario === c}
                            onChange={() => setCenario(c)}
                            className="h-4 w-4 accent-navy"
                          />
                          <span className="text-sm font-semibold text-navy">{ROTULO_CENARIO[c]}</span>
                          <span className="text-right font-mono text-sm font-bold tabular-nums text-navy">
                            {formatarVendas(m)}
                          </span>
                          <span aria-hidden="true" className="col-start-2 col-end-4 h-1.5 overflow-hidden rounded-full bg-border/60">
                            <span
                              className="block h-full rounded-full bg-navy"
                              style={{ width: `${maxMedia > 0 ? (m / maxMedia) * 100 : 0}%` }}
                            />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Ativo também no zero real: "o orgânico não traz venda no ano 1" é uma resposta. */}
                <div className="space-y-1">
                  <Link
                    href={urlSimulador(nicho.id, r.mediaAno1, cenario)}
                    className={`flex min-h-11 w-full items-center justify-center rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark ${FOCO}`}
                  >
                    Usar no simulador
                    <span className="sr-only">
                      : {formatarVendas(r.mediaAno1)} {unidadeDe(funil.unidade, r.mediaAno1)} por mês, cenário{" "}
                      {ROTULO_CENARIO[cenario].toLowerCase()}
                    </span>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Abre Preços com este nicho e {formatarVendas(r.mediaAno1)} {unidadeDe(funil.unidade, r.mediaAno1)}{" "}
                    por mês. Nada é salvo.
                  </p>
                </div>

                <Avisos
                  total={r.demanda.total}
                  alcancavel={r.demanda.alcancavel}
                  media={r.mediaAno1}
                  cenario={cenario}
                  clinicaNoBrasil={nicho.modelo === "consulta" && consulta.local.codigo === BRASIL.codigo}
                />

                <dl className="space-y-1 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Mês estável (potencial)</dt>
                    <dd className="font-mono tabular-nums">{formatarVendas(r.vendasEstaveis)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Demanda somada</dt>
                    <dd className="font-mono tabular-nums">{r.demanda.total.toLocaleString("pt-BR")} buscas/mês</dd>
                  </div>
                </dl>

                <p className="text-xs text-muted-foreground">
                  Buscas: Google Ads via DataForSEO
                  {consulta.janela ? `, média mensal de ${mesAno(consulta.janela.de)} a ${mesAno(consulta.janela.ate)}` : ""}{" "}
                  · {consulta.local.codigo === BRASIL.codigo ? "Brasil" : consulta.local.nome.split(",")[0]} · consultado
                  em {quando(consulta.consultadoEm)} · conversão: {fontesConversao} · custou US$ {usd(consulta.custoUsd)}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {/* Nível 2 e 3: as evidências e a tabela. */}
      {resultado && r && consulta ? (
        <div className={`min-w-0 space-y-6 lg:col-start-1 lg:row-start-2 ${consultando ? "opacity-60" : ""}`}>
          <Curva porMes={r.porMes} media={r.mediaAno1} unidade={funil.unidade} cenario={cenario} />
          <Cadeia
            key={nicho.id}
            cadeia={r.cadeia}
            degraus={funil.degraus}
            taxas={taxas}
            onTaxaChange={(i, t) => setTaxas((prev) => ({ ...prev, [i]: t }))}
            cenario={cenario}
          />
          <Cobertura demanda={r.demanda} cenario={cenario} />
          <TabelaTermos termos={r.termos} cenario={cenario} />
        </div>
      ) : consultando ? (
        <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-2" aria-hidden="true">
          <div className="h-72 rounded-xl border border-border bg-white motion-safe:animate-pulse" />
          <div className="h-32 rounded-xl border border-border bg-white motion-safe:animate-pulse" />
        </div>
      ) : null}
    </div>
  );
}

function Avisos({
  total,
  alcancavel,
  media,
  cenario,
  clinicaNoBrasil,
}: {
  total: number;
  alcancavel: number;
  media: number;
  cenario: Cenario;
  clinicaNoBrasil: boolean;
}) {
  const avisos: string[] = [];
  if (total === 0) {
    avisos.push("Nenhum termo da lista tem volume medido no Google Ads. Peça ao Claude termos mais buscados.");
  } else if (alcancavel === 0) {
    avisos.push(
      `Nenhum termo da lista é alcançável no ano 1 neste cenário: todos têm dificuldade acima de ${limiteDificuldade(cenario)}. Troque o cenário ou peça ao Claude termos de cauda longa.`,
    );
  } else if (arredondarVendas(media) < 1) {
    avisos.push(
      `≈ ${formatarVendas(media * 12)} no ano 1. Nesse ritmo, o orgânico sozinho não paga a anuidade: vale somar outros canais.`,
    );
  }
  if (clinicaNoBrasil) {
    avisos.push("Clínica atende uma cidade: com o Brasil, a demanda fica superestimada. Escolha a cidade e consulte de novo.");
  }
  if (avisos.length === 0) return null;
  return (
    <ul className="space-y-1.5 rounded-lg border border-border bg-card p-3 text-sm text-navy">
      {avisos.map((a) => (
        <li key={a}>{a}</li>
      ))}
    </ul>
  );
}
