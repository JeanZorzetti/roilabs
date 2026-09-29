"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { log } from "@/lib/log";
import { NICHOS, lerNumeroBR } from "@/lib/precificacao";
import { TIPOS_CADEIRA } from "@/lib/entregaveis";
import {
  EXTRAS_MAX,
  extrasForaDoLimite,
  lerAnuidadeManual,
  lerExtras,
  lerTaxaManual,
  montarPropostaCadeira,
} from "@/lib/precos-cadeira";
import { prisma } from "@/lib/prisma";

/**
 * Escritas da proposta de cadeira (spec 019). Uma server action é chamada pelo id, por fora do
 * `admin/layout.tsx`, então cada uma confere a sessão primeiro — mesmo motivo de lib/vertice/actions.ts.
 *
 * Guardar devolve `{ erro }` em vez de lançar: um throw cai no error boundary e apaga a simulação
 * que o operador acabou de montar.
 */

export type EstadoGuardar = { erro: string | null };

const SESSAO_EXPIRADA = "Sessão expirada — entre de novo em /login.";

/** Campo numérico cru do simulador. Inválido ou vazio vale 0, como o `ler` da tela. */
function numero(formData: FormData, campo: string): number {
  const v = lerNumeroBR(String(formData.get(campo) ?? ""));
  return Number.isNaN(v) ? 0 : v;
}

export async function guardarPropostaCadeira(_: EstadoGuardar, formData: FormData): Promise<EstadoGuardar> {
  if (!(await isAuthed())) return { erro: SESSAO_EXPIRADA };

  const paraQuem = String(formData.get("paraQuem") ?? "").trim();
  if (paraQuem.length < 2 || paraQuem.length > 120) {
    return { erro: "Escreva para quem é a proposta (de 2 a 120 caracteres)." };
  }
  const nicho = NICHOS.find((n) => n.id === formData.get("nichoId"));
  if (!nicho) return { erro: "Escolha um nicho da lista antes de guardar." };

  // Só o nicho de % por pedido tem as duas taxas; nos outros os campos nem aparecem.
  const taxaManual =
    nicho.modelo === "percentual"
      ? {
          aquisicao: lerTaxaManual(String(formData.get("aquisicaoManual") ?? "")),
          recorrencia: lerTaxaManual(String(formData.get("recorrenciaManual") ?? "")),
        }
      : undefined;
  if (taxaManual && (Number.isNaN(taxaManual.aquisicao) || Number.isNaN(taxaManual.recorrencia))) {
    return { erro: "A comissão manual vai de 0,1% a 100%. Corrija o campo, ou apague para usar a tabela." };
  }
  const anuidade = lerAnuidadeManual(String(formData.get("anuidade") ?? ""));
  if (Number.isNaN(anuidade)) {
    return { erro: "A anuidade vai de R$ 0 a R$ 1.000.000. Corrija o campo, ou apague para usar a tabela." };
  }
  const tipo = TIPOS_CADEIRA.find((t) => t.id === formData.get("tipoCadeira"));
  if (!tipo) return { erro: "Escolha o tipo de cadeira antes de guardar." };
  const extras = lerExtras(String(formData.get("extras") ?? ""));
  if (extrasForaDoLimite(extras)) {
    return {
      erro: `Os entregáveis extras vão até ${EXTRAS_MAX.itens} itens, com até ${EXTRAS_MAX.caracteres} caracteres cada.`,
    };
  }

  // A conta é refeita aqui: número vindo da tela não é gravado.
  const doc = montarPropostaCadeira(
    {
      nicho,
      pedidosMes: numero(formData, "pedidos"),
      ticket: numero(formData, "ticket"),
      recompra: numero(formData, "recompra") / 100,
      distribuidor: formData.get("distribuidor") === "1",
      assinaturasMes: numero(formData, "assinaturas"),
      mensalidade: numero(formData, "mensalidade"),
      consultasMes: numero(formData, "consultas"),
      valorConsulta: numero(formData, "valorConsulta"),
      taxaManual,
      anuidade,
    },
    paraQuem,
    new Date(),
    tipo,
    extras,
  );

  try {
    // ponytail: 48 bits de slug, colisão é improvável demais para um retry; se um dia acontecer, o
    // unique do banco recusa e o operador só guarda de novo.
    await prisma.propostaCadeira.create({ data: { slug: randomBytes(6).toString("base64url"), doc } });
  } catch (err) {
    log.error({ err: err instanceof Error ? err.message : String(err) }, "propostas: não guardou a proposta de cadeira");
    return { erro: "Não deu para guardar agora. A simulação continua aqui: tente de novo ou copie o resumo." };
  }

  revalidatePath("/admin/propostas");
  redirect("/admin/propostas");
}

export async function excluirPropostaCadeira(formData: FormData): Promise<void> {
  if (!(await isAuthed())) throw new Error(SESSAO_EXPIRADA);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Proposta inválida.");
  // deleteMany: excluir duas vezes (clique duplo, aba velha) não é erro.
  await prisma.propostaCadeira.deleteMany({ where: { id } });
  revalidatePath("/admin/propostas");
}
