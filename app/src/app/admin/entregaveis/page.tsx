import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell } from "@/components/vertice/AdminShell";
import {
  FORA_DA_CADEIRA,
  REGRAS_GERAIS,
  TIPOS_CADEIRA,
  type Fase,
  type FaseCadeira,
  type TipoCadeira,
} from "@/lib/entregaveis";

export const metadata: Metadata = {
  title: "Entregáveis · Admin ROI Labs",
  robots: { index: false, follow: false },
};

/**
 * Consulta de escopo da cadeira no meio de uma reunião de venda.
 *
 * Filtro de tipo de cadeira e "abrir tudo" vivem na URL: dá para deixar a aba
 * aberta no tipo certo e recarregar sem perder o contexto (?cadeira=loja&abrir=1).
 * O acordeão é <details> nativo — teclado, estado e o Ctrl+F do navegador
 * funcionam de graça, sem uma linha de JS.
 */

const FASE_LABEL: Record<Fase, string> = {
  implantacao: "Implantação",
  operacao: "Operação",
};

function FaseCard({ fase, open }: { fase: FaseCadeira; open: boolean }) {
  return (
    <details
      open={open}
      className="group rounded-lg border border-border bg-white shadow-soft [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
        <span className="text-gold transition-transform group-open:rotate-90" aria-hidden="true">
          ▶
        </span>
        {/* Heading dentro do <summary> é permitido pelo HTML e fecha o salto
            H2 → H4 que o nome da fase deixava aberto. */}
        <h3 className="flex-1 font-semibold text-navy">{fase.name}</h3>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-navy/70">
          {FASE_LABEL[fase.fase]}
        </span>
        <span className="font-mono text-sm font-bold text-navy">{fase.prazo}</span>
      </summary>

      <div className="space-y-5 border-t border-border px-4 py-5">
        {fase.deliverables.map((group) => (
          <div key={group.title}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60">{group.title}</h4>
            <ul className="mt-2 space-y-1.5">
              {group.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-foreground">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {fase.prereq?.length ? (
          <div className="rounded-md border-l-4 border-navy bg-navy/5 px-3 py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">O parceiro entrega antes</h4>
            <ul className="mt-1 space-y-1">
              {fase.prereq.map((item) => (
                <li key={item} className="text-sm text-navy">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {fase.excludes?.length ? (
          <div className="rounded-md border-l-4 border-red-300 bg-red-50 px-3 py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-800">
              Não entregue aqui
            </h4>
            <ul className="mt-1 space-y-1">
              {fase.excludes.map((item) => (
                <li key={item} className="text-sm text-red-900">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {fase.rules?.length ? (
          <div className="rounded-md bg-card px-3 py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60">Regras</h4>
            <ul className="mt-1 space-y-1">
              {fase.rules.map((item) => (
                <li key={item} className="text-sm text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function TipoBlock({ tipo, open }: { tipo: TipoCadeira; open: boolean }) {
  return (
    <section id={tipo.id} className="scroll-mt-24">
      <div className="mb-3 space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-bold text-navy">{tipo.name}</h2>
          <p className="text-sm text-muted-foreground">{tipo.tagline}</p>
        </div>
        <p className="text-sm text-navy">
          <strong className="font-semibold">Como a ROI Labs ganha:</strong> {tipo.cobranca}
        </p>
        <p className="text-xs text-muted-foreground">No ar neste formato: {tipo.exemplos.join(", ")}</p>
      </div>
      <div className="space-y-2">
        {tipo.fases.map((fase) => (
          <FaseCard key={fase.id} fase={fase} open={open} />
        ))}
      </div>
    </section>
  );
}

type Props = { searchParams: Promise<{ cadeira?: string; abrir?: string }> };

export default async function EntregaveisPage({ searchParams }: Props) {
  const params = await searchParams;
  const selected = TIPOS_CADEIRA.some((t) => t.id === params.cadeira) ? params.cadeira : undefined;
  const openAll = params.abrir === "1";
  const shown = selected ? TIPOS_CADEIRA.filter((t) => t.id === selected) : TIPOS_CADEIRA;

  const filterHref = (cadeira?: string) => {
    const query = new URLSearchParams();
    if (cadeira) query.set("cadeira", cadeira);
    if (openAll) query.set("abrir", "1");
    const suffix = query.toString();
    return suffix ? `/admin/entregaveis?${suffix}` : "/admin/entregaveis";
  };

  const toggleHref = () => {
    const query = new URLSearchParams();
    if (selected) query.set("cadeira", selected);
    if (!openAll) query.set("abrir", "1");
    const suffix = query.toString();
    return suffix ? `/admin/entregaveis?${suffix}` : "/admin/entregaveis";
  };

  return (
    <AdminShell
      title="Entregáveis por cadeira"
      lead="O que não está aqui não está na cadeira. A ROI Labs banca tecnologia e tráfego e só ganha quando o parceiro vende — por isso o escopo é fechado: pedido fora desta lista vai para outro produto da casa ou vira orçamento à parte, aprovado por escrito antes."
      action={
        <Link
          href={toggleHref()}
          className="inline-block rounded-md border border-navy px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {openAll ? "Recolher tudo" : "Abrir tudo"}
        </Link>
      }
    >
      <nav aria-label="Filtrar por tipo de cadeira" className="mb-8 flex flex-wrap gap-2">
        <Link
          href={filterHref()}
          aria-current={selected ? undefined : "true"}
          className={
            selected
              ? "rounded-full border border-border px-3 py-1.5 text-sm text-navy/70 transition-colors hover:border-navy/40"
              : "rounded-full border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-white"
          }
        >
          Todas
        </Link>
        {TIPOS_CADEIRA.map((tipo) => {
          const current = selected === tipo.id;
          return (
            <Link
              key={tipo.id}
              href={filterHref(tipo.id)}
              aria-current={current ? "true" : undefined}
              className={
                current
                  ? "rounded-full border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-full border border-border px-3 py-1.5 text-sm text-navy/70 transition-colors hover:border-navy/40"
              }
            >
              {tipo.name}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-10">
        {shown.map((tipo) => (
          <TipoBlock key={tipo.id} tipo={tipo} open={openAll} />
        ))}
      </div>

      <hr className="my-12 border-border" />

      <section aria-labelledby="transversais" className="space-y-8">
        <h2 id="transversais" className="text-xl font-bold text-navy">
          Regras gerais — valem para toda cadeira
        </h2>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <h3 className="border-b border-border px-4 py-3 font-semibold text-navy">
              O que a ROI Labs garante em qualquer cadeira
            </h3>
            <table className="w-full min-w-[420px] text-sm">
              <caption className="sr-only">Termos válidos para todos os tipos de cadeira</caption>
              <tbody className="divide-y divide-border">
                {REGRAS_GERAIS.roilabs.map(([item, standard]) => (
                  <tr key={item}>
                    <th scope="row" className="w-40 px-4 py-2.5 text-left align-top font-semibold text-navy">
                      {item}
                    </th>
                    <td className="px-4 py-2.5 align-top text-foreground">{standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-white p-4">
              <h3 className="font-semibold text-navy">O que o parceiro sustenta</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                O relógio dos seis meses só começa com o site no ar. Se o material do parceiro atrasar um mês,
                o plano inteiro anda um mês.
              </p>
              <ul className="mt-3 space-y-1.5">
                {REGRAS_GERAIS.parceiro.map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h3 className="font-semibold text-red-900">Nunca incluso em nenhuma cadeira</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {REGRAS_GERAIS.neverIncluded.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-xs text-red-900"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold text-navy">Metas e promessas</h3>
              <p className="mt-1 text-sm text-foreground">{REGRAS_GERAIS.metas}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <h3 className="border-b border-border px-4 py-3 font-semibold text-navy">
            Pedido fora da cadeira — para onde vai
          </h3>
          <p className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
            Todo item abaixo é combinado por escrito antes de executar. Fazer primeiro e acertar depois é
            como a cadeira vira trabalho de graça.
          </p>
          <table className="w-full min-w-[520px] text-sm">
            <caption className="sr-only">Pedidos que ficam fora do escopo da cadeira</caption>
            <thead className="bg-card text-left text-xs uppercase tracking-wider text-navy/60">
              <tr>
                <th scope="col" className="px-4 py-2 font-bold">
                  Pedido
                </th>
                <th scope="col" className="px-4 py-2 font-bold">
                  Vira
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FORA_DA_CADEIRA.map(([pedido, vira]) => (
                <tr key={pedido}>
                  <td className="px-4 py-2.5 align-top">{pedido}</td>
                  <td className="px-4 py-2.5 align-top font-semibold text-navy">{vira}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
