import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell, DbErrorState } from "@/components/vertice/AdminShell";
import { ProposalCard } from "@/components/vertice/ProposalCard";
import { listAllProposals, type ProposalRow } from "@/lib/vertice/data";

export const metadata: Metadata = {
  title: "Propostas · Admin Vértice",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PropostasPage() {
  let proposals: (ProposalRow & { client_name: string })[] = [];
  let dbError: string | null = null;

  try {
    proposals = await listAllProposals();
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  const pending = proposals.filter((p) => !p.accepted_at).length;
  const accepted = proposals.length - pending;

  return (
    <AdminShell
      title="Propostas"
      lead="Toda proposta salva, com o link que vai para o cliente e o registro de aceite. O número e a margem aqui são internos; o cliente só vê o documento do link."
      action={
        <Link
          href="/admin/precos"
          className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Montar proposta
        </Link>
      }
    >
      {dbError ? (
        <DbErrorState message={dbError} />
      ) : proposals.length === 0 ? (
        <p className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
          Nenhuma proposta salva ainda. Monte no simulador da{" "}
          <Link href="/admin/precos" className="text-navy underline underline-offset-2">
            Precificação
          </Link>{" "}
          e salve — ela aparece aqui com link próprio para mandar ao cliente.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {proposals.length} proposta{proposals.length > 1 ? "s" : ""} · {accepted} aceita
            {accepted === 1 ? "" : "s"} · {pending} aguardando
          </p>
          <ul className="space-y-3">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                clientName={proposal.client_name}
              />
            ))}
          </ul>
        </>
      )}
    </AdminShell>
  );
}
