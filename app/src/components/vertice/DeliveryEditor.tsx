"use client";

import Link from "next/link";
import { useState } from "react";
import { saveDelivery } from "@/lib/vertice/actions";
import {
  defaultSections,
  DELIVERY_SECTIONS,
  type DeliveryInput,
  type DeliveryKind,
} from "@/lib/vertice/delivery";
import type { PickerClient } from "./ClientPicker";

/**
 * Editor do termo de entrega.
 *
 * Cada seção é um textarea, não um construtor de campos: o operador é um só, e
 * digitar é mais rápido que clicar em "adicionar item". O texto cru é o que vai
 * para a coluna `input` — reabrir para edição é devolver a string ao textarea, e
 * o parse acontece uma vez só, no servidor.
 */

const SHAPE_HELP: Record<string, { hint: string; placeholder: string; rows: number }> = {
  items: {
    hint: "Um bloco por item, separados por linha em branco. A primeira linha é o nome; as demais viram os marcadores.",
    placeholder:
      "Código-fonte\n- Repositório transferido para a conta do cliente\n- Histórico de commits preservado\n\nBanco de dados\n- Exportação completa, sem recorte de período",
    rows: 12,
  },
  rows: {
    hint: "Uma linha por item, com as colunas separadas por barra vertical: item | onde está | no nome de.",
    placeholder:
      "Repositório | github.com/cliente/loja | Cliente\nServidor | VPS 203.0.113.10 | Cliente\nDomínio | loja.com.br, registrado no Registro.br | Cliente",
    rows: 6,
  },
  lines: {
    hint: "Um item por linha.",
    placeholder:
      "Abrir a loja e navegar por uma categoria e um produto.\nFazer um pedido de teste do início ao fim.",
    rows: 6,
  },
};

const KINDS: { value: DeliveryKind; label: string; help: string }[] = [
  {
    value: "final",
    label: "Entrega final",
    help: "Encerra o serviço e transfere responsabilidade.",
  },
  {
    value: "marco",
    label: "Marco de contrato",
    help: "Uma etapa entregue; o contrato segue em andamento.",
  },
];

