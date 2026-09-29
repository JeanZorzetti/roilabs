import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell, DbErrorState } from "@/components/vertice/AdminShell";
import { ContractCard } from "@/components/vertice/ContractCard";
import { ContratoCadeiraCard, type ContratoCadeiraResumo } from "@/components/vertice/ContratoCadeiraCard";
import type { ContratoCadeiraDoc } from "@/lib/contrato-cadeira";
import { prisma } from "@/lib/prisma";
import { listAllContracts, type ContractRow } from "@/lib/vertice/data";

export const metadata: Metadata = {
  title: "Contratos · Admin ROI Labs",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Vertice = ContractRow & { client_name: string };
type Item = { tipo: "vertice"; quando: number; c: Vertice } | { tipo: "cadeira"; quando: number; c: ContratoCadeiraResumo };

const mensagem = (error: unknown) => (error instanceof Error ? error.message : String(error));

export default async function ContratosPage() {
  // As duas fontes são independentes, como em Propostas: o banco da Vértice fora não esconde os de cadeira.
  const [vertice, cadeira] = await Promise.allSettled([
    listAllContracts(),
    // ponytail: teto de 200, como a lista de propostas.
    prisma.contratoCadeira.findMany({
      orderBy: { criadoEm: "desc" },
      take: 200,
      select: { id: true, slug: true, criadoEm: true, aceitoEm: true, aceitoPor: true, doc: true },
    }),
  ]);

  const erros = [
    vertice.status === "rejected" ? `Contratos da Vértice: ${mensagem(vertice.reason)}` : null,
    cadeira.status === "rejected" ? `Contratos de cadeira: ${mensagem(cadeira.reason)}` : null,
  ].filter((e): e is string => e !== null);

  const itens: Item[] = [
    ...(vertice.status === "fulfilled" ? vertice.value : []).map(
      (c): Item => ({ tipo: "vertice", quando: new Date(c.created_at).getTime(), c })
    ),
    ...(cadeira.status === "fulfilled" ? cadeira.value : []).map(
      (c): Item => ({ tipo: "cadeira", quando: c.criadoEm.getTime(), c: { ...c, doc: c.doc as ContratoCadeiraDoc } })
    ),
  ].sort((a, b) => b.quando - a.quando);

  const aceitos = itens.filter((i) => (i.tipo === "cadeira" ? i.c.aceitoEm : i.c.accepted_at)).length;

  return (
    <AdminShell
      title="Contratos"
      lead="O contrato de cada proposta, com o link que vai para o cliente e o registro do aceite. O de cadeira abre com a marca da ROI Labs; o da Vértice abre no site da Vértice e aceita a proposta junto."
    >
      {erros.map((erro) => (
        <div key={erro} className="mb-4">
          <DbErrorState message={erro} />
        </div>
      ))}

      {itens.length === 0 ? (
        erros.length === 0 ? (
          <p className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
            Nenhum contrato emitido ainda. O contrato nasce de uma proposta: abra{" "}
            <Link href="/admin/propostas" className="text-navy underline underline-offset-2">
              Propostas
            </Link>{" "}
            e use “Emitir contrato” no cartão dela.
          </p>
        ) : null
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {itens.length} contrato{itens.length > 1 ? "s" : ""} · {aceitos} aceito
            {aceitos === 1 ? "" : "s"} · {itens.length - aceitos} aguardando
          </p>
          <ul className="space-y-3">
            {itens.map((item) =>
              item.tipo === "cadeira" ? (
                <ContratoCadeiraCard key={`c-${item.c.id}`} contrato={item.c} />
              ) : (
                <ContractCard key={`v-${item.c.id}`} contract={item.c} clientName={item.c.client_name} />
              )
            )}
          </ul>
        </>
      )}
    </AdminShell>
  );
}
