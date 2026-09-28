import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell } from "@/components/vertice/AdminShell";
import {
  CROSS_RULES,
  SCOPE_TRIGGERS,
  SERVICES,
  type Offer,
  type Service,
} from "@/lib/vertice/catalog";

export const metadata: Metadata = {
  title: "Entregáveis · Admin Vértice",
  robots: { index: false, follow: false },
};

/**
 * Consulta de escopo no meio de uma reunião de venda.
 *
 * Filtro de serviço e "abrir tudo" vivem na URL: dá para deixar a aba aberta
 * no serviço certo e recarregar sem perder o contexto (?servico=crm&abrir=1).
 * O acordeão é <details> nativo — teclado, estado e o Ctrl+F do navegador
 * funcionam de graça, sem uma linha de JS.
 */

const KIND_LABEL: Record<Offer["kind"], string> = {
  setup: "Projeto",
  recorrente: "Mensalidade",
  avulso: "Avulso",
};

function OfferCard({ offer, open }: { offer: Offer; open: boolean }) {
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
            H2 → H4 que o nome da oferta deixava aberto. */}
        <h3 className="flex-1 font-semibold text-navy">{offer.name}</h3>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-navy/70">
          {KIND_LABEL[offer.kind]}
        </span>
        <span className="font-mono text-sm font-bold text-navy">{offer.priceLabel}</span>
        <span className="font-mono text-xs text-muted-foreground">{offer.hoursLabel}</span>
        {offer.sla ? (
          <span className="font-mono text-xs text-muted-foreground">· {offer.sla}</span>
        ) : null}
      </summary>

      <div className="space-y-5 border-t border-border px-4 py-5">
        {offer.deliverables.map((group) => (
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

        {offer.hourBudget ? (
          <p className="rounded-md bg-card px-3 py-2 text-sm text-navy">
            <strong className="font-semibold">Orçamento de horas:</strong> {offer.hourBudget}
          </p>
        ) : null}

        {offer.prereq?.length ? (
          <div className="rounded-md border-l-4 border-navy bg-navy/5 px-3 py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Pré-requisito</h4>
            <ul className="mt-1 space-y-1">
              {offer.prereq.map((item) => (
                <li key={item} className="text-sm text-navy">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {offer.excludes?.length ? (
          <div className="rounded-md border-l-4 border-red-300 bg-red-50 px-3 py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-800">
              Não entregue aqui
            </h4>
            <ul className="mt-1 space-y-1">
              {offer.excludes.map((item) => (
                <li key={item} className="text-sm text-red-900">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {offer.rules?.length ? (
          <div className="rounded-md bg-card px-3 py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60">Regras</h4>
            <ul className="mt-1 space-y-1">
              {offer.rules.map((item) => (
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

function ServiceBlock({ service, open }: { service: Service; open: boolean }) {
  return (
    <section id={service.id} className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-xl font-bold text-navy">{service.name}</h2>
        <p className="text-sm text-muted-foreground">{service.tagline}</p>
      </div>
      <div className="space-y-2">
        {service.offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} open={open} />
        ))}
      </div>
    </section>
  );
}

type Props = { searchParams: Promise<{ servico?: string; abrir?: string }> };

export default async function EntregaveisPage({ searchParams }: Props) {
  const params = await searchParams;
  const selected = SERVICES.some((s) => s.id === params.servico) ? params.servico : undefined;
  const openAll = params.abrir === "1";
  const shown = selected ? SERVICES.filter((s) => s.id === selected) : SERVICES;

  const filterHref = (servico?: string) => {
    const query = new URLSearchParams();
    if (servico) query.set("servico", servico);
    if (openAll) query.set("abrir", "1");
    const suffix = query.toString();
    return suffix ? `/admin/entregaveis?${suffix}` : "/admin/entregaveis";
  };

  const toggleHref = () => {
    const query = new URLSearchParams();
    if (selected) query.set("servico", selected);
    if (!openAll) query.set("abrir", "1");
    const suffix = query.toString();
    return suffix ? `/admin/entregaveis?${suffix}` : "/admin/entregaveis";
  };

  return (
    <AdminShell
      title="Entregáveis por serviço"
      lead="O que não está aqui não está contratado. É o que permite manter o preço da tabela — serviço fora desta lista custa R$ 350/h (execução) ou R$ 450/h (consultoria), aprovado por escrito antes."
      action={
        <Link
          href={toggleHref()}
          className="inline-block rounded-md border border-navy px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {openAll ? "Recolher tudo" : "Abrir tudo"}
        </Link>
      }
    >
      <nav aria-label="Filtrar por serviço" className="mb-8 flex flex-wrap gap-2">
        <Link
          href={filterHref()}
          aria-current={selected ? undefined : "true"}
          className={
            selected
              ? "rounded-full border border-border px-3 py-1.5 text-sm text-navy/70 transition-colors hover:border-navy/40"
              : "rounded-full border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-white"
          }
        >
          Todos
        </Link>
        {SERVICES.map((service) => {
          const current = selected === service.id;
          return (
            <Link
              key={service.id}
              href={filterHref(service.id)}
              aria-current={current ? "true" : undefined}
              className={
                current
                  ? "rounded-full border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-full border border-border px-3 py-1.5 text-sm text-navy/70 transition-colors hover:border-navy/40"
              }
            >
              {service.name}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-10">
        {shown.map((service) => (
          <ServiceBlock key={service.id} service={service} open={openAll} />
        ))}
      </div>

      <hr className="my-12 border-border" />

      <section aria-labelledby="transversais" className="space-y-8">
        <h2 id="transversais" className="text-xl font-bold text-navy">
          Regras transversais — valem para todo contrato
        </h2>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <h3 className="border-b border-border px-4 py-3 font-semibold text-navy">
              O que a Vértice entrega em qualquer contrato
            </h3>
            <table className="w-full min-w-[420px] text-sm">
              <caption className="sr-only">Padrões de atendimento válidos para todos os serviços</caption>
              <tbody className="divide-y divide-border">
                {CROSS_RULES.vertice.map(([item, standard]) => (
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
              <h3 className="font-semibold text-navy">O que o cliente precisa entregar</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                O relógio de prazo só começa quando o último item de entrada chega. Atraso de aprovação
                empurra a entrega dia a dia e é comunicado por escrito no dia em que acontece.
              </p>
              <ul className="mt-3 space-y-1.5">
                {CROSS_RULES.cliente.map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h3 className="font-semibold text-red-900">Nunca incluso em nenhum serviço</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {CROSS_RULES.neverIncluded.map((item) => (
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
              <h3 className="font-semibold text-navy">Rodadas de revisão</h3>
              <p className="mt-1 text-sm text-foreground">{CROSS_RULES.revisions}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <h3 className="border-b border-border px-4 py-3 font-semibold text-navy">
            Gatilhos de escopo extra — a cobrar por hora
          </h3>
          <p className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
            Todo item abaixo é aprovado por escrito antes de executar. Executar primeiro e cobrar depois é
            como se trabalha de graça.
          </p>
          <table className="w-full min-w-[520px] text-sm">
            <caption className="sr-only">Situações que geram cobrança fora do escopo contratado</caption>
            <thead className="bg-card text-left text-xs uppercase tracking-wider text-navy/60">
              <tr>
                <th scope="col" className="px-4 py-2 font-bold">
                  Situação
                </th>
                <th scope="col" className="px-4 py-2 font-bold">
                  Vira
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SCOPE_TRIGGERS.map(([situation, becomes]) => (
                <tr key={situation}>
                  <td className="px-4 py-2.5 align-top">{situation}</td>
                  <td className="px-4 py-2.5 align-top font-mono font-semibold text-navy">{becomes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
