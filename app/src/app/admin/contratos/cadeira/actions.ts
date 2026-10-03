"use server";

import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { montarContratoCadeira, type ContratoCadeiraInput } from "@/lib/contrato-cadeira";
import type { PropostaCadeiraDoc } from "@/lib/precos-cadeira";
import { prisma } from "@/lib/prisma";
import type { ContractParty } from "@/lib/vertice/contract";

/**
 * Escritas do contrato de cadeira (spec 020). Chamadas pelo id, por fora do admin/layout.tsx:
 * cada uma confere a sessão primeiro, como as de propostas/actions.ts.
 */

const SESSAO_EXPIRADA = "Sessão expirada — entre de novo em /login.";

/** Campo de texto com teto, como o parseParty da Vértice: cortar é melhor que perder o formulário. */
const texto = (formData: FormData, campo: string, max: number) => String(formData.get(campo) ?? "").trim().slice(0, max);

function parte(formData: FormData, papel: "contratante" | "contratada"): ContractParty {
  return {
    name: texto(formData, `${papel}.name`, 160),
    document: texto(formData, `${papel}.document`, 30),
    address: texto(formData, `${papel}.address`, 300),
    representative: texto(formData, `${papel}.representative`, 200),
    email: texto(formData, `${papel}.email`, 160),
  };
}

function lerInput(formData: FormData): ContratoCadeiraInput {
  const inicio = texto(formData, "inicio", 10);
  return {
    titulo: texto(formData, "titulo", 140),
    contratante: parte(formData, "contratante"),
    contratada: parte(formData, "contratada"),
    inicio: /^\d{4}-\d{2}-\d{2}$/.test(inicio) ? inicio : "",
    foro: texto(formData, "foro", 120),
    pagamento: texto(formData, "pagamento", 2000),
    extra: texto(formData, "extra", 2000),
    subdominios: texto(formData, "subdominios", 2000),
    dominio: texto(formData, "dominio", 2000),
    exclusividade: texto(formData, "exclusividade", 300),
  };
}

export async function salvarContratoCadeira(formData: FormData): Promise<void> {
  if (!(await isAuthed())) throw new Error(SESSAO_EXPIRADA);

  const input = lerInput(formData);
  const contratoId = String(formData.get("contratoId") ?? "");

  if (contratoId) {
    // A proposta vem do contrato, não do formulário: o contrato nunca troca de proposta.
    const atual = await prisma.contratoCadeira.findUnique({
      where: { id: contratoId },
      select: { proposta: { select: { slug: true, doc: true } } },
    });
    if (!atual) throw new Error("Contrato não encontrado — ele pode ter sido excluído.");
    const doc = montarContratoCadeira(
      input,
      { slug: atual.proposta.slug, doc: atual.proposta.doc as PropostaCadeiraDoc },
      new Date(),
    );
    // aceitoEm null: contrato aceito não se reescreve. editadoEm muda, e derruba um aceite que
    // tenha lido a versão anterior (trava otimista, research D5).
    const { count } = await prisma.contratoCadeira.updateMany({
      where: { id: contratoId, aceitoEm: null },
      data: { input, doc, editadoEm: new Date() },
    });
    if (count === 0) throw new Error("Este contrato já foi aceito e não se edita mais.");
  } else {
    const propostaId = String(formData.get("propostaId") ?? "");
    const proposta = propostaId
      ? await prisma.propostaCadeira.findUnique({ where: { id: propostaId }, select: { id: true, slug: true, doc: true } })
      : null;
    if (!proposta) throw new Error("Proposta não encontrada — o contrato nasce de uma proposta guardada.");
    const doc = montarContratoCadeira(input, { slug: proposta.slug, doc: proposta.doc as PropostaCadeiraDoc }, new Date());
    try {
      // ponytail: 48 bits de slug, como a proposta; colisão cai no mesmo unique e o operador salva de novo.
      await prisma.contratoCadeira.create({
        data: { slug: randomBytes(6).toString("base64url"), propostaId: proposta.id, input, doc },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new Error("Esta proposta já tem contrato. Abra-o em Contratos para editar.");
      }
      throw err;
    }
  }

  revalidatePath("/admin/contratos");
  revalidatePath("/admin/propostas");
  redirect("/admin/contratos");
}

export async function excluirContratoCadeira(formData: FormData): Promise<void> {
  if (!(await isAuthed())) throw new Error(SESSAO_EXPIRADA);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Contrato inválido.");
  // aceitoEm null: o aceito é a prova do que foi fechado e não sai pela tela (FR-018).
  // deleteMany: excluir duas vezes (clique duplo, aba velha) não é erro.
  await prisma.contratoCadeira.deleteMany({ where: { id, aceitoEm: null } });
  revalidatePath("/admin/contratos");
  revalidatePath("/admin/propostas");
}