export function DeliveryEditor({
  clients,
  defaultClientId,
  initial,
  deliveryId,
  proposalId,
}: {
  clients: PickerClient[];
  defaultClientId: number | null;
  initial: DeliveryInput;
  /** Presente = está editando. A página remonta o componente por `key`. */
  deliveryId?: number | null;
  proposalId?: number | null;
}) {
  const [kind, setKind] = useState<DeliveryKind>(initial.kind);
  const [enabled, setEnabled] = useState<string[]>(initial.enabled);
  const [text, setText] = useState<Record<string, string>>(initial.text);
  const [title, setTitle] = useState(initial.title);
  const [completedAt, setCompletedAt] = useState(initial.completedAt);
  const [summary, setSummary] = useState(initial.summary ?? "");
  const [serviceLabel, setServiceLabel] = useState(initial.registro.serviceLabel);
  const [amount, setAmount] = useState(
    initial.registro.amount === null ? "" : String(initial.registro.amount)
  );
  const [paidAt, setPaidAt] = useState(initial.registro.paidAt ?? "");

  const input: DeliveryInput = {
    kind,
    title,
    completedAt,
    summary: summary.trim() ? summary : null,
    enabled,
    text,
    registro: {
      serviceLabel,
      amount: amount.trim() ? Number(amount) : null,
      paidAt: paidAt || null,
    },
  };

  /** Trocar o tipo redefine quais seções nascem ligadas — é para isso que ele serve. */
  function changeKind(next: DeliveryKind) {
    setKind(next);
    setEnabled(defaultSections(next));
  }

  function toggle(id: string, on: boolean) {
    setEnabled((current) =>
      on ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    );
  }

  return (
    <form action={saveDelivery} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {deliveryId ? <input type="hidden" name="deliveryId" value={deliveryId} /> : null}
      {proposalId ? <input type="hidden" name="proposalId" value={proposalId} /> : null}
      <input type="hidden" name="input" value={JSON.stringify(input)} />

      <div className="space-y-6">
        {DELIVERY_SECTIONS.map((def) => {
          const on = enabled.includes(def.id);
          const help = SHAPE_HELP[def.shape];
          return (
            <fieldset
              key={def.id}
              className={
                on
                  ? "min-w-0 rounded-xl border border-border bg-white p-4 shadow-soft"
                  : "min-w-0 rounded-xl border border-border bg-card p-4"
              }
            >
              <legend className="px-1">
                <span className="flex items-center gap-2 text-sm font-bold text-navy">
                  <input
                    id={`on-${def.id}`}
                    type="checkbox"
                    checked={on}
                    onChange={(event) => toggle(def.id, event.target.checked)}
                    className="h-4 w-4 accent-[hsl(var(--navy))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  />
                  <label htmlFor={`on-${def.id}`}>{def.heading}</label>
                </span>
              </legend>

              <p className="mt-2 text-xs text-muted-foreground">{help.hint}</p>

              <label htmlFor={`text-${def.id}`} className="sr-only">
                Conteúdo de {def.heading}
              </label>
              <textarea
                id={`text-${def.id}`}
                rows={help.rows}
                disabled={!on}
                value={text[def.id] ?? ""}
                onChange={(event) =>
                  setText((current) => ({ ...current, [def.id]: event.target.value }))
                }
                placeholder={help.placeholder}
                className="mt-2 w-full rounded-md border border-border px-3 py-2 font-mono text-sm disabled:bg-card disabled:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              />
            </fieldset>
          );
        })}
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <fieldset className="min-w-0 rounded-xl border border-border bg-white p-4 shadow-soft">
          <legend className="px-1 text-sm font-bold text-navy">Tipo do termo</legend>
          {KINDS.map((option) => (
            <label key={option.value} className="mt-2 flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="kind-radio"
                checked={kind === option.value}
                onChange={() => changeKind(option.value)}
                className="mt-1 h-4 w-4 accent-[hsl(var(--navy))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              />
              <span>
                <span className="font-semibold text-navy">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.help}</span>
              </span>
            </label>
          ))}
          <p className="mt-3 text-xs text-muted-foreground">
            Trocar o tipo religa as seções padrão dele.
          </p>
        </fieldset>

        <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="delivery-title"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Título do termo
            </label>
            <input
              id="delivery-title"
              value={title}
              maxLength={140}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Termo de entrega — Migração do e-commerce"
              className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="delivery-client"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Cliente
            </label>
            <select
              id="delivery-client"
              name="clientId"
              defaultValue={defaultClientId ?? ""}
              required
              className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <option value="">Escolha um cliente…</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="delivery-completed"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Entrega concluída em
            </label>
            <input
              id="delivery-completed"
              type="date"
              value={completedAt}
              onChange={(event) => setCompletedAt(event.target.value)}
              className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="delivery-summary"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Resumo de abertura
            </label>
            <textarea
              id="delivery-summary"
              rows={4}
              maxLength={1200}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Uma frase dizendo onde o trabalho está agora e o que este documento registra."
              className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            />
          </div>
        </div>

        <fieldset className="min-w-0 space-y-3 rounded-xl border border-border bg-white p-4 shadow-soft">
          <legend className="px-1 text-sm font-bold text-navy">Registro</legend>
          <p className="text-xs text-muted-foreground">
            Em branco, o bloco Registro não sai no documento.
          </p>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="delivery-service"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Serviço
            </label>
            <input
              id="delivery-service"
              value={serviceLabel}
              maxLength={160}
              onChange={(event) => setServiceLabel(event.target.value)}
              className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="delivery-amount"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Valor (R$)
            </label>
            <input
              id="delivery-amount"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-32 rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="delivery-paid"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Pagamento recebido em
            </label>
            <input
              id="delivery-paid"
              type="date"
              value={paidAt}
              onChange={(event) => setPaidAt(event.target.value)}
              className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={clients.length === 0}
          className="w-full rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {deliveryId ? "Salvar alterações" : "Salvar termo"}
        </button>

        {deliveryId ? (
          <p className="text-xs text-muted-foreground">
            O link do cliente é o mesmo — quem já recebeu vê a versão corrigida.{" "}
            <Link
              href="/admin/entregas"
              className="font-semibold text-navy underline underline-offset-2"
            >
              Descartar edição
            </Link>
          </p>
        ) : null}

        {clients.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Cadastre um cliente em Onboarding para poder salvar.
          </p>
        ) : null}
      </div>
    </form>
  );
}
