import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell, DbErrorState } from "@/components/vertice/AdminShell";
import { ClientPicker, DeleteClientButton } from "@/components/vertice/ClientPicker";
import { OnboardingItem } from "@/components/vertice/OnboardingItem";
import { createClient } from "@/lib/vertice/actions";
import { listClients, getProgress, type ClientSummary, type ProgressRow } from "@/lib/vertice/data";
import { SERVICES } from "@/lib/vertice/catalog";
import { countItems, phasesFor } from "@/lib/vertice/onboarding";

export const metadata: Metadata = {
  title: "Onboarding · Admin Vértice",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Sem nenhum cliente, o formulário nasce aberto: não há mais nada a fazer
 *  nesta tela, e estado vazio que manda cadastrar precisa dar onde cadastrar. */
function NewClientForm({ open }: { open: boolean }) {
  return (
    <details open={open} className="rounded-xl border border-border bg-white shadow-soft">
      <summary className="cursor-pointer px-4 py-3 font-semibold text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
        Cadastrar cliente
      </summary>
      <form action={createClient} className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="client-name" className="text-sm font-semibold text-navy">
            Nome
          </label>
          <input
            id="client-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={120}
            autoComplete="organization"
            placeholder="ex.: Padaria Aurora"
            className="rounded-md border border-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="client-segment" className="text-sm font-semibold text-navy">
            Segmento <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="client-segment"
            name="segment"
            type="text"
            maxLength={80}
            placeholder="ex.: alimentação, varejo, saúde"
            className="rounded-md border border-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="client-notes" className="text-sm font-semibold text-navy">
            Observações <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="client-notes"
            name="notes"
            rows={2}
            maxLength={2000}
            placeholder="Contexto que não cabe em nenhum item do checklist"
            className="rounded-md border border-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Cadastrar cliente
          </button>
        </div>
      </form>
    </details>
  );
}

function EmptyClients() {
  return (
    <div className="rounded-xl border border-border bg-white p-8 text-center shadow-soft">
      <h2 className="text-lg font-bold text-navy">Nenhum cliente cadastrado</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        O checklist grava o progresso por cliente e por serviço — quem entregou o quê e quando. Cadastre o
        primeiro cliente para começar a marcar.
      </p>
    </div>
  );
}

function NoClientSelected({ clients }: { clients: ClientSummary[] }) {
  return (
    <div className="rounded-xl border border-border bg-white p-8 shadow-soft">
      <h2 className="text-lg font-bold text-navy">Escolha um cliente</h2>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        O progresso é gravado por cliente. Selecione acima ou vá direto por um dos{" "}
        {clients.length === 1 ? "cadastrado" : `${clients.length} cadastrados`}:
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {clients.map((client) => (
          <li key={client.id}>
            <Link
              href={`/admin/onboarding?cliente=${client.id}`}
              className="inline-block rounded-full border border-border px-3 py-1.5 text-sm text-navy transition-colors hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {client.name}
              {client.doneCount > 0 ? (
                <span className="ml-2 text-xs text-muted-foreground">{client.doneCount} feitos</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Props = { searchParams: Promise<{ cliente?: string; servico?: string }> };

export default async function OnboardingPage({ searchParams }: Props) {
  const params = await searchParams;

  let clients: ClientSummary[];
  try {
    clients = await listClients();
  } catch (error) {
    return (
      <AdminShell title="Onboarding por serviço">
        <DbErrorState message={error instanceof Error ? error.message : String(error)} />
      </AdminShell>
    );
  }

  const clientId = Number(params.cliente);
  const client = clients.find((c) => c.id === clientId) ?? null;
  const serviceId = SERVICES.some((s) => s.id === params.servico) ? params.servico! : SERVICES[0].id;
  const service = SERVICES.find((s) => s.id === serviceId)!;
  const phases = phasesFor(serviceId);

  let progress = new Map<string, ProgressRow>();
  if (client) progress = await getProgress(client.id);

  const total = countItems(phases);
  const done = phases.reduce(
    (count, phase) =>
      count + phase.items.filter((item) => progress.get(`${serviceId}:${item.id}`)?.done).length,
    0
  );
  const blockingOpen = phases.reduce(
    (count, phase) =>
      count +
      phase.items.filter((item) => item.blocking && !progress.get(`${serviceId}:${item.id}`)?.done).length,
    0
  );

  return (
    <AdminShell
      title="Onboarding por serviço"
      lead="Um checklist por serviço, marcado por cliente. Enquanto houver item que trava o prazo em aberto, o relógio da entrega não começou a contar."
      action={client ? <DeleteClientButton id={client.id} name={client.name} /> : null}
    >
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <ClientPicker
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          selectedId={client?.id ?? null}
        />
        <div className="min-w-[260px] flex-1">
          <NewClientForm open={clients.length === 0} />
        </div>
      </div>

      {clients.length === 0 ? (
        <EmptyClients />
      ) : !client ? (
        <NoClientSelected clients={clients} />
      ) : (
        <>
          <nav aria-label="Checklist por serviço" className="mb-6 flex flex-wrap gap-2">
            {SERVICES.map((option) => {
              const current = option.id === serviceId;
              return (
                <Link
                  key={option.id}
                  href={`/admin/onboarding?cliente=${client.id}&servico=${option.id}`}
                  aria-current={current ? "true" : undefined}
                  className={
                    current
                      ? "rounded-full border border-navy bg-navy px-3 py-1.5 text-sm font-semibold text-white"
                      : "rounded-full border border-border px-3 py-1.5 text-sm text-navy/70 transition-colors hover:border-navy/40"
                  }
                >
                  {option.name}
                </Link>
              );
            })}
          </nav>

          <div className="mb-8 rounded-xl border border-border bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold text-navy">
                {service.name} · {client.name}
              </h2>
              <p className="font-mono text-sm text-navy">
                {done} de {total} {total === 1 ? "item" : "itens"}
              </p>
            </div>

            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-card"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`Progresso do onboarding de ${service.name}`}
            >
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-300"
                style={{ width: `${total === 0 ? 0 : Math.round((done / total) * 100)}%` }}
              />
            </div>

            <p className="mt-3 text-sm">
              {blockingOpen > 0 ? (
                <span className="font-semibold text-red-700">
                  ⏱ {blockingOpen} {blockingOpen === 1 ? "item trava" : "itens travam"} o prazo e ainda{" "}
                  {blockingOpen === 1 ? "está" : "estão"} em aberto. O relógio da entrega não começou.
                </span>
              ) : (
                <span className="font-semibold text-navy">
                  ✓ Nenhum item travando o prazo. O relógio da entrega está correndo.
                </span>
              )}
            </p>
          </div>

          <div className="space-y-8">
            {phases.map((phase) => {
              const phaseDone = phase.items.filter(
                (item) => progress.get(`${serviceId}:${item.id}`)?.done
              ).length;

              return (
                <section key={phase.id} aria-labelledby={`fase-${phase.id}`}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                    <div>
                      <h3 id={`fase-${phase.id}`} className="text-base font-bold text-navy">
                        {phase.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{phase.when}</p>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {phaseDone}/{phase.items.length}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {phase.items.map((item) => {
                      const row = progress.get(`${serviceId}:${item.id}`);
                      return (
                        <OnboardingItem
                          key={item.id}
                          clientId={client.id}
                          serviceId={serviceId}
                          item={item}
                          done={Boolean(row?.done)}
                          doneAt={row?.done_at ?? null}
                          note={row?.note ?? null}
                        />
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}
    </AdminShell>
  );
}
