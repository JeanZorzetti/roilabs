import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell, DbErrorState } from "@/components/vertice/AdminShell";
import { EMPTY_PARTY, FIELD, FOCUS, HINT, LABEL, PartyFields } from "@/components/vertice/PartyFields";
import { saveContract } from "@/lib/vertice/actions";
import { CONTRACT_MONTHS, type ContractInput } from "@/lib/vertice/contract";
import {
  getClient,
  getContract,
  getLastContractDefaults,
  getProposal,
  type ContractRow,
  type ProposalRow,
} from "@/lib/vertice/data";
import { money } from "@/lib/vertice/format";

export const metadata: Metadata = {
  title: "Novo contrato · Admin Vértice",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// As condições de pagamento da proposta viram o ponto de partida do campo. O
// resto das condições já está nas cláusulas fixas.
const PAYMENT_TERM = /pix|cart[aã]o|boleto|pagamento|faturamento|parcela/i;

type Props = {
  searchParams: Promise<{ proposta?: string; editar?: string }>;
};

export default async function NovoContratoPage({ searchParams }: Props) {
  const params = await searchParams;

  let editing: ContractRow | null = null;
  let proposal: ProposalRow | null = null;
  let clientName = "";
  let defaults: Awaited<ReturnType<typeof getLastContractDefaults>> = null;
  let dbError: string | null = null;

  try {
    const editId = Number(params.editar);
    editing = Number.isInteger(editId) && editId > 0 ? await getContract(editId) : null;
    const proposalId = editing ? editing.proposal_id : Number(params.proposta);
    proposal =
      proposalId && Number.isInteger(proposalId) && proposalId > 0
        ? await getProposal(proposalId)
        : null;
    clientName = proposal ? (await getClient(proposal.client_id))?.name ?? "" : "";
    defaults = editing ? null : await getLastContractDefaults();
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  const doc = proposal?.doc ?? null;
  const recurring = (doc?.monthly ?? 0) > 0;

  const initial: ContractInput = editing?.input ?? {
    title: "",
    contratante: EMPTY_PARTY,
    contratada: defaults?.contratada ?? EMPTY_PARTY,
    startDate: "",
    months: CONTRACT_MONTHS,
    forum: defaults?.forum ?? "",
    payment: (doc?.terms ?? []).filter((term) => PAYMENT_TERM.test(term)).join("\n"),
    extra: "",
  };

  const price = doc
    ? [
        doc.monthly > 0 ? `${money(doc.monthly)}/mês` : "",
        doc.oneTime > 0 ? `${money(doc.oneTime)} avulso` : "",
      ]
        .filter(Boolean)
        .join(" + ")
    : "";

  return (
    <AdminShell
      title={editing ? `Editando contrato · ${clientName}` : "Novo contrato"}
      lead={
        editing
          ? "Corrija e salve: o contrato é reescrito no mesmo link, então quem já recebeu passa a ver esta versão."
          : "Escopo, preço e cláusulas saem da proposta. Aqui entram as partes, o prazo, o foro e as formas de pagamento."
      }
    >
      {dbError ? (
        <DbErrorState message={dbError} />
      ) : editing?.accepted_at ? (
        <p role="status" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <span aria-hidden="true">⚠</span> Este contrato já foi aceito pelo cliente e não pode ser
          editado. Para mudar algo, emita um contrato novo.{" "}
          <Link href="/admin/contratos" className="font-semibold underline underline-offset-2">
            Voltar para a lista
          </Link>
        </p>
      ) : !doc || !proposal ? (
        <p role="status" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <span aria-hidden="true">⚠</span> O contrato nasce de uma proposta, e esta não foi
          encontrada — ela pode ter sido excluída. Escolha a proposta em{" "}
          <Link href="/admin/propostas" className="font-semibold underline underline-offset-2">
            Propostas
          </Link>{" "}
          e use “Emitir contrato”.
        </p>
      ) : (
        // key: sem ela o React reaproveita os campos ao trocar de ?editar= ou
        // ?proposta=, e o defaultValue do contrato anterior fica na tela.
        <form
          key={editing ? `k${editing.id}` : `p${proposal.id}`}
          action={saveContract}
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
        >
          <input type="hidden" name="proposalId" value={proposal.id} />
          {editing ? <input type="hidden" name="contractId" value={editing.id} /> : null}

          <div className="space-y-6">
            <PartyFields
              role="contratante"
              heading={`Contratante · ${clientName}`}
              party={initial.contratante}
            />
            <PartyFields role="contratada" heading="Contratada · Vértice" party={initial.contratada} />

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 shadow-soft">
              <label htmlFor="contract-payment" className="text-sm font-bold text-navy">
                Formas de pagamento
              </label>
              <p id="contract-payment-hint" className={HINT}>
                Uma por linha, vindas das condições da proposta. O que você ainda não sabe fica entre
                colchetes, como [percentual]: o aceite fica travado até você trocar.
              </p>
              <textarea
                id="contract-payment"
                name="payment"
                rows={5}
                defaultValue={initial.payment}
                aria-describedby="contract-payment-hint"
                className={`mt-1 font-mono ${FIELD}`}
              />
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 shadow-soft">
              <label htmlFor="contract-extra" className="text-sm font-bold text-navy">
                Condições específicas
              </label>
              <p id="contract-extra-hint" className={HINT}>
                Opcional. Uma por linha, só o que vale para este cliente. Em branco, a cláusula não
                sai no contrato.
              </p>
              <textarea
                id="contract-extra"
                name="extra"
                rows={4}
                defaultValue={initial.extra}
                aria-describedby="contract-extra-hint"
                className={`mt-1 font-mono ${FIELD}`}
              />
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border border-l-4 border-l-gold bg-card p-4 text-sm text-navy">
              <p className="font-semibold">{doc.title}</p>
              <p className="mt-1 font-mono">{price || "sem valor"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {doc.lines.length} {doc.lines.length === 1 ? "item" : "itens"} no Anexo I
                {proposal.accepted_at ? " · proposta já aceita" : ""}
              </p>
            </div>

            {proposal.sibling_accepted ? (
              <p role="note" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <span aria-hidden="true">⚠</span> O cliente aceitou outra opção deste pacote. Este
                contrato não vai poder ser aceito.
              </p>
            ) : null}

            <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-soft">
              <div className="flex flex-col gap-1">
                <label htmlFor="contract-title" className={LABEL}>
                  Título
                </label>
                <input
                  id="contract-title"
                  name="title"
                  maxLength={140}
                  defaultValue={initial.title}
                  placeholder={`Contrato de prestação de serviços — ${clientName}`}
                  className={FIELD}
                />
              </div>

              {recurring ? (
                <div className="flex flex-col gap-1">
                  <label htmlFor="contract-months" className={LABEL}>
                    Vigência em meses
                  </label>
                  <input
                    id="contract-months"
                    name="months"
                    type="number"
                    min={1}
                    max={36}
                    required
                    defaultValue={initial.months}
                    className={`w-24 ${FIELD}`}
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-1">
                <label htmlFor="contract-start" className={LABEL}>
                  Início
                </label>
                <input
                  id="contract-start"
                  name="startDate"
                  type="date"
                  defaultValue={initial.startDate}
                  aria-describedby="contract-start-hint"
                  className={FIELD}
                />
                <p id="contract-start-hint" className={HINT}>
                  Em branco, o contrato começa no dia do aceite.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="contract-forum" className={LABEL}>
                  Foro
                </label>
                <input
                  id="contract-forum"
                  name="forum"
                  maxLength={120}
                  defaultValue={initial.forum}
                  placeholder="ex.: Curitiba/PR"
                  aria-describedby="contract-forum-hint"
                  className={FIELD}
                />
                <p id="contract-forum-hint" className={HINT}>
                  A comarca onde uma disputa seria julgada.
                </p>
              </div>
            </div>

            {editing && editing.doc.missing.length > 0 ? (
              <div role="note" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <p className="font-semibold">
                  <span aria-hidden="true">⚠</span> Falta preencher para o cliente poder aceitar:
                </p>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {editing.doc.missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button
              type="submit"
              className={`w-full rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark ${FOCUS}`}
            >
              {editing ? "Salvar alterações" : "Salvar contrato"}
            </button>
            <p className={HINT}>
              Pode salvar com campos em branco: o contrato sai com “[a preencher]” e o aceite
              fica travado até você completar.
              {editing ? (
                <>
                  {" "}
                  <Link
                    href="/admin/contratos"
                    className="font-semibold text-navy underline underline-offset-2"
                  >
                    Descartar edição
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
