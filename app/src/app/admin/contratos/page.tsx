import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell, DbErrorState } from "@/components/vertice/AdminShell";
import { ContractCard } from "@/components/vertice/ContractCard";
import { listAllContracts, type ContractRow } from "@/lib/vertice/data";

export const metadata: Metadata = {
  title: "Contratos · Admin Vértice",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ContratosPage() {
  let contracts: (ContractRow & { client_name: string })[] = [];
  let dbError: string | null = null;

  try {
    contracts = await listAllContracts();
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  const accepted = contracts.filter((c) => c.accepted_at).length;

  return (
    <AdminShell
      title="Contratos"
      lead="O contrato de cada proposta, com o link que vai para o cliente e o registro do aceite. Aceitar o contrato aceita a proposta junto."
    >
      {dbError ? (
        <DbErrorState message={dbError} />
      ) : contracts.length === 0 ? (
        <p className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
          Nenhum contrato emitido ainda. O contrato nasce de uma proposta: abra{" "}
          <Link href="/admin/propostas" className="text-navy underline underline-offset-2">
            Propostas
          </Link>{" "}
          e use “Emitir contrato” no cartão dela.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {contracts.length} contrato{contracts.length > 1 ? "s" : ""} · {accepted} aceito
            {accepted === 1 ? "" : "s"} · {contracts.length - accepted} aguardando
          </p>
          <ul className="space-y-3">
            {contracts.map((contract) => (
              <ContractCard key={contract.id} contract={contract} clientName={contract.client_name} />
            ))}
          </ul>
        </>
      )}
    </AdminShell>
  );
}
