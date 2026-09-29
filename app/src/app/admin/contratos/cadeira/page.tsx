import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell, DbErrorState } from "@/components/vertice/AdminShell";
import { DocLink, ROI_APP } from "@/components/vertice/DocLink";
import { EMPTY_PARTY, FIELD, FOCUS, HINT, LABEL, PartyFields } from "@/components/vertice/PartyFields";
import { tituloPadrao, type ContratoCadeiraDoc, type ContratoCadeiraInput } from "@/lib/contrato-cadeira";
import { brl, type PropostaCadeiraDoc } from "@/lib/precos-cadeira";
import { prisma } from "@/lib/prisma";
import { salvarContratoCadeira } from "./actions";

export const metadata: Metadata = {
  title: "Contrato da cadeira · Admin ROI Labs",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";
const data = (iso: string | Date) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ });
const AVISO = "rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900";

type Props = { searchParams: Promise<{ proposta?: string; editar?: string }> };

type Carregado = {
  proposta: { id: string; slug: string; doc: PropostaCadeiraDoc } | null;
  editando: { id: string; input: ContratoCadeiraInput; doc: ContratoCadeiraDoc; aceitoEm: Date | null } | null;
  contratoExistente: string | null;
  ultimo: ContratoCadeiraInput | null;
};

async function carregar(params: { proposta?: string; editar?: string }): Promise<Carregado> {
  if (params.editar) {
    const c = await prisma.contratoCadeira.findUnique({ where: { id: params.editar }, include: { proposta: true } });
    return {
      proposta: c ? { id: c.proposta.id, slug: c.proposta.slug, doc: c.proposta.doc as PropostaCadeiraDoc } : null,
      editando: c
        ? { id: c.id, input: c.input as ContratoCadeiraInput, doc: c.doc as ContratoCadeiraDoc, aceitoEm: c.aceitoEm }
        : null,
      contratoExistente: null,
      ultimo: null,
    };
  }
  const [p, ultimo] = await Promise.all([
    params.proposta
      ? prisma.propostaCadeira.findUnique({ where: { id: params.proposta }, include: { contrato: { select: { id: true } } } })
      : null,
    // A ROI Labs, o foro e o pagamento do último contrato de cadeira viram o ponto de partida (research D7).
    prisma.contratoCadeira.findFirst({ orderBy: { criadoEm: "desc" }, select: { input: true } }),
  ]);
  return {
    proposta: p ? { id: p.id, slug: p.slug, doc: p.doc as PropostaCadeiraDoc } : null,
    editando: null,
    contratoExistente: p?.contrato?.id ?? null,
    ultimo: (ultimo?.input as ContratoCadeiraInput | undefined) ?? null,
  };
}

