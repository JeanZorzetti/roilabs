import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell, DbErrorState } from "@/components/vertice/AdminShell";
import { ProposalCard } from "@/components/vertice/ProposalCard";
import { PropostaCadeiraCard } from "@/components/vertice/PropostaCadeiraCard";
import type { PropostaCadeiraDoc } from "@/lib/precos-cadeira";
import { prisma } from "@/lib/prisma";
import { listAllProposals, type ProposalRow } from "@/lib/vertice/data";

export const metadata: Metadata = {
  title: "Propostas · Admin ROI Labs",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Vertice = ProposalRow & { client_name: string };
type Cadeira = { id: string; slug: string; criadaEm: Date; doc: PropostaCadeiraDoc };
type Item = { tipo: "vertice"; quando: number; p: Vertice } | { tipo: "cadeira"; quando: number; p: Cadeira };

const mensagem = (error: unknown) => (error instanceof Error ? error.message : String(error));

export default async function PropostasPage() {
  // As duas fontes são independentes (spec 019): o banco da Vértice fora não esconde as de cadeira, e vice-versa.
  const [vertice, cadeira] = await Promise.allSettled([
    listAllProposals(),
    // ponytail: teto de 200, pagina por criada_em se um dia passar disso.
    prisma.propostaCadeira.findMany({ orderBy: { criadaEm: "desc" }, take: 200 }),
  ]);

  const erros = [
    vertice.status === "rejected" ? `Propostas da Vértice: ${mensagem(vertice.reason)}` : null,
    cadeira.status === "rejected" ? `Propostas de cadeira: ${mensagem(cadeira.reason)}` : null,
  ].filter((e): e is string => e !== null);

  const itens: Item[] = [
    ...(vertice.status === "fulfilled" ? vertice.value : []).map(
      (p): Item => ({ tipo: "vertice", quando: new Date(p.created_at).getTime(), p })
    ),
    ...(cadeira.status === "fulfilled" ? cadeira.value : []).map(
      (p): Item => ({
        tipo: "cadeira",
        quando: p.criadaEm.getTime(),
        p: { ...p, doc: p.doc as PropostaCadeiraDoc },
      })
    ),
  ].sort((a, b) => b.quando - a.quando);

  const nCadeira = itens.filter((i) => i.tipo === "cadeira").length;
  const nVertice = itens.length - nCadeira;
  const aceitas = itens.filter((i) => i.tipo === "vertice" && i.p.accepted_at).length;

  return (
    <AdminShell
      title="Propostas"
      lead="Toda proposta guardada, com o link que vai para o cliente. A de cadeira abre com a marca da ROI Labs; a da Vértice abre no site da Vértice, com o registro de aceite. Número e margem aqui são internos: o cliente só vê o documento do link."
      action={
        <Link
          href="/admin/precos#simulador"
          className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Montar proposta
        </Link>
      }
    >
      {erros.map((erro) => (
        <div key={erro} className="mb-4">
          <DbErrorState message={erro} />
        </div>
      ))}

      {itens.length === 0 ? (
        erros.length === 0 ? (
          <p className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
            Nenhuma proposta guardada ainda. Monte no{" "}
            <Link href="/admin/precos#simulador" className="text-navy underline underline-offset-2">
              simulador de Preços
            </Link>{" "}
            e guarde: ela aparece aqui com um link próprio para mandar ao cliente.
          </p>
        ) : null
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {nCadeira} de cadeira · {nVertice} da Vértice ({aceitas} aceita{aceitas === 1 ? "" : "s"})
          </p>
          <ul className="space-y-3">
            {itens.map((item) =>
              item.tipo === "cadeira" ? (
                <PropostaCadeiraCard key={`c-${item.p.id}`} id={item.p.id} slug={item.p.slug} doc={item.p.doc} />
              ) : (
                <ProposalCard key={`v-${item.p.id}`} proposal={item.p} clientName={item.p.client_name} />
              )
            )}
          </ul>
        </>
      )}
    </AdminShell>
  );
}
