"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { query } from "@/lib/vertice/db";
import { getClient, getProposal } from "./data";
import { buildContractDoc, CONTRACT_MONTHS, type ContractInput, type ContractParty } from "./contract";
import { buildProposalDoc, PROPOSAL_TERMS, PROPOSAL_VALID_DAYS } from "./proposal";
import { buildQuote, isCustomLine, type QuoteLine } from "./quote";
import {
  buildDeliveryDoc,
  defaultSections,
  DELIVERY_SECTIONS,
  type DeliveryInput,
  type DeliveryKind,
} from "./delivery";

/**
 * Slug do link público. 8 caracteres de base64url = 48 bits — o link é curto o
 * suficiente para caber num WhatsApp e imprevisível o suficiente para não ser
 * adivinhado. É ele que autoriza a leitura do documento: quem tem o link, vê.
 */
function docSlug(): string {
  return randomBytes(6).toString("base64url");
}

/**
 * Escritas das telas da Vértice em /admin. O `layout.tsx` de /admin barra quem
 * não tem sessão, mas uma server action é chamada pelo id (um hash legível em
 * `/_next/static`), não pela rota que renderizou o form — um POST direto passa
 * por fora do layout. Por isso cada action chama `requireAdmin()` primeiro.
 *
 * As escritas do cliente (aceitar proposta, aceitar contrato, confirmar
 * recebimento) não moram aqui: as páginas públicas `/p/`, `/c/` e `/e/`
 * continuam no site da Vértice, que tem as próprias actions.
 */
async function requireAdmin(): Promise<void> {
  if (!(await isAuthed())) throw new Error("Sessão expirada — entre de novo em /login.");
}

function requireName(value: unknown): string {
  const name = String(value ?? "").trim();
  if (name.length < 2) throw new Error("Nome do cliente precisa ter pelo menos 2 caracteres.");
  if (name.length > 120) throw new Error("Nome do cliente muito longo (máx. 120 caracteres).");
  return name;
}

function optionalText(value: unknown, max: number): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return text.slice(0, max);
}

export async function createClient(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = requireName(formData.get("name"));
  const segment = optionalText(formData.get("segment"), 80);
  const notes = optionalText(formData.get("notes"), 2000);

  await query("insert into clients (name, segment, notes) values ($1, $2, $3)", [
    name,
    segment,
    notes,
  ]);

  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/precos");
}

