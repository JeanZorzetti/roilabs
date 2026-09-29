import Link from "next/link";
import { DocLink } from "@/components/vertice/DocLink";
import { DeleteContractButton } from "@/components/vertice/DeleteContractButton";
import type { ContractRow } from "@/lib/vertice/data";

/**
 * Cartão de um contrato salvo. Interno: link, status, pendências e ações. O que
 * o cliente vê é a /c/<slug>.
 */

const TZ = "America/Sao_Paulo";

export function ContractCard({
  contract,
  clientName,
}: {
  contract: ContractRow;
  clientName: string;
}) {
  const missing = contract.doc?.missing ?? [];
  const title = contract.doc?.title ?? "Contrato";

  return (
    <li className="rounded-xl border border-border bg-white p-4 shadow-soft">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-navy">Vértice</span>
        <p className="font-semibold text-navy">{title}</p>
      </div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-navy/50">{clientName}</p>
      <p className="mt-1 font-mono text-sm text-muted-foreground">
        emitido em{" "}
        {new Date(contract.created_at).toLocaleString("pt-BR", {
          timeZone: TZ,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {contract.doc?.proposalTitle ? ` · proposta ${contract.doc.proposalTitle}` : ""}
      </p>

      {missing.length > 0 ? (
        <div role="note" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-semibold">
            <span aria-hidden="true">⚠</span> {missing.length}{" "}
            {missing.length === 1 ? "pendência trava" : "pendências travam"} o aceite
          </p>
          <p className="mt-1 text-xs">{missing.join(" · ")}</p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <DocLink prefix="/c/" slug={contract.slug} />

        {contract.accepted_at ? (
          <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">
            Aceito{" "}
            {new Date(contract.accepted_at).toLocaleDateString("pt-BR", { timeZone: TZ })}
            {contract.accepted_by ? ` · ${contract.accepted_by}` : ""}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {missing.length > 0 ? "Não envie ainda" : "Aguardando aceite"}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {/* Contrato aceito não abre para edição: o update recusa de qualquer jeito. */}
        {contract.accepted_at ? null : (
          <Link
            href={`/admin/contratos/novo?editar=${contract.id}`}
            className="-mx-1 inline-block min-h-[24px] px-1 py-1 text-xs font-semibold text-navy underline underline-offset-2 hover:text-navy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Editar este contrato
          </Link>
        )}

        <DeleteContractButton
          id={contract.id}
          title={title}
          accepted={Boolean(contract.accepted_at)}
        />
      </div>
    </li>
  );
}
