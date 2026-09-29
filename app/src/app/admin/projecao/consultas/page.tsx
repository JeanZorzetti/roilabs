/* information-design · tabela · responde: qual consulta eu abro, e o que cada uma projetou? · fonte: projecao_consultas · 2026-09-28 */
import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell } from "@/components/vertice/AdminShell";
import { requireAuth } from "@/lib/auth";
import { log } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { NICHOS } from "@/lib/precificacao";
import { formatarVendas, resumirConsulta, type TermoConsultado } from "@/lib/projecao";

// Lê o banco a cada abertura: sem isto o Next tentaria pré-renderizar no build, onde não há banco.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Consultas guardadas · Admin ROI Labs",
  robots: { index: false, follow: false },
};

const LIMITE = 200; // ponytail: sem paginação; com mais de 200 consultas, paginar por criada_em
const FOCO = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const inteiro = new Intl.NumberFormat("pt-BR");
const usd = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
// O servidor roda em UTC: sem o fuso, 21:54 de Brasília vira 00:54 do dia seguinte.
const quando = (d: Date) =>
  d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const dia = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

async function ler() {
  try {
    const [linhas, total] = await Promise.all([
      prisma.consultaProjecao.findMany({ orderBy: { criadaEm: "desc" }, take: LIMITE }),
      prisma.consultaProjecao.aggregate({ _count: true, _sum: { custoUsd: true }, _min: { criadaEm: true } }),
    ]);
    return { linhas, total, fora: false as const };
  } catch (err) {
    log.error({ err: err instanceof Error ? err.message : String(err) }, "projecao/consultas: não leu o histórico");
    return { fora: true as const };
  }
}

export default async function ConsultasPage() {
  await requireAuth(); // o layout também checa, mas roda em paralelo com esta leitura
  const dados = await ler();

  return (
    <AdminShell
      title="Consultas guardadas"
      lead="Toda consulta da Projeção que dá certo fica aqui. Abra uma para ver a projeção completa, sem pagar de novo."
      action={
        <Link
          href="/admin/projecao"
          className={`inline-flex min-h-11 items-center rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark ${FOCO}`}
        >
          Nova consulta
        </Link>
      }
    >
      {dados.fora ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span aria-hidden="true">⚠</span> Não deu para ler as consultas guardadas
          </h2>
          <p className="mt-2 text-sm">
            O banco não respondeu agora. Tente de novo em 1 minuto. A Projeção continua consultando, mas uma consulta
            feita agora pode não entrar aqui.
          </p>
        </div>
      ) : dados.linhas.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-lg font-semibold text-navy">Nenhuma consulta guardada ainda</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A Projeção guarda cada consulta que dá certo. A primeira aparece aqui assim que você consultar termos.
          </p>
          <Link
            href="/admin/projecao"
            className={`mt-4 inline-flex min-h-11 items-center font-semibold text-navy underline underline-offset-2 ${FOCO}`}
          >
            Ir para a Projeção
          </Link>
        </div>
      ) : (
        <Lista linhas={dados.linhas} total={dados.total} />
      )}
    </AdminShell>
  );
}

type Linha = Awaited<ReturnType<typeof prisma.consultaProjecao.findMany>>[number];
type Total = { _count: number; _sum: { custoUsd: number | null }; _min: { criadaEm: Date | null } };

