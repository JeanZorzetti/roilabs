import type { Metadata } from "next";
import { AdminShell, DbErrorState } from "@/components/vertice/AdminShell";
import { ProposalCard } from "@/components/vertice/ProposalCard";
import { QuoteSimulator } from "@/components/vertice/QuoteSimulator";
import {
  getProposal,
  listClients,
  listProposals,
  type ClientSummary,
  type ProposalRow,
} from "@/lib/vertice/data";
import { proposalDraft } from "@/lib/vertice/quote";
import {
  BILLABLE_HOURS_PER_OPERATOR,
  CONTRACT_RULES,
  HOUR_COST,
  HOUR_RATE_EXEC,
  HOUR_RATE_SENIOR,
  MARGIN_FLOOR,
  MARGIN_TARGET,
  OPERATOR_CEILING,
  SERVICES,
  brl,
  marginBand,
} from "@/lib/vertice/catalog";

export const metadata: Metadata = {
  title: "Preços · Admin Vértice",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const COST_BASE: [string, string][] = [
  ["Operador sênior (PJ)", "R$ 10.000/mês"],
  ["Horas nominais", "160h/mês"],
  ["Aproveitamento faturável", "70% → 112h"],
  ["Custo-hora direto", "R$ 89/h"],
  ["+ Impostos (Simples ~10%)", "R$ 98/h"],
  ["+ Overhead (≈ R$ 4.500/mês ÷ 112h)", "R$ 138/h"],
  ["Custo-hora carregado adotado", "R$ 150/h"],
];

const MARGIN_CLASS = {
  furou: "font-mono font-bold text-red-700",
  atencao: "font-mono font-bold text-gold-dark",
  ok: "font-mono text-navy",
} as const;

function marginTone(margin: number): string {
  return MARGIN_CLASS[marginBand(margin)];
}

function SavedProposals({ proposals, clientName }: { proposals: ProposalRow[]; clientName: string }) {
  if (proposals.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
        Nenhuma proposta salva para {clientName} ainda. Monte no simulador acima e salve — sai com link
        próprio para mandar ao cliente e fica o registro de qual número foi oferecido e quando.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {proposals.map((proposal) => (
        <ProposalCard key={proposal.id} proposal={proposal} />
      ))}
    </ul>
  );
}

type Props = { searchParams: Promise<{ cliente?: string; editar?: string }> };

export default async function PrecificacaoPage({ searchParams }: Props) {
  const params = await searchParams;

  let clients: ClientSummary[] = [];
  let dbError: string | null = null;
  try {
    clients = await listClients();
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  const editId = Number(params.editar);
  const editing =
    !dbError && Number.isInteger(editId) && editId > 0 ? await getProposal(editId) : null;
  // Aceita não volta para o simulador: o update no banco recusa, e abrir o
  // formulário mesmo assim seria deixar ele digitar para nada.
  // Sem linhas = montada fora do simulador; abrir aqui mostraria um simulador
  // vazio em cima de um documento que ele não sabe refazer.
  const handBuilt = editing !== null && editing.lines.length === 0;
  const draft = editing && !editing.accepted_at && !handBuilt ? proposalDraft(editing) : null;

  const clientId = Number(params.cliente);
  const client =
    clients.find((c) => c.id === (draft ? draft.clientId : clientId)) ?? null;
  const proposals = client && !dbError ? await listProposals(client.id) : [];

  return (
    <AdminShell
      title="Preços da Vértice"
      lead="Custo, margem e piso de negociação. Este conteúdo não sai daqui — nem em proposta, nem em conversa com cliente."
    >
      <div className="mb-8 rounded-xl border-l-4 border-l-gold border-border bg-card p-4">
        <p className="text-sm text-navy">
          <strong className="font-semibold">Margem bruta alvo ≥ {Math.round(MARGIN_TARGET * 100)}%.</strong>{" "}
          Piso absoluto {Math.round(MARGIN_FLOOR * 100)}% — abaixo disso não se fecha. Hora avulsa fora de
          escopo: R$ {HOUR_RATE_EXEC}/h (execução) ou R$ {HOUR_RATE_SENIOR}/h (consultoria sênior).
        </p>
      </div>

      <section aria-labelledby="simulador" className="mb-14">
        <h2 id="simulador" className="mb-1 text-xl font-bold text-navy">
          {draft ? `Editando proposta · ${client?.name ?? ""}` : "Simulador de proposta"}
        </h2>
        <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
          {draft
            ? "Mexa no que precisa e salve: a proposta é reescrita no mesmo link, então quem já recebeu passa a ver esta versão. A data e a validade recomeçam hoje."
            : "O desconto de combinação só cai nas mensalidades elegíveis: 2 recorrentes −10%, 3 ou mais −15%. Projeto e conteúdo de SEO ficam de fora de propósito."}
        </p>
        {editing && editing.accepted_at ? (
          <p
            role="status"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
          >
            <span aria-hidden="true">⚠</span> Essa proposta já foi aceita e não pode ser editada — é
            o que o cliente fechou. Para mudar o combinado, monte uma proposta nova.
          </p>
        ) : handBuilt ? (
          <p
            role="status"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
          >
            <span aria-hidden="true">⚠</span> Essa proposta foi montada fora do simulador, com preço
            de pacote, e não abre aqui para edição. Para mudar, exclua e monte de novo.
          </p>
        ) : null}
        {/* key: sem ela o React reaproveita o componente ao trocar de ?editar=,
            e o estado da proposta anterior fica na tela. */}
        <QuoteSimulator
          key={draft?.id ?? "novo"}
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          defaultClientId={draft?.clientId ?? client?.id ?? null}
          draft={draft}
        />
      </section>

      {dbError ? (
        <div className="mb-14">
          <DbErrorState message={dbError} />
        </div>
      ) : client ? (
        <section aria-labelledby="salvas" className="mb-14">
          <h2 id="salvas" className="mb-4 text-xl font-bold text-navy">
            Propostas salvas · {client.name}
          </h2>
          <SavedProposals proposals={proposals} clientName={client.name} />
        </section>
      ) : null}

      <section aria-labelledby="tabela" className="mb-14">
        <h2 id="tabela" className="mb-4 text-xl font-bold text-navy">
          Tabela por serviço
        </h2>

        <div className="space-y-6">
          {SERVICES.map((service) => (
            <div key={service.id} className="overflow-x-auto rounded-xl border border-border bg-white">
              <h3 className="border-b border-border px-4 py-3 font-semibold text-navy">{service.name}</h3>
              <table className="w-full min-w-[680px] text-sm">
                <caption className="sr-only">
                  Preço, horas, custo, margem e piso de {service.name}
                </caption>
                <thead className="bg-card text-left text-xs uppercase tracking-wider text-navy/60">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-bold">
                      Item
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-bold">
                      Horas
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-bold">
                      Custo
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-bold">
                      Preço
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-bold">
                      MB
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-bold">
                      Piso
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {service.offers.map((offer) => (
                    <tr key={offer.id}>
                      <th scope="row" className="px-4 py-2.5 text-left font-medium text-foreground">
                        {offer.name}
                        {offer.kind === "recorrente" && !offer.discountEligible ? (
                          <span className="ml-2 rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            fora do desconto
                          </span>
                        ) : null}
                      </th>
                      <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                        {offer.hoursLabel}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                        {offer.cost === undefined ? "—" : brl(offer.cost)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-navy">
                        {offer.priceLabel}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {offer.marginPct === undefined ? (
                          <span className="font-mono text-muted-foreground">—</span>
                        ) : (
                          <span className={marginTone(offer.marginPct)}>
                            {Math.round(offer.marginPct * 100)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                        {offer.floor === null || offer.floor === undefined ? "—" : brl(offer.floor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="base" className="grid gap-6 lg:grid-cols-2">
        {/* overflow-x-auto, não overflow-hidden: os rótulos longos desta tabela
            forçam 503px de min-content e a 360px ela empurrava a página inteira
            para o lado em vez de rolar dentro do próprio card. */}
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <h2 id="base" className="border-b border-border px-4 py-3 font-semibold text-navy">
            Base de custo
          </h2>
          <p className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
            Tudo parte de um número. Mudou o custo do operador? Só este bloco muda — o resto é derivado.
          </p>
          <table className="w-full text-sm">
            <caption className="sr-only">Composição do custo-hora carregado</caption>
            <tbody className="divide-y divide-border">
              {COST_BASE.map(([component, value], index) => (
                <tr key={component} className={index === COST_BASE.length - 1 ? "bg-card" : undefined}>
                  <th scope="row" className="px-4 py-2 text-left font-normal text-foreground">
                    {component}
                  </th>
                  <td className="px-4 py-2 text-right font-mono font-semibold text-navy">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-4">
            <h2 className="font-semibold text-navy">Capacidade — o limite real do negócio</h2>
            <p className="mt-2 text-sm text-foreground">
              {BILLABLE_HOURS_PER_OPERATOR}h faturáveis por operador/mês, a R$ {HOUR_COST}/h de custo
              carregado. Carteira cheia conferida: <strong>{brl(OPERATOR_CEILING)}/mês</strong> de receita
              em 111h.
            </p>
            <p className="mt-2 text-sm text-foreground">
              Passou do teto: contrata, ou sobe preço. Vender além da capacidade é como se perde o cliente
              bom.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <h2 className="font-semibold text-navy">Contrato e desconto</h2>
            <ul className="mt-2 space-y-1.5">
              {CONTRACT_RULES.map((rule) => (
                <li key={rule} className="flex gap-2 text-sm">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
