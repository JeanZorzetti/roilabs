import Link from "next/link";
import { DocLink } from "@/components/vertice/DocLink";
import { DeleteDeliveryButton } from "@/components/vertice/DeleteDeliveryButton";
import type { DeliveryRow } from "@/lib/vertice/data";
import { brDate } from "@/lib/vertice/delivery";

/**
 * Cartão de um termo salvo. Interno: mostra o link, o status e as ações. O que
 * o cliente vê é a /e/<slug>.
 */

const TZ = "America/Sao_Paulo";

const KIND_LABEL: Record<string, string> = {
  final: "Entrega final",
  marco: "Marco de contrato",
};

export function DeliveryCard({
  delivery,
  clientName,
}: {
  delivery: DeliveryRow;
  clientName: string;
}) {
  const completed = brDate(delivery.doc?.completedAt ?? "");

  return (
    <li className="rounded-xl border border-border bg-white p-4 shadow-soft">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-navy/50">{clientName}</p>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-semibold text-navy">{delivery.doc?.title ?? "Termo de entrega"}</p>
        <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-navy">
          {KIND_LABEL[delivery.kind] ?? delivery.kind}
        </span>
      </div>

      <p className="mt-1 font-mono text-sm text-muted-foreground">
        emitido em{" "}
        {new Date(delivery.created_at).toLocaleString("pt-BR", {
          timeZone: TZ,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {completed ? ` · entrega concluída em ${completed}` : ""}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <DocLink prefix="/e/" slug={delivery.slug} />

        {delivery.confirmed_at ? (
          <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">
            Recebimento confirmado{" "}
            {new Date(delivery.confirmed_at).toLocaleDateString("pt-BR", { timeZone: TZ })}
            {delivery.confirmed_by ? ` · ${delivery.confirmed_by}` : ""}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Aguardando confirmação</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {/* Termo confirmado não abre para edição: o server action recusa o update
            de qualquer jeito, e oferecer o link seria prometer o que não vai
            acontecer. Corrigir depois da confirmação é emitir outro termo. */}
        {delivery.confirmed_at ? null : (
          <Link
            href={`/admin/entregas/nova?editar=${delivery.id}`}
            className="-mx-1 inline-block min-h-[24px] px-1 py-1 text-xs font-semibold text-navy underline underline-offset-2 hover:text-navy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Editar este termo
          </Link>
        )}

        <DeleteDeliveryButton
          id={delivery.id}
          title={delivery.doc?.title ?? "Termo de entrega"}
          confirmed={Boolean(delivery.confirmed_at)}
        />
      </div>
    </li>
  );
}
