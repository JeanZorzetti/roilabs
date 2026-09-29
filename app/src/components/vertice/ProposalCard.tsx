import Link from "next/link";
import { DocLink } from "@/components/vertice/DocLink";
import { deleteProposal } from "@/lib/vertice/actions";
import type { ProposalRow } from "@/lib/vertice/data";
import { brl, findOffer, marginBand } from "@/lib/vertice/catalog";

/**
 * Cartão de uma proposta da Vértice em /admin/propostas. Interno — mostra custo e
 * margem, ao contrário da /p/<slug>. O simulador que montava e editava estas
 * propostas saiu de /admin/precos (hoje é o preço da cadeira da ROI Labs, spec
 * 019), então o cartão não oferece mais "Editar".
 */

const MARGIN_CLASS = {
  furou: "font-mono font-bold text-red-700",
  atencao: "font-mono font-bold text-gold-dark",
  ok: "font-mono text-navy",
} as const;

const TZ = "America/Sao_Paulo";

export function ProposalCard({
  proposal,
  clientName,
}: {
  proposal: ProposalRow;
  /** Só na listagem geral: na tela do cliente o nome já está no título. */
  clientName?: string;
}) {
  const monthly = Number(proposal.monthly);
  const oneTime = Number(proposal.onetime);
  // Margem da parte que existe: proposta só de avulso não tem mensalidade, e
  // mostrar "MB —" nela era esconder justamente o número que importa.
  const recurringMargin = monthly > 0 ? (monthly - Number(proposal.monthly_cost)) / monthly : null;
  // Custo zero aqui significa "não sei": ou a proposta é anterior à coluna, ou a
  // linha livre foi salva sem horas. Mostrar MB 100% nesses casos seria mentira.
  const oneTimeCost = Number(proposal.onetime_cost);
  const oneTimeMargin = oneTime > 0 && oneTimeCost > 0 ? (oneTime - oneTimeCost) / oneTime : null;
  // Sem linhas = montada fora do simulador (pacote de preço fechado): o nome dos
  // itens vem do documento, e ela não abre no simulador para edição.
  const handBuilt = proposal.lines.length === 0;
  const chips = handBuilt
    ? (proposal.doc?.lines ?? []).map((line) => ({ key: line.name, label: line.name, title: undefined }))
    : proposal.lines.map((line, index) =>
        "offerId" in line
          ? {
              key: line.offerId,
              label: `${line.qty > 1 ? `${line.qty}× ` : ""}${findOffer(line.offerId)?.name ?? line.offerId}`,
              title: undefined,
            }
          : {
              key: `livre-${index}`,
              label: `${line.qty > 1 ? `${line.qty}× ` : ""}${line.label}`,
              title: line.label,
            }
      );

  return (
    <li className="rounded-xl border border-border bg-white p-4 shadow-soft">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-navy">Vértice</span>
        {proposal.doc?.title ? <p className="font-semibold text-navy">{proposal.doc.title}</p> : null}
      </div>
      {clientName ? (
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-navy/50">{clientName}</p>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-sm text-muted-foreground">
          {new Date(proposal.created_at).toLocaleString("pt-BR", {
            timeZone: TZ,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="font-mono text-sm">
          {monthly > 0 ? (
            <>
              <strong className="text-navy">{brl(monthly)}/mês</strong>
              {recurringMargin !== null ? (
                <span className={`ml-2 ${MARGIN_CLASS[marginBand(recurringMargin)]}`}>
                  MB {Math.round(recurringMargin * 100)}%
                </span>
              ) : null}
            </>
          ) : null}

          {oneTime > 0 ? (
            <>
              <strong className={monthly > 0 ? "ml-2 text-navy" : "text-navy"}>
                {monthly > 0 ? "+ " : ""}
                {brl(oneTime)}
                {monthly > 0 ? " de entrada" : " avulso"}
              </strong>
              {oneTimeMargin !== null ? (
                <span className={`ml-2 ${MARGIN_CLASS[marginBand(oneTimeMargin)]}`}>
                  MB {Math.round(oneTimeMargin * 100)}%
                </span>
              ) : null}
            </>
          ) : null}

          {monthly === 0 && oneTime === 0 ? (
            <span className="text-muted-foreground">sem valor</span>
          ) : null}

          {Number(proposal.discount_pct) > 0 ? (
            <span className="ml-2 text-muted-foreground">
              −{Math.round(Number(proposal.discount_pct) * 100)}%
            </span>
          ) : null}
        </p>
      </div>

      <ul className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <li
            key={chip.key}
            className="max-w-[22rem] truncate rounded-full border border-border px-2 py-0.5 text-xs text-navy"
            title={chip.title}
          >
            {chip.label}
          </li>
        ))}
      </ul>

      {proposal.bundle ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Uma das opções de uma proposta com alternativas: o link abre todas, e o cliente aceita uma.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {proposal.slug ? (
          <DocLink prefix="/p/" slug={proposal.slug} />
        ) : (
          <span className="text-xs text-muted-foreground">
            Proposta antiga, salva antes do link — monte de novo para gerar um.
          </span>
        )}

        {proposal.accepted_at ? (
          <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">
            Aceita{" "}
            {new Date(proposal.accepted_at).toLocaleDateString("pt-BR", { timeZone: TZ })}
            {proposal.accepted_by ? ` · ${proposal.accepted_by}` : ""}
          </span>
        ) : proposal.sibling_accepted ? (
          <span className="text-xs text-muted-foreground">Outra opção foi aceita</span>
        ) : (
          <span className="text-xs text-muted-foreground">Aguardando aceite</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {/* Contrato nasce de qualquer proposta ainda em jogo: aceitar o contrato
            aceita a proposta junto. Opção preterida no pacote não fecha mais. */}
        {proposal.doc && !proposal.sibling_accepted ? (
          <Link
            href={`/admin/contratos/novo?proposta=${proposal.id}`}
            className="-mx-1 inline-block min-h-[24px] px-1 py-1 text-xs font-semibold text-navy underline underline-offset-2 hover:text-navy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Emitir contrato
          </Link>
        ) : null}

        {/* Proposta aceita é o gatilho do termo: o que foi fechado já pode ser
            entregue, e o termo nasce pré-preenchido com as linhas dela. */}
        {proposal.accepted_at ? (
          <Link
            href={`/admin/entregas/nova?proposta=${proposal.id}`}
            className="-mx-1 inline-block min-h-[24px] px-1 py-1 text-xs font-semibold text-navy underline underline-offset-2 hover:text-navy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Emitir termo de entrega
          </Link>
        ) : null}

        <form action={deleteProposal}>
          <input type="hidden" name="proposalId" value={proposal.id} />
          <button
            type="submit"
            className="-mx-1 inline-block min-h-[24px] px-1 py-1 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            Excluir esta proposta
          </button>
        </form>
      </div>
    </li>
  );
}
