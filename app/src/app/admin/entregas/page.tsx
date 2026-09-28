import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell, DbErrorState } from "@/components/vertice/AdminShell";
import { DeliveryCard } from "@/components/vertice/DeliveryCard";
import { listAllDeliveries, type DeliveryRow } from "@/lib/vertice/data";

export const metadata: Metadata = {
  title: "Entregas · Admin Vértice",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EntregasPage() {
  let deliveries: (DeliveryRow & { client_name: string })[] = [];
  let dbError: string | null = null;

  try {
    deliveries = await listAllDeliveries();
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  const confirmed = deliveries.filter((d) => d.confirmed_at).length;
  const pending = deliveries.length - confirmed;

  return (
    <AdminShell
      title="Termos de entrega"
      lead="O registro do que foi entregue, com o link que vai para o cliente e a confirmação de recebimento. Fecha o ciclo que a proposta e o aceite começam."
      action={
        <Link
          href="/admin/entregas/nova"
          className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Emitir termo
        </Link>
      }
    >
      {dbError ? (
        <DbErrorState message={dbError} />
      ) : deliveries.length === 0 ? (
        <p className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
          Nenhum termo emitido ainda. Emita a partir de uma proposta aceita, em{" "}
          <Link href="/admin/propostas" className="text-navy underline underline-offset-2">
            Propostas
          </Link>
          , ou comece em branco no botão acima.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {deliveries.length} termo{deliveries.length > 1 ? "s" : ""} · {confirmed} confirmado
            {confirmed === 1 ? "" : "s"} · {pending} aguardando
          </p>
          <ul className="space-y-3">
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                clientName={delivery.client_name}
              />
            ))}
          </ul>
        </>
      )}
    </AdminShell>
  );
}
