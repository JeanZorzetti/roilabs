"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { guardarPropostaCadeira } from "../propostas/actions";
import {
  FAIXAS,
  NICHOS,
  calcularComissao,
  lerNumeroBR,
  type Faixa,
  type NichoPreco,
  type TipoCompra,
} from "@/lib/precificacao";
import { TIPOS_CADEIRA } from "@/lib/entregaveis";
import { ROTULO_CENARIO, type PonteSimulador } from "@/lib/projecao";
import {
  ANUIDADE,
  CONSULTA_MAX,
  CONSULTA_MIN,
  DOMINIO_ANO,
  EXTRAS_MAX,
  brl,
  comissaoParaCliente,
  extrasForaDoLimite,
  lerAnuidadeManual,
  lerExtras,
  lerTaxaManual,
  simular,
  tipoPadrao,
  type EntradaSimulacao,
} from "@/lib/precos-cadeira";

/**
 * Simulador da proposta de uma cadeira.
 *
 * Responde na reunião "quanto eu pago no primeiro ano?" com o número do nicho
 * dele, não com o 15/10 de cabeça. Guardar (spec 019) congela a proposta e dá a
 * ela um link público da ROI Labs; "Copiar resumo" continua para os slides.
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
  erro,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  /** Regra além do formato numérico; quando vem, é a mensagem mostrada. */
  erro?: string | null;
}) {
  const invalido = Boolean(erro) || (value.trim() !== "" && Number.isNaN(lerNumeroBR(value)));
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
        <span className="font-normal text-red-700">{erro || "Use só números, como 1.500,00."}</span>
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

export function SimuladorCadeira({ inicial }: { inicial?: PonteSimulador | null }) {
  // Vindo da Projeção (spec 017), o ritmo entra no campo do modelo do nicho. Sem `inicial`, tudo
  // começa exatamente como antes.
  const modeloInicial = inicial ? NICHOS.find((n) => n.id === inicial.nichoId)?.modelo : undefined;
  const ritmoInicial = inicial ? inicial.ritmo.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "";
  const [nichoId, setNichoId] = useState(inicial?.nichoId ?? "moda");
  const [pedidos, setPedidos] = useState(modeloInicial === "percentual" ? ritmoInicial : "30");
  const [ticket, setTicket] = useState("200");
  const [recompra, setRecompra] = useState("20");
  const [distribuidor, setDistribuidor] = useState(false);
  const [assinaturas, setAssinaturas] = useState(modeloInicial === "mensalidade" ? ritmoInicial : "3");
  const [mensalidade, setMensalidade] = useState("300");
  const [consultas, setConsultas] = useState(modeloInicial === "consulta" ? ritmoInicial : "10");
  const [valorConsulta, setValorConsulta] = useState("200");
  const [aqManual, setAqManual] = useState("");
  const [recManual, setRecManual] = useState("");
  const [anuidadeManual, setAnuidadeManual] = useState("");
  // null = segue o tipo do nicho; trocar de nicho volta para ele.
  const [tipoEscolhido, setTipoEscolhido] = useState<string | null>(null);
  const [extrasTexto, setExtrasTexto] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [paraQuem, setParaQuem] = useState("");
  const [estado, guardar, guardando] = useActionState(guardarPropostaCadeira, { erro: null });

  const nicho = NICHOS.find((n) => n.id === nichoId) ?? NICHOS[0];
  const aqManualTaxa = lerTaxaManual(aqManual);
  const recManualTaxa = lerTaxaManual(recManual);
  const anuidadeLida = lerAnuidadeManual(anuidadeManual);
  const anuidade = anuidadeLida === null || Number.isNaN(anuidadeLida) ? ANUIDADE : anuidadeLida;
  const tipo = TIPOS_CADEIRA.find((t) => t.id === tipoEscolhido) ?? tipoPadrao(nicho);
  const extras = lerExtras(extrasTexto);
  const extrasInvalidos = extrasForaDoLimite(extras);
  const entrada: EntradaSimulacao = {
    nicho,
    pedidosMes: ler(pedidos),
    ticket: ler(ticket),
    recompra: ler(recompra) / 100,
    distribuidor,
    assinaturasMes: ler(assinaturas),
    mensalidade: ler(mensalidade),
    consultasMes: ler(consultas),
    valorConsulta: ler(valorConsulta),
    // Inválida vale a tabela na conta: o campo mostra o erro e o servidor recusa ao guardar.
    taxaManual: {
      aquisicao: Number.isNaN(aqManualTaxa) ? null : aqManualTaxa,
      recorrencia: Number.isNaN(recManualTaxa) ? null : recManualTaxa,
    },
    anuidade,
  };
  const r = simular(entrada);
  /** Taxa da tabela do nicho, já com o desconto de distribuidor: é o que vale com o campo manual vazio. */
  const taxaTabela = (tipo: TipoCompra) =>
    nicho.modelo === "percentual" ? calcularComissao(nicho, tipo, 0, distribuidor).taxaAplicada : 0;

  const resumo = [
    `Cadeira — ${nicho.nicho}`,
    `${tipo.name} — anuidade: ${brl(anuidade)}/ano`,
    `Domínio próprio: ${brl(DOMINIO_ANO)}/ano`,
    `Comissão: ${comissaoParaCliente(entrada).resumo}`,
    `Estimativa no ritmo informado: ${brl(r.comissaoMes)}/mês de comissão, ${brl(r.totalAno)} no 1º ano com anuidade e domínio`,
    ...(extras.length ? [`Entregáveis extras: ${extras.join("; ")}`] : []),
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
              onChange={(e) => {
                setNichoId(e.target.value);
                setTipoEscolhido(null);
              }}
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
          {nicho.modelo === "percentual" ? (
            <>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Numero
                  id="sim-aquisicao-manual"
                  label="Comissão na 1ª compra (%)"
                  value={aqManual}
                  onChange={setAqManual}
                  hint={`Vazio: ${pct(taxaTabela("aquisicao"))} da tabela`}
                  erro={Number.isNaN(aqManualTaxa) ? "Use de 0,1 a 100." : null}
                />
                <Numero
                  id="sim-recorrencia-manual"
                  label="Comissão na recompra (%)"
                  value={recManual}
                  onChange={setRecManual}
                  hint={`Vazio: ${pct(taxaTabela("recorrencia"))} da tabela`}
                  erro={Number.isNaN(recManualTaxa) ? "Use de 0,1 a 100." : null}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Preenchida, a taxa vale como está: troca a da tabela e o desconto de distribuidor, e vai assim
                para a proposta.
              </p>
            </>
          ) : null}
        </fieldset>

        <fieldset className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-soft">
          <legend className="px-1 text-sm font-bold text-navy">Cadeira</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label htmlFor="sim-tipo" className={ROTULO}>
              Tipo de cadeira
              <select
                id="sim-tipo"
                value={tipo.id}
                onChange={(e) => setTipoEscolhido(e.target.value)}
                className="w-full min-w-0"
              >
                {TIPOS_CADEIRA.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <span className="font-normal">Os entregáveis deste tipo vão na proposta.</span>
            </label>
            <Numero
              id="sim-anuidade"
              label="Anuidade (R$/ano)"
              value={anuidadeManual}
              onChange={setAnuidadeManual}
              hint={`Vazio: ${brl(ANUIDADE)} da tabela`}
              erro={Number.isNaN(anuidadeLida) ? "Use de 0 a 1.000.000." : null}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {tipo.tagline}{" "}
            <Link
              href={`/admin/entregaveis?cadeira=${tipo.id}`}
              className="font-semibold text-navy underline underline-offset-2"
            >
              Ver os entregáveis
            </Link>
          </p>
          <label htmlFor="sim-extras" className={`${ROTULO} mt-3`}>
            Entregáveis extras
            <textarea
              id="sim-extras"
              value={extrasTexto}
              onChange={(e) => setExtrasTexto(e.target.value)}
              rows={3}
              placeholder="ex.: Cadastro do catálogo feito pela equipe da ROI Labs"
              aria-invalid={extrasInvalidos || undefined}
              aria-describedby="sim-extras-dica"
              className={`${CAMPO} w-full`}
            />
          </label>
          <p
            id="sim-extras-dica"
            className={`mt-1 text-xs ${extrasInvalidos ? "text-red-700" : "text-muted-foreground"}`}
          >
            {extrasInvalidos
              ? `Até ${EXTRAS_MAX.itens} itens, com até ${EXTRAS_MAX.caracteres} caracteres cada.`
              : "Um por linha. Entram na proposta depois dos entregáveis do tipo de cadeira."}
          </p>
        </fieldset>

        <fieldset className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-soft">
          <legend className="px-1 text-sm font-bold text-navy">Ritmo esperado de venda</legend>
          {inicial && nichoId === inicial.nichoId ? (
            <p className="mt-1 text-xs text-navy">
              <strong className="font-semibold">Veio da Projeção:</strong> média do ano 1 no cenário{" "}
              {ROTULO_CENARIO[inicial.cenario].toLowerCase()}, já com a rampa de maturação do orgânico.{" "}
              <Link href="/admin/projecao" className="font-semibold underline underline-offset-2">
                Voltar à Projeção
              </Link>
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Pergunte ao parceiro, ou use um número conservador. O orgânico leva de 3 a 6 meses para
              estabilizar: o ano 1 real tende a ficar abaixo desta conta.
            </p>
          )}

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
                  <span className="shrink-0 font-mono">{brl(anuidade)}</span>
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
                <dd className="font-mono font-bold text-navy">{brl(r.entrada)}</dd>
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
          </div>

          {/* Fora da região aria-live: o erro já tem role="alert", e "Guardando…" não precisa ser anunciado duas vezes. */}
          <div className="space-y-3 px-4 pb-4">
            <form action={guardar} className="space-y-2 border-t border-border pt-3">
              {/* A conta é refeita no servidor a partir destes campos crus (spec 019, FR-002). */}
              <input type="hidden" name="nichoId" value={nichoId} />
              <input type="hidden" name="pedidos" value={pedidos} />
              <input type="hidden" name="ticket" value={ticket} />
              <input type="hidden" name="recompra" value={recompra} />
              <input type="hidden" name="distribuidor" value={distribuidor ? "1" : "0"} />
              <input type="hidden" name="assinaturas" value={assinaturas} />
              <input type="hidden" name="mensalidade" value={mensalidade} />
              <input type="hidden" name="consultas" value={consultas} />
              <input type="hidden" name="valorConsulta" value={valorConsulta} />
              <input type="hidden" name="aquisicaoManual" value={aqManual} />
              <input type="hidden" name="recorrenciaManual" value={recManual} />
              <input type="hidden" name="anuidade" value={anuidadeManual} />
              <input type="hidden" name="tipoCadeira" value={tipo.id} />
              <input type="hidden" name="extras" value={extrasTexto} />

              <label htmlFor="sim-para-quem" className={ROTULO}>
                Para quem
                <input
                  id="sim-para-quem"
                  name="paraQuem"
                  value={paraQuem}
                  onChange={(e) => setParaQuem(e.target.value)}
                  maxLength={120}
                  autoComplete="off"
                  placeholder="ex.: Loja Aurora"
                  aria-invalid={estado.erro ? true : undefined}
                  aria-describedby={`sim-para-quem-dica${estado.erro ? " sim-guardar-erro" : ""}`}
                  className={CAMPO}
                />
                <span id="sim-para-quem-dica" className="font-normal">
                  Aparece no título da proposta que o cliente abre.
                </span>
              </label>

              {estado.erro ? (
                <p id="sim-guardar-erro" role="alert" className="text-sm text-red-700">
                  {estado.erro}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-70"
              >
                {guardando ? "Guardando…" : "Guardar proposta"}
              </button>
              <p className="text-xs text-muted-foreground">
                Guardada, ela vai para Propostas com um link para mandar ao cliente.
              </p>
            </form>

            <button
              type="button"
              onClick={copiar}
              className="w-full rounded-md border border-border px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {copiado ? "Copiado ✓" : "Copiar resumo para os slides"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
