"use client";

import { deleteDelivery } from "@/lib/vertice/actions";

/**
 * Botão de excluir termo, isolado num client component só por causa do
 * `confirm()` — mesmo padrão do `DeleteClientButton` em ClientPicker.tsx.
 * Exclusão nomeia o alvo e avisa que o link do cliente para de funcionar,
 * inclusive quando o recebimento já foi confirmado (a exclusão não tem trava
 * no banco: o dono precisa poder apagar linha de teste).
 */
export function DeleteDeliveryButton({
  id,
  title,
  confirmed,
}: {
  id: number;
  title: string;
  confirmed: boolean;
}) {
  return (
    <form
      action={deleteDelivery}
      onSubmit={(event) => {
        const warning = confirmed
          ? `Excluir "${title}"?\n\nO cliente já confirmou o recebimento deste termo — excluir apaga esse registro e derruba o link que ele tem. Não dá para desfazer.`
          : `Excluir "${title}"?\n\nO link do cliente para este termo para de funcionar. Não dá para desfazer.`;
        const ok = window.confirm(warning);
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="deliveryId" value={id} />
      <button
        type="submit"
        className="-mx-1 inline-block min-h-[24px] px-1 py-1 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      >
        Excluir este termo
      </button>
    </form>
  );
}
