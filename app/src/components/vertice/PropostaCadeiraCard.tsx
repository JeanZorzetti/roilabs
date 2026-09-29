import { excluirPropostaCadeira } from "@/app/admin/propostas/actions";
import { DocLink, ROI_APP } from "@/components/vertice/DocLink";
import { brl, type PropostaCadeiraDoc } from "@/lib/precos-cadeira";

/**
 * Cartão de uma proposta de cadeira (spec 019) em /admin/propostas. Mesmo esqueleto do
 * ProposalCard da Vértice, sem margem nem aceite: a cadeira não tem custo por linha, e o
 * fechamento acontece fora do link (contrato e cobrança da anuidade).
 */

const TZ = "America/Sao_Paulo";
const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ });

export function PropostaCadeiraCard({ id, slug, doc }: { id: string; slug: string; doc: PropostaCadeiraDoc }) {
  const vencida = Date.now() > new Date(doc.validaAte).getTime();
  const e = doc.estimativa;

  return (
    <li className="rounded-xl border border-border bg-white p-4 shadow-soft">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-white">Cadeira</span>
        <p className="font-semibold text-navy">Proposta para {doc.paraQuem}</p>
      </div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-navy/50">{doc.nicho.nome}</p>

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-sm text-muted-foreground">
          {new Date(doc.criadaEm).toLocaleString("pt-BR", {
            timeZone: TZ,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="font-mono text-sm">
          <strong className="text-navy">{brl(doc.entradaTotal)}/ano</strong>
          {e ? (
            <>
              <span className="ml-2 text-navy">+ {brl(e.comissaoMes)}/mês de comissão</span>
              <span className="ml-2 text-muted-foreground">{brl(e.totalAno)} no 1º ano</span>
            </>
          ) : (
            <span className="ml-2 text-muted-foreground">sem ritmo combinado</span>
          )}
        </p>
      </div>

      <p className="mt-2 text-sm text-navy">{doc.comissao.resumo}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <DocLink prefix="/p/" slug={slug} site={ROI_APP} />
        <span className="text-xs text-muted-foreground">
          {vencida ? `Vencida em ${data(doc.validaAte)}` : `Válida até ${data(doc.validaAte)}`}
        </span>
      </div>

      <form action={excluirPropostaCadeira} className="mt-3">
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="-mx-1 inline-block min-h-[24px] px-1 py-1 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Excluir esta proposta
        </button>
      </form>
    </li>
  );
}
