"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { deleteClient } from "@/lib/vertice/actions";

/**
 * Seletor de cliente. <select> nativo: teclado, busca por letra e o picker do
 * mobile vêm de graça. A escolha vai para a URL — recarregar ou compartilhar o
 * link mantém o contexto.
 */

export type PickerClient = { id: number; name: string };

export function ClientPicker({
  clients,
  selectedId,
  paramName = "cliente",
}: {
  clients: PickerClient[];
  selectedId: number | null;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(paramName, value);
    else params.delete(paramName);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="client-picker" className="text-xs font-bold uppercase tracking-wider text-navy/60">
        Cliente
      </label>
      <select
        id="client-picker"
        value={selectedId ?? ""}
        onChange={(event) => select(event.target.value)}
        className="min-w-[220px] rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <option value="">Escolha um cliente…</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Exclusão nomeia o alvo — "Tem certeza?" vira reflexo e para de proteger. */
export function DeleteClientButton({ id, name }: { id: number; name: string }) {
  return (
    <form
      action={deleteClient}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Excluir o cliente ${name}?\n\nO progresso do onboarding, as propostas e os termos de entrega dele vão junto — inclusive os já confirmados pelo cliente, e o link /e/<slug> dele para de funcionar. Não dá para desfazer.`
        );
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="clientId" value={id} />
      <button
        type="submit"
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      >
        Excluir {name}
      </button>
    </form>
  );
}
