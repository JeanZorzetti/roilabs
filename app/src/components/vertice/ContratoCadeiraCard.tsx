import Link from "next/link";
import { excluirContratoCadeira } from "@/app/admin/contratos/cadeira/actions";
import { DocLink, ROI_APP } from "@/components/vertice/DocLink";
import type { ContratoCadeiraDoc } from "@/lib/contrato-cadeira";

/**
 * Cartão de um contrato de cadeira (spec 020) em /admin/contratos. Mesmo esqueleto do
 * ContractCard da Vértice. Aceito não edita nem exclui: é a prova do que foi fechado.
 */

const TZ = "America/Sao_Paulo";
const LINK =
  "-mx-1 inline-block min-h-[24px] px-1 py-1 text-xs font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export type ContratoCadeiraResumo = {
  id: string;
  slug: string;
  criadoEm: Date;
  aceitoEm: Date | null;
  aceitoPor: string | null;
  doc: ContratoCadeiraDoc;
};

/** Estado do contrato numa linha — o mesmo texto no cartão do contrato e no da proposta. */
export function EstadoContrato({ c }: { c: Pick<ContratoCadeiraResumo, "aceitoEm" | "aceitoPor" | "doc"> }) {
  if (c.aceitoEm) {
    return (
      <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">
        Aceito {c.aceitoEm.toLocaleDateString("pt-BR", { timeZone: TZ })}
        {c.aceitoPor ? ` · ${c.aceitoPor}` : ""}
      </span>
    );
  }
  const n = c.doc.pendencias.length;
  return (
    <span className="text-xs text-muted-foreground">
      {n > 0 ? `Não envie ainda: ${n} ${n === 1 ? "pendência trava" : "pendências travam"} o aceite` : "Aguardando aceite"}
    </span>
  );
}

export function ContratoCadeiraCard({ contrato }: { contrato: ContratoCadeiraResumo }) {
  const { doc } = contrato;
  return (
    <li className="rounded-xl border border-border bg-white p-4 shadow-soft">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">Cadeira</span>
        <p className="font-semibold text-navy">{doc.titulo}</p>
      </div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-navy/50">{doc.proposta.paraQuem}</p>
      <p className="font-mono text-sm text-muted-foreground">
        emitido em{" "}
        {contrato.criadoEm.toLocaleString("pt-BR", {
          timeZone: TZ,
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        · proposta{" "}
        {/* Relativo: a /p/ mora neste mesmo app. ROI_APP vem de módulo "use client" e, lido aqui no
            servidor, vira referência de cliente em vez de string. */}
        <a href={`/p/${doc.proposta.slug}`} target="_blank" rel="noopener" className="text-navy underline underline-offset-2">
          /p/{doc.proposta.slug}
        </a>
      </p>

      {doc.pendencias.length > 0 && !contrato.aceitoEm ? (
        <div role="note" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-semibold">
            <span aria-hidden="true">⚠</span> Falta preencher
          </p>
          <p className="mt-1 text-xs">{doc.pendencias.join(" · ")}</p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <DocLink prefix="/c/" slug={contrato.slug} site={ROI_APP} />
        <EstadoContrato c={contrato} />
      </div>

      {contrato.aceitoEm ? null : (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href={`/admin/contratos/cadeira?editar=${contrato.id}`}
            className={`${LINK} text-navy hover:text-navy-dark focus-visible:outline-gold`}
          >
            Editar este contrato
          </Link>
          <form action={excluirContratoCadeira}>
            <input type="hidden" name="id" value={contrato.id} />
            <button type="submit" className={`${LINK} text-red-700 hover:text-red-900 focus-visible:outline-red-700`}>
              Excluir este contrato
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
