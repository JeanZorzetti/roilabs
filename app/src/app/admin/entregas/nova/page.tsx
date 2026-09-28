import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell, DbErrorState } from "@/components/vertice/AdminShell";
import { DeliveryEditor } from "@/components/vertice/DeliveryEditor";
import { getDelivery, getProposal, listClients, type ClientSummary } from "@/lib/vertice/data";
import {
  defaultSections,
  DELIVERY_SECTIONS,
  sectionsFromProposal,
  sectionText,
  type DeliveryInput,
} from "@/lib/vertice/delivery";

export const metadata: Metadata = {
  title: "Novo termo de entrega · Admin Vértice",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";

/** Hoje em `YYYY-MM-DD`, no fuso de São Paulo. `en-CA` é o formato ISO de graça. */
function today(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

type Props = {
  searchParams: Promise<{ proposta?: string; cliente?: string; editar?: string }>;
};

export default async function NovaEntregaPage({ searchParams }: Props) {
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
    !dbError && Number.isInteger(editId) && editId > 0 ? await getDelivery(editId) : null;

  const proposalId = Number(params.proposta);
  const proposal =
    !dbError && !editing && Number.isInteger(proposalId) && proposalId > 0
      ? await getProposal(proposalId)
      : null;

  // Pré-preenchimento: as linhas da proposta viram itens de "O que foi entregue".
  // É ponto de partida, não vínculo — o operador edita ou remove antes de salvar.
  const prefilled = new Map(
    (proposal?.doc ? sectionsFromProposal(proposal.doc) : []).map((section) => [
      section.id,
      sectionText(section),
    ])
  );

  const initial: DeliveryInput = editing?.input ?? {
    kind: "final",
    title: "",
    completedAt: today(),
    summary: null,
    enabled: defaultSections("final"),
    text: Object.fromEntries(
      DELIVERY_SECTIONS.map((def) => [def.id, prefilled.get(def.id) ?? ""])
    ),
    registro: {
      serviceLabel: proposal?.doc?.title ?? "",
      amount: proposal?.doc ? proposal.doc.oneTime + proposal.doc.monthly || null : null,
      paidAt: null,
    },
  };

  // `Number(undefined)` é NaN, e nenhum cliente tem id NaN — o `find` devolve
  // undefined e a tela abre sem cliente escolhido, que é o certo.
  const clientId = editing?.client_id ?? proposal?.client_id ?? Number(params.cliente);
  const client = clients.find((c) => c.id === clientId) ?? null;

  return (
    <AdminShell
      title={editing ? `Editando termo · ${client?.name ?? ""}` : "Novo termo de entrega"}
      lead={
        editing
          ? "Corrija o que precisa e salve: o termo é reescrito no mesmo link, então quem já recebeu passa a ver esta versão."
          : "Ligue só as seções que este termo precisa. Seção ligada e vazia não sai no documento."
      }
    >
      {dbError ? (
        <DbErrorState message={dbError} />
      ) : editing?.confirmed_at ? (
        <p
          role="status"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          <span aria-hidden="true">⚠</span> Este termo já teve o recebimento confirmado pelo
          cliente e não pode ser editado — é o que ele registrou ter recebido. Para corrigir, emita
          um termo novo.{" "}
          <Link href="/admin/entregas" className="font-semibold underline underline-offset-2">
            Voltar para a lista
          </Link>
        </p>
      ) : (
        <>
          {proposal ? (
            <p className="mb-6 rounded-xl border border-border border-l-4 border-l-gold bg-card p-4 text-sm text-navy">
              Pré-preenchido com as linhas da proposta{" "}
              <strong className="font-semibold">{proposal.doc?.title ?? `#${proposal.id}`}</strong>.
              Edite o que mudou na execução — o termo registra o que foi entregue, não o que foi
              oferecido.
            </p>
          ) : null}
          {/* key: sem ela o React reaproveita o componente ao trocar de ?editar=
              ou ?proposta=, e o estado do termo anterior fica na tela. Prefixo
              "d"/"p" separa os dois espaços de id — editar=3 e proposta=3 não
              podem colidir na mesma key. */}
          <DeliveryEditor
            key={editing ? `d${editing.id}` : proposal ? `p${proposal.id}` : "novo"}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
            defaultClientId={client?.id ?? null}
            initial={initial}
            deliveryId={editing?.id ?? null}
            proposalId={editing?.proposal_id ?? proposal?.id ?? null}
          />
        </>
      )}
    </AdminShell>
  );
}
