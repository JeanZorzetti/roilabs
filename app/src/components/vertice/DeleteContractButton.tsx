"use client";

import { deleteContract } from "@/lib/vertice/actions";

/**
 * Botão de excluir contrato — client component só pelo `confirm()`, igual ao
 * `DeleteDeliveryButton`. Contrato aceito também se exclui (linha de teste
 * precisa sair), mas o aviso diz o que se perde.
 */
export function DeleteContractButton({
  id,
  title,
  accepted,
}: {
  id: number;
  title: string;
  accepted: boolean;
}) {
  return (
    <form
      action={deleteContract}
      onSubmit={(event) => {
        const warning = accepted
          ? `Excluir "${title}"?\n\nO cliente já aceitou este contrato — excluir apaga o registro do aceite e derruba o link que ele tem. A proposta continua aceita. Não dá para desfazer.`
          : `Excluir "${title}"?\n\nO link do cliente para este contrato para de funcionar. Não dá para desfazer.`;
        if (!window.confirm(warning)) event.preventDefault();
      }}
    >
      <input type="hidden" name="contractId" value={id} />
      <button
        type="submit"
        className="-mx-1 inline-block min-h-[24px] px-1 py-1 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
      >
        Excluir este contrato
      </button>
    </form>
  );
}
