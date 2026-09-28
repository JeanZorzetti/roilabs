"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { saveProposal } from "@/lib/vertice/actions";
import { SERVICES, brl, marginBand } from "@/lib/vertice/catalog";
import { applicableTerms, PROPOSAL_VALID_DAYS } from "@/lib/vertice/proposal";
import { buildQuote, type CustomLine, type ProposalDraft } from "@/lib/vertice/quote";
import type { PickerClient } from "./ClientPicker";

/**
 * Simulador de proposta.
 *
 * A conta roda no navegador para o número mudar enquanto o cliente está na
 * linha — mas quem salva é o server action, que recalcula do zero. O total
 * gravado nunca vem do formulário.
 */

const EXTRA_OPTIONS = [
  { value: 0, label: "Nenhum" },
  { value: 0.05, label: "5% (12 meses pré-pago)" },
  { value: 0.1, label: "10% (12 meses pré-pago)" },
];

export function QuoteSimulator({
  clients,
  defaultClientId,
  draft,
}: {
  clients: PickerClient[];
  defaultClientId: number | null;
  /** Presente = está editando. A página remonta o componente por `key` ao trocar. */
  draft?: ProposalDraft | null;
}) {
  const [qty, setQty] = useState<Record<string, number>>(draft?.qty ?? {});
  const [extra, setExtra] = useState(draft?.extra ?? 0);
  const [custom, setCustom] = useState<CustomLine[]>(draft?.custom ?? []);
  const [dropped, setDropped] = useState<string[]>(draft?.dropped ?? []);
  const [extraTerms, setExtraTerms] = useState(draft?.extraTerms ?? "");

  const lines = useMemo(
    () => [
      ...Object.entries(qty)
        .filter(([, value]) => value > 0)
        .map(([offerId, value]) => ({ offerId, qty: value })),
      ...custom.filter((line) => line.label.trim().length > 0 && line.qty > 0),
    ],
    [qty, custom]
  );

  const quote = useMemo(() => buildQuote(lines, extra), [lines, extra]);
  const empty = lines.length === 0;

  // As condições dependem do que está na proposta, então a lista muda enquanto
  // ele mexe nos itens. Id desmarcado de condição que deixou de se aplicar fica
  // guardado sem efeito — se o item voltar, a escolha dele volta junto.
  const terms = useMemo(() => applicableTerms(quote), [quote]);
  const droppedRisks = terms.filter((term) => term.risk && dropped.includes(term.id));
  const keptTerms = terms.filter((term) => !dropped.includes(term.id));

  function setOffer(offerId: string, value: number) {
    setQty((current) => ({ ...current, [offerId]: Math.max(0, Math.min(99, value)) }));
  }

  function setCustomField(index: number, patch: Partial<CustomLine>) {
    setCustom((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {/* min-w-0 no fieldset: o elemento nasce com min-width:min-content no
            navegador e se recusa a encolher — a 360px ele estourava 367px num
            container de 345px e a página inteira ganhava scroll horizontal. */}
        {SERVICES.map((service) => (
          <fieldset
            key={service.id}
            className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-soft"
          >
            <legend className="px-1 text-sm font-bold text-navy">{service.name}</legend>
            <ul className="mt-2 divide-y divide-border">
              {service.offers.map((offer) => {
                const value = qty[offer.id] ?? 0;
                const selected = value > 0;
                return (
                  <li key={offer.id} className="flex flex-wrap items-center gap-3 py-2">
                    <label htmlFor={`qty-${offer.id}`} className="flex-1 text-sm text-foreground">
                      {offer.name}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {offer.priceLabel}
                        {offer.kind === "recorrente" && !offer.discountEligible
                          ? " · fora do desconto"
                          : ""}
                      </span>
                    </label>
                    <input
                      id={`qty-${offer.id}`}
                      type="number"
                      min={0}
                      max={99}
                      step={1}
                      inputMode="numeric"
                      value={value}
                      onChange={(event) => setOffer(offer.id, Number(event.target.value))}
                      className={
                        selected
                          ? "w-16 rounded-md border-2 border-navy bg-white px-2 py-1 text-center text-sm font-bold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                          : "w-16 rounded-md border border-border bg-card px-2 py-1 text-center text-sm text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}

        <fieldset className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-soft">
          <legend className="px-1 text-sm font-bold text-navy">Linhas livres</legend>
          <p className="mt-1 text-xs text-muted-foreground">
            Para cobrar a hora ou fechar um pacote que não está na tabela. A unidade é o que o cliente
            lê na proposta: escreva &ldquo;hora&rdquo; para mostrar hora, &ldquo;chamado&rdquo; para
            não mostrar. As horas só alimentam a margem aqui dentro.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Na descrição, a{" "}
            <strong className="font-semibold text-navy">
              primeira linha é o título: 3 a 6 palavras
            </strong>
            . O detalhe vai nas linhas seguintes, que viram marcadores na proposta — uma por
            entregável, com &ldquo;-&rdquo; ou sem. Título longo repete o cabeçalho da proposta.
          </p>

          <ul className="mt-3 space-y-3">
            {custom.map((line, index) => (
              <li key={index} className="rounded-lg border border-border bg-card p-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                  Descrição
                  <textarea
                    value={line.label}
                    onChange={(event) => setCustomField(index, { label: event.target.value })}
                    rows={4}
                    maxLength={2000}
                    placeholder={"Alterações nos sites Seven e Mhédicos\n- Retirar os banners da Geratherm do site da Seven\n- Incluir os banners no site da Mhédicos\n- Retirar banner e informações da telemedicina"}
                    className="min-h-[5.5rem] resize-y rounded-md border border-border bg-white px-2 py-1.5 text-sm font-normal text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  />
                </label>

                <label className="mt-2 flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                  Prazo (opcional)
                  <input
                    value={line.sla ?? ""}
                    onChange={(event) => setCustomField(index, { sla: event.target.value })}
                    maxLength={60}
                    placeholder="3 dias úteis"
                    className="rounded-md border border-border bg-white px-2 py-1.5 text-sm font-normal text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  />
                </label>

                <div className="mt-2 grid gap-2 sm:grid-cols-[70px_90px_100px_90px_auto]">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                    Qtd
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={line.qty}
                      onChange={(event) => setCustomField(index, { qty: Number(event.target.value) })}
                      className="rounded-md border border-border bg-white px-2 py-1.5 text-center text-sm font-normal text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                    Unidade
                    <input
                      value={line.unit}
                      onChange={(event) => setCustomField(index, { unit: event.target.value })}
                      placeholder="hora"
                      className="rounded-md border border-border bg-white px-2 py-1.5 text-sm font-normal text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                    R$ por un.
                    <input
                      type="number"
                      min={0}
                      step={10}
                      inputMode="numeric"
                      value={line.unitPrice}
                      onChange={(event) =>
                        setCustomField(index, { unitPrice: Number(event.target.value) })
                      }
                      className="rounded-md border border-border bg-white px-2 py-1.5 text-right text-sm font-normal text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                    Horas
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      inputMode="decimal"
                      value={line.hours}
                      onChange={(event) => setCustomField(index, { hours: Number(event.target.value) })}
                      className="rounded-md border border-border bg-white px-2 py-1.5 text-right text-sm font-normal text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustom((current) => current.filter((_, i) => i !== index))}
                    className="self-end px-1 py-1.5 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() =>
              setCustom((current) => [
                ...current,
                { label: "", qty: 1, unit: "hora", unitPrice: 350, hours: 1 },
              ])
            }
            className="mt-3 rounded-md border border-navy px-3 py-1.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            + Linha livre
          </button>
        </fieldset>

        {/* Vazio não mostra condição: sem item na proposta não há o que decidir.
            min-w-0 pelo mesmo motivo do fieldset acima — sem ele o elemento se
            recusa a encolher e a página ganha scroll horizontal a 360px. */}
        {empty ? null : (
          <fieldset className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-soft">
            <legend className="px-1 text-sm font-bold text-navy">Condições</legend>
            <p className="mt-1 text-xs text-muted-foreground">
              Sai na proposta o que estiver marcado. Desmarcar vale só para esta proposta — o padrão
              das outras não muda. A lista acompanha os itens: entra e sai conforme o que você monta.
            </p>

            <ul className="mt-3 space-y-2">
              {terms.map((term) => {
                const off = dropped.includes(term.id);
                return (
                  <li key={term.id}>
                    <label className="flex gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={!off}
                        aria-describedby={term.risk && off ? `risco-${term.id}` : undefined}
                        onChange={() =>
                          setDropped((current) =>
                            off ? current.filter((id) => id !== term.id) : [...current, term.id]
                          )
                        }
                        className="mt-1 h-4 w-4 shrink-0 accent-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                      />
                      <span className={off ? "text-muted-foreground line-through" : undefined}>
                        {term.text}
                      </span>
                    </label>
                    {term.risk && off ? (
                      <p
                        id={`risco-${term.id}`}
                        role="status"
                        className="ml-6 mt-1 text-sm font-semibold text-red-900"
                      >
                        <span aria-hidden="true">⚠</span> {term.risk}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {keptTerms.length === 0 && extraTerms.trim().length === 0 ? (
              <p
                role="status"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
              >
                <span aria-hidden="true">⚠</span> Nenhuma condição marcada. A proposta sai sem a
                seção Condições — nada limita o que a Vértice prometeu.
              </p>
            ) : null}

            <label
              htmlFor="extra-terms"
              className="mt-4 flex flex-col gap-1 text-xs font-semibold text-muted-foreground"
            >
              Condição só desta proposta
              <textarea
                id="extra-terms"
                value={extraTerms}
                onChange={(event) => setExtraTerms(event.target.value)}
                rows={2}
                maxLength={2400}
                placeholder="Pagamento via PIX até o dia 10."
                className="resize-y rounded-md border border-border bg-white px-2 py-1.5 text-sm font-normal text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              />
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Uma por linha. Entram no fim da lista, depois das marcadas acima.
            </p>
          </fieldset>
        )}
      </div>

      {/* min-w-0 pelo mesmo motivo dos fieldsets: item de grid nasce com
          min-width:auto e se recusa a encolher abaixo do próprio min-content.
          O nome do item na lista da proposta media 360px a 360px de tela e
          esticava a coluna inteira — a página andava 31px para o lado. */}
      <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-border bg-white shadow-elevated">
          <h3 className="border-b border-border px-4 py-3 font-bold text-navy">Proposta</h3>

          {empty ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum serviço selecionado ainda. Coloque a quantidade ao lado de cada item para montar a
              proposta.
            </p>
          ) : (
            <div className="space-y-4 p-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="extra-discount"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Desconto extra
                </label>
                <select
                  id="extra-discount"
                  value={extra}
                  onChange={(event) => setExtra(Number(event.target.value))}
                  className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {EXTRA_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Só vale contra 12 meses pré-pago, no máximo 10% além da tabela.
                </p>
              </div>

              {quote.recurring.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mensal ·{" "}
                    {quote.discountPct > 0
                      ? `${Math.round(quote.discountPct * 100)}% de desconto`
                      : "sem desconto"}
                  </h4>
                  <ul className="mt-1 space-y-1">
                    {quote.recurring.map((line) => (
                      <li key={line.offerId} className="flex justify-between gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-foreground">
                          {line.qty > 1 ? `${line.qty}× ` : ""}
                          {line.name}
                        </span>
                        <span className="shrink-0 font-mono">
                          {line.final !== line.list ? (
                            <span className="mr-1 text-xs text-muted-foreground line-through">
                              {brl(line.list)}
                            </span>
                          ) : null}
                          {brl(line.final)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {quote.oneTime.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Projeto e avulso · nunca entra em desconto
                  </h4>
                  <ul className="mt-1 space-y-1">
                    {quote.oneTime.map((line) => (
                      <li key={line.offerId} className="flex justify-between gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-foreground">
                          {line.qty > 1 ? `${line.qty}× ` : ""}
                          {line.name}
                        </span>
                        <span className="shrink-0 font-mono">{brl(line.final)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <dl className="space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="font-semibold text-navy">Mensalidade</dt>
                  <dd className="font-mono text-lg font-bold text-navy">{brl(quote.monthlyFinal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-semibold text-navy">Entrada (projeto)</dt>
                  <dd className="font-mono font-bold text-navy">{brl(quote.oneTimeTotal)}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Custo mensal</dt>
                  <dd className="font-mono">{brl(quote.monthlyCost)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Margem bruta mensal</dt>
                  <dd
                    className={
                      marginBand(quote.monthlyMarginPct ?? 1) === "furou"
                        ? "font-mono font-bold text-red-700"
                        : marginBand(quote.monthlyMarginPct ?? 1) === "atencao"
                          ? "font-mono font-bold text-gold-dark"
                          : "font-mono font-bold text-navy"
                    }
                  >
                    {quote.monthlyMarginPct === null
                      ? "—"
                      : marginBand(quote.monthlyMarginPct) === "furou"
                        ? /* uma decimal: 39,87% arredondado para "40%" ao lado de
                             "furou o piso de 40%" se lê como contradição */
                          `${(quote.monthlyMarginPct * 100).toFixed(1).replace(".", ",")}%`
                        : `${Math.round(quote.monthlyMarginPct * 100)}%`}
                    {marginBand(quote.monthlyMarginPct ?? 1) === "furou" ? " · furou o piso" : ""}
                  </dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Horas por mês</dt>
                  <dd className="font-mono">
                    {quote.hoursPerMonth}h · {quote.capacityPct}% de um operador
                  </dd>
                </div>
              </dl>

              {quote.warnings.length > 0 ? (
                <div
                  role="status"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
                >
                  <h4 className="flex items-center gap-1.5 font-bold">
                    <span aria-hidden="true">⚠</span>
                    {quote.warnings.length === 1
                      ? "1 coisa para resolver antes de propor"
                      : `${quote.warnings.length} coisas para resolver antes de propor`}
                  </h4>
                  <ul className="mt-2 space-y-1.5">
                    {quote.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p role="status" className="rounded-lg bg-card p-3 text-sm font-semibold text-navy">
                  ✓ Dentro da tabela e acima do piso. Pode propor.
                </p>
              )}

              <form action={saveProposal} className="space-y-2 border-t border-border pt-3">
                {draft ? <input type="hidden" name="proposalId" value={draft.id} /> : null}
                <input type="hidden" name="lines" value={JSON.stringify(lines)} />
                <input type="hidden" name="extraDiscount" value={extra} />
                <input type="hidden" name="droppedTerms" value={dropped.join(",")} />
                <input type="hidden" name="extraTerms" value={extraTerms} />

                {/* O aviso de risco mora lá em cima, junto da caixa desmarcada.
                    Aqui embaixo é onde ele clica em salvar, e a decisão precisa
                    estar na frente dele na hora de fechar, não só na hora de
                    desmarcar. */}
                {droppedRisks.length > 0 ? (
                  <p
                    role="status"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
                  >
                    <span aria-hidden="true">⚠</span>{" "}
                    {droppedRisks.length === 1
                      ? "1 condição que protege a Vértice está desmarcada."
                      : `${droppedRisks.length} condições que protegem a Vértice estão desmarcadas.`}{" "}
                    Depois de salvar, a proposta não muda mais.
                  </p>
                ) : null}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="proposal-title"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Título da proposta
                  </label>
                  <input
                    id="proposal-title"
                    name="title"
                    maxLength={120}
                    defaultValue={draft?.title ?? ""}
                    placeholder="Alterações nos sites Seven e Mhédicos"
                    className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="proposal-notes"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Observações para o cliente
                  </label>
                  <textarea
                    id="proposal-notes"
                    name="notes"
                    rows={3}
                    maxLength={1200}
                    defaultValue={draft?.notes ?? ""}
                    placeholder="O que o cliente precisa saber e não está no escopo padrão."
                    className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="proposal-valid"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Validade (dias)
                  </label>
                  <input
                    id="proposal-valid"
                    name="validDays"
                    type="number"
                    min={1}
                    max={180}
                    step={1}
                    inputMode="numeric"
                    defaultValue={draft?.validDays ?? PROPOSAL_VALID_DAYS}
                    className="w-24 rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="proposal-client"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Salvar para o cliente
                  </label>
                  <select
                    id="proposal-client"
                    name="clientId"
                    defaultValue={defaultClientId ?? ""}
                    required
                    className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    <option value="">Escolha um cliente…</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={clients.length === 0}
                  className="w-full rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {draft ? "Salvar alterações" : "Salvar proposta"}
                </button>
                {draft ? (
                  <p className="text-xs text-muted-foreground">
                    O link do cliente é o mesmo — quem já recebeu vê a versão corrigida. A data e a
                    validade recomeçam hoje.{" "}
                    <Link
                      href="/admin/precos"
                      className="font-semibold text-navy underline underline-offset-2"
                    >
                      Descartar edição
                    </Link>
                  </p>
                ) : null}
                {clients.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Cadastre um cliente em Onboarding para poder salvar.
                  </p>
                ) : null}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