export async function deleteClient(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("clientId"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Cliente inválido.");

  // O ON DELETE CASCADE leva o onboarding, as propostas e os termos de entrega
  // junto — inclusive os já confirmados pelo cliente.
  await query("delete from clients where id = $1", [id]);

  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/precos");
}

export async function toggleOnboardingItem(formData: FormData): Promise<void> {
  await requireAdmin();
  const clientId = Number(formData.get("clientId"));
  const serviceId = String(formData.get("serviceId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const done = formData.get("done") === "1";
  const owner = optionalText(formData.get("owner"), 80);

  if (!Number.isInteger(clientId) || clientId <= 0) throw new Error("Cliente inválido.");
  if (!serviceId || !itemId) throw new Error("Item de checklist inválido.");

  await query(
    `insert into onboarding_progress (client_id, service_id, item_id, done, owner, done_at)
          values ($1, $2, $3, $4, $5, case when $4 then now() else null end)
     on conflict (client_id, service_id, item_id)
       do update set done = excluded.done,
                     owner = coalesce(excluded.owner, onboarding_progress.owner),
                     done_at = case when excluded.done then now() else null end`,
    [clientId, serviceId, itemId, done, owner]
  );

  revalidatePath("/admin/onboarding");
}

export async function saveItemNote(formData: FormData): Promise<void> {
  await requireAdmin();
  const clientId = Number(formData.get("clientId"));
  const serviceId = String(formData.get("serviceId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const note = optionalText(formData.get("note"), 500);

  if (!Number.isInteger(clientId) || clientId <= 0) throw new Error("Cliente inválido.");
  if (!serviceId || !itemId) throw new Error("Item de checklist inválido.");

  await query(
    `insert into onboarding_progress (client_id, service_id, item_id, note)
          values ($1, $2, $3, $4)
     on conflict (client_id, service_id, item_id)
       do update set note = excluded.note`,
    [clientId, serviceId, itemId, note]
  );

  revalidatePath("/admin/onboarding");
}

export async function saveProposal(formData: FormData): Promise<void> {
  await requireAdmin();
  const clientId = Number(formData.get("clientId"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw new Error("Escolha um cliente antes de salvar a proposta.");
  }

  let lines: QuoteLine[];
  try {
    const parsed = JSON.parse(String(formData.get("lines") ?? "[]"));
    if (!Array.isArray(parsed)) throw new Error("formato");
    lines = parsed
      .map((line: Record<string, unknown>): QuoteLine => {
        // Linha livre traz `label`; linha de catálogo traz `offerId`.
        if (line?.label !== undefined) {
          return {
            label: String(line.label ?? "").slice(0, 2000),
            qty: Number(line.qty ?? 0),
            unit: String(line.unit ?? "un").slice(0, 20),
            unitPrice: Number(line.unitPrice ?? 0),
            hours: Number(line.hours ?? 0),
            sla: String(line.sla ?? "").slice(0, 60),
          };
        }
        return { offerId: String(line?.offerId ?? ""), qty: Number(line?.qty ?? 0) };
      })
      .filter((line) =>
        isCustomLine(line)
          ? line.label.trim().length > 0 &&
            Number.isFinite(line.qty) &&
            line.qty > 0 &&
            Number.isFinite(line.unitPrice) &&
            line.unitPrice >= 0 &&
            Number.isFinite(line.hours) &&
            line.hours >= 0
          : line.offerId && Number.isFinite(line.qty) && line.qty > 0
      );
  } catch {
    throw new Error("Linhas da proposta em formato inválido.");
  }

  if (lines.length === 0) throw new Error("Proposta sem nenhum serviço selecionado.");

  const client = await getClient(clientId);
  if (!client) throw new Error("Cliente não encontrado.");

  const extra = Number(formData.get("extraDiscount") ?? 0);
  // Recalcula no servidor: o número que vai para o banco não vem do cliente.
  const quote = buildQuote(lines, Number.isFinite(extra) ? extra : 0);

  // Condições desmarcadas chegam como ids, nunca como texto: o builder resolve
  // o texto do padrão dele mesmo, então daqui só dá para TIRAR condição.
  const droppedTerms = String(formData.get("droppedTerms") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, PROPOSAL_TERMS.length);

  // Condição extra é texto livre do dono numa rota autenticada: uma por linha.
  const extraTerms = String(formData.get("extraTerms") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, 8);

  const validDays = Number(formData.get("validDays") ?? PROPOSAL_VALID_DAYS);
  const doc = buildProposalDoc({
    title: optionalText(formData.get("title"), 120) ?? `Proposta ${client.name}`,
    clientName: client.name,
    notes: optionalText(formData.get("notes"), 1200),
    validDays: Number.isFinite(validDays) && validDays > 0 && validDays <= 180 ? validDays : PROPOSAL_VALID_DAYS,
    quote,
    droppedTerms,
    extraTerms,
  });

  const values = [
    clientId,
    JSON.stringify(lines),
    quote.discountPct,
    quote.monthlyFinal,
    quote.oneTimeTotal,
    quote.monthlyCost,
    quote.oneTimeCost,
    docSlug(),
    JSON.stringify(doc),
  ];

  const proposalId = Number(formData.get("proposalId") ?? 0);
  if (Number.isInteger(proposalId) && proposalId > 0) {
    // Edição. Duas decisões que valem a pena ler:
    //
    // `coalesce(slug, $8)` — o slug NÃO é regerado: o link que já foi para o
    // cliente continua abrindo a proposta corrigida. Proposta antiga, salva
    // antes da coluna, ganha um slug aqui.
    //
    // `accepted_at is null` — proposta aceita é acordo fechado; a trava fica no
    // banco, não em JavaScript, pelo mesmo motivo do aceite.
    //
    // `jsonb_array_length(lines) > 0` — proposta sem linhas foi montada fora do
    // simulador (pacote com preço fechado). O simulador não a reconstrói, e
    // salvar por cima trocaria o documento enviado por outro.
    const updated = await query<{ slug: string | null }>(
      `update proposals
          set client_id = $1, lines = $2::jsonb, discount_pct = $3, monthly = $4,
              onetime = $5, monthly_cost = $6, onetime_cost = $7,
              slug = coalesce(slug, $8), doc = $9::jsonb
        where id = $10 and accepted_at is null and jsonb_array_length(lines) > 0
    returning slug`,
      [...values, proposalId]
    );

    if (updated.length === 0) {
      throw new Error(
        "Proposta não encontrada, já aceita ou montada fora do simulador — nenhuma dessas se reescreve por aqui."
      );
    }
  } else {
    await query(
      `insert into proposals (client_id, lines, discount_pct, monthly, onetime, monthly_cost,
                              onetime_cost, slug, doc)
            values ($1, $2::jsonb, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      values
    );
  }

  revalidatePath("/admin/precos");
  revalidatePath("/admin/propostas");
  // Sem isto a proposta some de vista: a lista do cliente só aparece com
  // ?cliente= na URL, e o formulário não mexe na URL. Salvou, vai para a
  // tela onde ela está, com o link pronto para copiar.
  redirect("/admin/propostas");
}

export async function deleteProposal(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("proposalId"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Proposta inválida.");

  await query("delete from proposals where id = $1", [id]);
  revalidatePath("/admin/precos");
  revalidatePath("/admin/propostas");
}

const DELIVERY_KINDS: DeliveryKind[] = ["final", "marco"];

/** Data de formulário: só `YYYY-MM-DD` passa; qualquer outra coisa vira vazio. */
function ymd(value: unknown): string {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

/**
 * O termo chega como um JSON só. Normaliza aqui: `kind` fora da lista cai em
 * `final`, id de seção que não existe é descartado e todo texto vai com teto.
 * `heading` não aparece em lugar nenhum — o builder resolve o título do código.
 */
function parseDeliveryInput(raw: unknown): DeliveryInput {
  const source = (raw ?? {}) as Record<string, unknown>;

  const kind = DELIVERY_KINDS.includes(source.kind as DeliveryKind)
    ? (source.kind as DeliveryKind)
    : "final";

  const sent = Array.isArray(source.enabled) ? (source.enabled as unknown[]).map(String) : null;
  const enabled = sent
    ? DELIVERY_SECTIONS.filter((def) => sent.includes(def.id)).map((def) => def.id)
    : defaultSections(kind);

  const sentText = (source.text ?? {}) as Record<string, unknown>;
  const text: Record<string, string> = {};
  for (const def of DELIVERY_SECTIONS) {
    text[def.id] = String(sentText[def.id] ?? "").slice(0, 6000);
  }

  const registro = (source.registro ?? {}) as Record<string, unknown>;
  const amount = Number(registro.amount);

  return {
    kind,
    title: String(source.title ?? "").trim().slice(0, 140),
    completedAt: ymd(source.completedAt),
    summary: optionalText(source.summary, 1200),
    enabled,
    text,
    registro: {
      serviceLabel: String(registro.serviceLabel ?? "").trim().slice(0, 160),
      amount: Number.isFinite(amount) && amount > 0 ? amount : null,
      paidAt: ymd(registro.paidAt) || null,
    },
  };
}

export async function saveDelivery(formData: FormData): Promise<void> {
  await requireAdmin();
  const clientId = Number(formData.get("clientId"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw new Error("Escolha um cliente antes de salvar o termo.");
  }

  let input: DeliveryInput;
  try {
    input = parseDeliveryInput(JSON.parse(String(formData.get("input") ?? "{}")));
  } catch {
    throw new Error("Termo em formato inválido.");
  }

  const client = await getClient(clientId);
  if (!client) throw new Error("Cliente não encontrado.");

  if (!input.title) input.title = `Termo de entrega — ${client.name}`;

  // O documento é montado no servidor: o que vai para o banco não vem do formulário.
  const doc = buildDeliveryDoc(input, client.name);
  if (doc.sections.length === 0) {
    throw new Error("Termo sem nenhuma seção preenchida — escreva pelo menos o que foi entregue.");
  }

  const proposalIdRaw = Number(formData.get("proposalId"));
  const proposalId = Number.isInteger(proposalIdRaw) && proposalIdRaw > 0 ? proposalIdRaw : null;
  const values = [
    clientId,
    proposalId,
    input.kind,
    JSON.stringify(input),
    JSON.stringify(doc),
  ];

  const deliveryId = Number(formData.get("deliveryId"));
  if (Number.isInteger(deliveryId) && deliveryId > 0) {
    // Duas decisões que valem a leitura, as mesmas de `saveProposal`:
    //
    // o slug NÃO é regerado — o link que já foi para o cliente continua abrindo
    // o termo corrigido;
    //
    // `confirmed_at is null` — termo confirmado é recebimento registrado, e a
    // trava fica no banco, não em JavaScript.
    const updated = await query<{ slug: string }>(
      `update deliveries
          set client_id = $1, proposal_id = $2, kind = $3, input = $4::jsonb, doc = $5::jsonb
        where id = $6 and confirmed_at is null
    returning slug`,
      [...values, deliveryId]
    );

    if (updated.length === 0) {
      throw new Error(
        "Termo não encontrado, ou já confirmado — termo confirmado não se reescreve."
      );
    }
  } else {
    await query(
      `insert into deliveries (client_id, proposal_id, kind, input, doc, slug)
            values ($1, $2, $3, $4::jsonb, $5::jsonb, $6)`,
      [...values, docSlug()]
    );
  }

  revalidatePath("/admin/entregas");
  redirect("/admin/entregas");
}

export async function deleteDelivery(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("deliveryId"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Termo inválido.");

  await query("delete from deliveries where id = $1", [id]);
  revalidatePath("/admin/entregas");
}

/** Parte do contrato: todo campo vira texto com teto, nada além dos cinco. */
function parseParty(raw: unknown): ContractParty {
  const source = (raw ?? {}) as Record<string, unknown>;
  const field = (key: string, max: number) => String(source[key] ?? "").trim().slice(0, max);
  return {
    name: field("name", 160),
    document: field("document", 30),
    address: field("address", 300),
    representative: field("representative", 200),
    email: field("email", 160),
  };
}

function partyFrom(formData: FormData, role: "contratante" | "contratada"): ContractParty {
  return parseParty(
    Object.fromEntries(
      ["name", "document", "address", "representative", "email"].map((key) => [
        key,
        formData.get(`${role}.${key}`),
      ])
    )
  );
}

export async function saveContract(formData: FormData): Promise<void> {
  await requireAdmin();

  // O contrato sempre nasce de uma proposta, relida aqui: escopo e preço não
  // vêm do formulário.
  const proposalId = Number(formData.get("proposalId"));
  const proposal =
    Number.isInteger(proposalId) && proposalId > 0 ? await getProposal(proposalId) : null;
  if (!proposal?.doc) throw new Error("Proposta não encontrada — o contrato nasce de uma proposta salva.");

  const client = await getClient(proposal.client_id);
  if (!client) throw new Error("Cliente não encontrado.");

  const months = Number(formData.get("months"));
  const input: ContractInput = {
    title:
      optionalText(formData.get("title"), 140) ?? `Contrato de prestação de serviços — ${client.name}`,
    contratante: partyFrom(formData, "contratante"),
    contratada: partyFrom(formData, "contratada"),
    startDate: ymd(formData.get("startDate")),
    months: Number.isInteger(months) && months >= 1 && months <= 36 ? months : CONTRACT_MONTHS,
    forum: String(formData.get("forum") ?? "").trim().slice(0, 120),
    payment: String(formData.get("payment") ?? "").slice(0, 3000),
    extra: String(formData.get("extra") ?? "").slice(0, 3000),
  };

  const doc = buildContractDoc(input, proposal.doc, client.name);
  const values = [client.id, proposal.id, JSON.stringify(input), JSON.stringify(doc)];

  const contractId = Number(formData.get("contractId"));
  if (Number.isInteger(contractId) && contractId > 0) {
    // Mesmas travas do termo: o slug não muda, e contrato aceito não se reescreve.
    const updated = await query<{ slug: string }>(
      `update contracts set client_id = $1, proposal_id = $2, input = $3::jsonb, doc = $4::jsonb
        where id = $5 and accepted_at is null
    returning slug`,
      [...values, contractId]
    );
    if (updated.length === 0) {
      throw new Error("Contrato não encontrado, ou já aceito — contrato aceito não se reescreve.");
    }
  } else {
    await query(
      `insert into contracts (client_id, proposal_id, input, doc, slug)
            values ($1, $2, $3::jsonb, $4::jsonb, $5)`,
      [...values, docSlug()]
    );
  }

  revalidatePath("/admin/contratos");
  redirect("/admin/contratos");
}

export async function deleteContract(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("contractId"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Contrato inválido.");

  // A proposta aceita junto com o contrato continua aceita: o aceite aconteceu.
  await query("delete from contracts where id = $1", [id]);
  revalidatePath("/admin/contratos");
}