export default async function ContratoCadeiraPage({ searchParams }: Props) {
  const params = await searchParams;

  let dados: Carregado | null = null;
  let dbError: string | null = null;
  try {
    dados = await carregar(params);
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  // Uma proposta, um contrato: "Emitir" numa aba velha abre o contrato que já existe.
  if (dados?.contratoExistente) redirect(`/admin/contratos/cadeira?editar=${dados.contratoExistente}`);

  const proposta = dados?.proposta ?? null;
  const editando = dados?.editando ?? null;
  const doc = proposta?.doc ?? null;
  const initial: ContratoCadeiraInput = editando?.input ?? {
    titulo: "",
    contratante: EMPTY_PARTY,
    contratada: dados?.ultimo?.contratada ?? EMPTY_PARTY,
    inicio: "",
    foro: dados?.ultimo?.foro ?? "",
    pagamento: dados?.ultimo?.pagamento ?? "",
    extra: "",
    subdominios: "",
  };
  const vencida = doc ? Date.now() > new Date(doc.validaAte).getTime() : false;

  return (
    <AdminShell
      title={editando ? `Editando contrato · ${doc?.paraQuem ?? ""}` : "Contrato da cadeira"}
      lead={
        editando
          ? "Corrija e salve: o contrato é reescrito no mesmo link, então quem já recebeu passa a ver esta versão."
          : "Anuidade, comissão, condições e entregáveis saem da proposta. Aqui entram as partes, o início, o foro e o pagamento."
      }
    >
      {dbError ? (
        <DbErrorState message={dbError} />
      ) : editando?.aceitoEm ? (
        <p role="status" className={AVISO}>
          <span aria-hidden="true">⚠</span> Este contrato foi aceito em {data(editando.aceitoEm)} e não se edita mais.{" "}
          <Link href="/admin/contratos" className="font-semibold underline underline-offset-2">
            Voltar para Contratos
          </Link>
        </p>
      ) : !doc || !proposta ? (
        <p role="status" className={AVISO}>
          <span aria-hidden="true">⚠</span> O contrato nasce de uma proposta de cadeira, e esta não foi encontrada. Escolha
          a proposta em{" "}
          <Link href="/admin/propostas" className="font-semibold underline underline-offset-2">
            Propostas
          </Link>{" "}
          e use “Emitir contrato”.
        </p>
      ) : (
        // key: sem ela o React reaproveita os campos ao trocar de ?editar= ou ?proposta=.
        <form
          key={editando ? `c${editando.id}` : `p${proposta.id}`}
          action={salvarContratoCadeira}
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
        >
          {editando ? (
            <input type="hidden" name="contratoId" value={editando.id} />
          ) : (
            <input type="hidden" name="propostaId" value={proposta.id} />
          )}

          <div className="min-w-0 space-y-6">
            <PartyFields role="contratante" heading={`Contratante · ${doc.paraQuem}`} party={initial.contratante} />
            <PartyFields role="contratada" heading="Contratada · ROI Labs" party={initial.contratada} />

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 shadow-soft">
              <label htmlFor="contrato-pagamento" className="text-sm font-bold text-navy">
                Formas de pagamento da entrada
              </label>
              <p id="contrato-pagamento-hint" className={HINT}>
                Uma por linha. O que você ainda não sabe fica entre colchetes, como [parcelas]: o aceite fica travado
                até você trocar.
              </p>
              <textarea
                id="contrato-pagamento"
                name="pagamento"
                rows={3}
                defaultValue={initial.pagamento}
                placeholder="ex.: Pix à vista, ou cartão em até 12x com acréscimo"
                aria-describedby="contrato-pagamento-hint"
                className={`mt-1 font-mono ${FIELD}`}
              />
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 shadow-soft">
              <label htmlFor="contrato-subdominios" className="text-sm font-bold text-navy">
                Subdomínios do site
              </label>
              <p id="contrato-subdominios-hint" className={HINT}>
                Opcional. Um por linha: entram na cláusula Objeto, logo depois de “com site”. Em branco, o Objeto fala só
                do site.
              </p>
              <textarea
                id="contrato-subdominios"
                name="subdominios"
                rows={3}
                defaultValue={initial.subdominios ?? ""}
                placeholder="ex.: Subdomínio da Dra. Ana, com os procedimentos dela: botox e preenchimento"
                aria-describedby="contrato-subdominios-hint"
                className={`mt-1 font-mono ${FIELD}`}
              />
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 shadow-soft">
              <label htmlFor="contrato-extra" className="text-sm font-bold text-navy">
                Condições específicas
              </label>
              <p id="contrato-extra-hint" className={HINT}>
                Opcional. Uma por linha, só o que vale para este parceiro. Em branco, a cláusula não sai no contrato.
              </p>
              <textarea
                id="contrato-extra"
                name="extra"
                rows={4}
                defaultValue={initial.extra}
                aria-describedby="contrato-extra-hint"
                className={`mt-1 font-mono ${FIELD}`}
              />
            </div>

            <section
              aria-labelledby="da-proposta"
              className="space-y-3 rounded-xl border border-border bg-white p-4 text-sm text-navy shadow-soft"
            >
              <h2 id="da-proposta" className="font-bold">
                Da proposta · não se edita aqui
              </h2>
              <ul className="space-y-1">
                {doc.entrada.map((l) => (
                  <li key={l.item}>
                    <span className="font-semibold">{l.item}:</span> <span className="font-mono">{l.valor}</span>
                  </li>
                ))}
              </ul>
              <p>
                <span className="font-semibold">Comissão:</span> {doc.comissao.resumo}
              </p>
              {doc.comissao.regras.length > 0 ? (
                <ul className="list-inside list-disc text-xs">
                  {doc.comissao.regras.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : null}
              <p className="text-xs text-muted-foreground">{doc.comissao.quando}</p>
              {doc.entregaveis ? (
                <details className="rounded-md border border-border p-3">
                  <summary className={`cursor-pointer font-semibold ${FOCUS}`}>
                    Anexo I · {doc.entregaveis.cadeira}: {doc.entregaveis.fases.length}{" "}
                    {doc.entregaveis.fases.length === 1 ? "fase" : "fases"}
                    {doc.entregaveis.extras?.length ? ` + ${doc.entregaveis.extras.length} extras` : ""}
                  </summary>
                  <div className="mt-2 space-y-2 text-xs">
                    {doc.entregaveis.fases.map((f) => (
                      <div key={f.nome}>
                        <p className="font-semibold">
                          {f.prazo} · {f.nome}
                        </p>
                        <ul className="list-inside list-disc">
                          {f.itens.map((i) => (
                            <li key={i}>{i}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {doc.entregaveis.extras?.length ? (
                      <div>
                        <p className="font-semibold">Também incluído</p>
                        <ul className="list-inside list-disc">
                          {doc.entregaveis.extras.map((i) => (
                            <li key={i}>{i}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </details>
              ) : null}
            </section>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border border-l-4 border-l-gold bg-card p-4 text-sm text-navy">
              <p className="font-semibold">Proposta para {doc.paraQuem}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-navy/50">{doc.nicho.nome}</p>
              <p className="mt-1 font-mono">{brl(doc.entradaTotal)}/ano + comissão</p>
              <div className="mt-2">
                <DocLink prefix="/p/" slug={proposta.slug} site={ROI_APP} />
              </div>
            </div>

            {vencida ? (
              <p role="note" className={AVISO}>
                <span aria-hidden="true">⚠</span> A proposta venceu em {data(doc.validaAte)}. O contrato sai com os
                valores dela, não com os da tabela de hoje. Se o preço mudou, guarde uma proposta nova.
              </p>
            ) : null}

            {!doc.entregaveis ? (
              <p role="note" className={AVISO}>
                <span aria-hidden="true">⚠</span> Proposta guardada antes dos entregáveis: o contrato sai sem o Anexo I,
                e o aceite fica travado. Guarde uma proposta nova no simulador de Preços.
              </p>
            ) : null}

            <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-soft">
              <div className="flex flex-col gap-1">
                <label htmlFor="contrato-titulo" className={LABEL}>
                  Título
                </label>
                <input
                  id="contrato-titulo"
                  name="titulo"
                  maxLength={140}
                  defaultValue={initial.titulo}
                  placeholder={tituloPadrao(doc.nicho.nome)}
                  className={FIELD}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="contrato-inicio" className={LABEL}>
                  Início
                </label>
                <input
                  id="contrato-inicio"
                  name="inicio"
                  type="date"
                  defaultValue={initial.inicio}
                  aria-describedby="contrato-inicio-hint"
                  className={FIELD}
                />
                <p id="contrato-inicio-hint" className={HINT}>
                  Em branco, os 12 meses contam do dia do aceite.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="contrato-foro" className={LABEL}>
                  Foro
                </label>
                <input
                  id="contrato-foro"
                  name="foro"
                  maxLength={120}
                  defaultValue={initial.foro}
                  placeholder="ex.: Goiânia/GO"
                  aria-describedby="contrato-foro-hint"
                  className={FIELD}
                />
                <p id="contrato-foro-hint" className={HINT}>
                  A comarca de uma das partes. Parceiro pessoa física: vale o domicílio dele, e este campo é ignorado.
                </p>
              </div>
            </div>

            {editando && editando.doc.pendencias.length > 0 ? (
              <div role="note" className={AVISO}>
                <p className="font-semibold">
                  <span aria-hidden="true">⚠</span> Falta preencher para o parceiro poder aceitar:
                </p>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {editando.doc.pendencias.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button
              type="submit"
              className={`w-full rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark ${FOCUS}`}
            >
              {editando ? "Salvar alterações" : "Salvar contrato"}
            </button>
            <p className={HINT}>
              Pode salvar com campos em branco: o contrato sai com “[a preencher]” e o aceite fica travado até você
              completar.{" "}
              <Link href={editando ? "/admin/contratos" : "/admin/propostas"} className="font-semibold text-navy underline underline-offset-2">
                {editando ? "Descartar edição" : "Voltar para Propostas"}
              </Link>
            </p>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
