// Resolução de credencial de gateway por (gateway, parceiroId) — 012, contrato passo 1.
// O SEGREDO nunca vem do banco: `CredencialGateway.segredoRef` guarda o NOME da env var
// e o valor mora na EasyPanel (Constituição I). Segredo em coluna é segredo num backup,
// num dump de debug e no `select *` de qualquer admin.

import { prisma } from '@/lib/prisma';

export interface CredencialResolvida {
  parceiroId: string;
  gateway: string;
  /** Conta dona da credencial. O passo 4 do contrato confere o pagamento contra ela. */
  contaRef: string;
  /** Segredo de assinatura do webhook daquela conta. */
  segredo: string;
  /** Token de leitura da API do gateway daquela conta (passo 3). */
  token: string;
}

/**
 * O nome da env do token de LEITURA deriva do nome da env do segredo, por convenção.
 *
 * ⚠️ Isto preenche um buraco do `data-model.md` §3: o schema modela `segredoRef` (assinatura)
 * mas não o token de API, e o passo 3 do contrato exige consultar o gateway com a conta DO
 * PARCEIRO — o token global da ROI Labs não enxerga o pagamento dele.
 * ponytail: convenção em vez de coluna nova, porque coluna aqui custaria um SEGUNDO
 * `db push` manual no host. Teto: se algum parceiro precisar de um par que não siga o
 * padrão, aí vira coluna `tokenRef` — e é uma migração, não um remendo.
 */
export function nomeEnvToken(segredoRef: string): string {
  return segredoRef.replace(/^WEBHOOK_SECRET_/, 'GATEWAY_TOKEN_');
}

/** Lê a env pelo NOME. Vazia conta como ausente — env em branco na EasyPanel é o caso comum. */
export function lerEnv(nome: string): string | null {
  const v = process.env[nome];
  return v && v.trim() ? v : null;
}

/**
 * Passo 1 do contrato. `null` ⇒ 404 (sem ler o corpo): credencial inexistente, inativa, ou
 * com env não publicada. Os três são a mesma resposta de propósito — distinguir na resposta
 * diria a quem sonda qual dos três é, e nenhum deles é recuperável pelo remetente.
 */
export async function resolverCredencial(
  gateway: string,
  parceiroId: string,
): Promise<CredencialResolvida | null> {
  const cred = await prisma.credencialGateway.findFirst({
    where: { gateway, parceiroId, ativo: true },
  });
  if (!cred) return null;

  const segredo = lerEnv(cred.segredoRef);
  const token = lerEnv(nomeEnvToken(cred.segredoRef));
  if (!segredo || !token) return null;

  return { parceiroId: cred.parceiroId, gateway: cred.gateway, contaRef: cred.contaRef, segredo, token };
}
