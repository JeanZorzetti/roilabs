import type { ContractParty } from "@/lib/vertice/contract";

/**
 * Qualificação de uma parte do contrato. Dividido entre o contrato da Vértice
 * (/admin/contratos/novo) e o da cadeira (/admin/contratos/cadeira, spec 020):
 * os campos e a regra de pessoa física são os mesmos nos dois.
 */

export const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
export const LABEL = "text-xs font-bold uppercase tracking-wider text-muted-foreground";
export const FIELD = `rounded-md border border-border px-2 py-1.5 text-base sm:text-sm ${FOCUS}`;
export const HINT = "text-xs text-muted-foreground";

export const EMPTY_PARTY: ContractParty = {
  name: "",
  document: "",
  address: "",
  representative: "",
  email: "",
};

const PARTY_FIELDS: {
  key: keyof ContractParty;
  label: string;
  hint: string;
  type?: string;
}[] = [
  { key: "name", label: "Razão social ou nome", hint: "Como está no cartão CNPJ ou no documento." },
  {
    key: "document",
    label: "CNPJ ou CPF",
    hint: "Com 11 dígitos, o contrato trata a parte como pessoa física.",
  },
  { key: "address", label: "Endereço", hint: "Rua, número, bairro, cidade/UF e CEP." },
  {
    key: "representative",
    label: "Representante legal",
    hint: "Nome e CPF de quem assina pela empresa. Pessoa física deixa em branco.",
  },
  { key: "email", label: "E-mail para avisos", type: "email", hint: "Opcional." },
];

export function PartyFields({
  role,
  heading,
  party,
}: {
  role: "contratante" | "contratada";
  heading: string;
  party: ContractParty;
}) {
  return (
    <fieldset className="min-w-0 space-y-3 rounded-xl border border-border bg-white p-4 shadow-soft">
      <legend className="px-1 text-sm font-bold text-navy">{heading}</legend>
      {PARTY_FIELDS.map((field) => {
        const id = `${role}-${field.key}`;
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <label htmlFor={id} className={LABEL}>
              {field.label}
            </label>
            <input
              id={id}
              name={`${role}.${field.key}`}
              type={field.type ?? "text"}
              defaultValue={party[field.key]}
              aria-describedby={`${id}-hint`}
              className={FIELD}
            />
            <p id={`${id}-hint`} className={HINT}>
              {field.hint}
            </p>
          </div>
        );
      })}
    </fieldset>
  );
}