function Lista({ linhas, total }: { linhas: Linha[]; total: Total }) {
  const itens = linhas.map((c) => {
    const termos = c.termos as unknown as TermoConsultado[];
    return { c, termos, resumo: resumirConsulta(termos, c.nichoId) };
  });
  // A barra compara buscas entre linhas; a escala é a maior demanda da lista.
  const maxDemanda = Math.max(0, ...itens.map((i) => i.resumo?.demanda ?? 0));

  return (
    <section aria-labelledby="consultas-titulo">
      <h2 id="consultas-titulo" className="sr-only">
        Lista de consultas guardadas
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        <strong className="font-semibold text-navy">
          {total._count} {total._count === 1 ? "consulta" : "consultas"}
        </strong>{" "}
        desde {total._min.criadaEm ? dia(total._min.criadaEm) : "—"} · US$ {usd(total._sum.custoUsd ?? 0)} pagos à
        DataForSEO · vendas recalculadas com as premissas de hoje, do cenário conservador ao otimista
        {total._count > linhas.length ? ` · mostrando as ${linhas.length} mais recentes` : ""}
      </p>

      <table className="pr-table pr-table--cards">
        <caption className="sr-only">
          Consultas guardadas, da mais recente para a mais antiga, com local, nicho, termos, buscas, vendas projetadas e
          custo
        </caption>
        <thead>
          <tr>
            <th scope="col">Consulta</th>
            <th scope="col">Consultada em</th>
            <th scope="col">Onde</th>
            <th scope="col">Nicho</th>
            <th scope="col" className="md:text-right">
              Buscas/mês
            </th>
            <th scope="col" className="md:text-right">
              Vendas/mês no ano 1
            </th>
            <th scope="col" className="md:text-right">
              Custo
            </th>
          </tr>
        </thead>
        <tbody>
          {itens.map(({ c, termos, resumo }) => {
            const nicho = NICHOS.find((n) => n.id === c.nichoId);
            const primeiros = termos.slice(0, 3).map((t) => t.termo);
            const resto = termos.length - primeiros.length;
            const onde = c.localCodigo === 2076 ? "Brasil" : c.localNome.split(",")[0];
            return (
              <tr key={c.id}>
                <td className="pr-table__nicho min-w-[240px]">
                  <Link
                    href={`/admin/projecao?consulta=${c.id}`}
                    className={`text-navy underline decoration-border underline-offset-4 hover:decoration-navy ${FOCO}`}
                  >
                    {c.paraQuem ?? <span className="italic">Sem nome</span>}
                    <span className="sr-only">, consultada em {quando(c.criadaEm)}</span>
                  </Link>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {termos.length} {termos.length === 1 ? "termo" : "termos"}: {primeiros.join(" · ")}
                    {resto > 0 ? ` e mais ${resto}` : ""}
                  </span>
                </td>
                <td data-label="Consultada em" className="whitespace-nowrap tabular-nums">
                  {quando(c.criadaEm)}
                </td>
                <td data-label="Onde">{onde}</td>
                <td data-label="Nicho" className="min-w-[160px]">
                  {nicho ? nicho.nicho : <span className="text-muted-foreground">«{c.nichoId}» saiu da tabela</span>}
                </td>
                <td data-label="Buscas/mês" className="md:text-right">
                  {resumo ? (
                    <span className="inline-block min-w-[5rem]">
                      <span className="font-mono tabular-nums">{inteiro.format(resumo.demanda)}</span>
                      <span aria-hidden="true" className="mt-1 block h-1 overflow-hidden rounded-full bg-border/60">
                        <span
                          className="ml-auto block h-full rounded-full bg-navy"
                          style={{ width: `${maxDemanda > 0 ? (resumo.demanda / maxDemanda) * 100 : 0}%` }}
                        />
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td data-label="Vendas/mês no ano 1" className="md:text-right">
                  {resumo ? (
                    <>
                      <span className="whitespace-nowrap font-mono font-semibold tabular-nums text-navy">
                        {formatarVendas(resumo.conservador) === formatarVendas(resumo.otimista)
                          ? formatarVendas(resumo.conservador)
                          : `${formatarVendas(resumo.conservador)} a ${formatarVendas(resumo.otimista)}`}
                      </span>
                      <span className="block text-xs text-muted-foreground">{resumo.unidade.plural}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">sem funil para o nicho guardado</span>
                  )}
                </td>
                <td data-label="Custo" className="whitespace-nowrap font-mono tabular-nums md:text-right">
                  US$ {usd(c.custoUsd)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
