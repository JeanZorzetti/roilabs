// Estado de ocupação de uma Cadeira, derivado dos Parceiros ligados a ela (D6, 007).
// Não duplica um campo em Cadeira — calculado por consulta a cada carregamento.

export type Ocupacao = 'ocupada' | 'prospeccao' | 'aberta';

export interface ParceiroOcupacao {
  estagio: string;
  contratoEm: Date | string | null;
}

/** ocupada: algum parceiro com contrato assinado · prospeccao: sondagem/ativa sem contrato · aberta: nenhum. */
export function derivarOcupacao(parceiros: ParceiroOcupacao[]): Ocupacao {
  if (parceiros.some((p) => p.contratoEm !== null)) return 'ocupada';
  if (parceiros.some((p) => p.estagio === 'sondagem' || p.estagio === 'ativa')) return 'prospeccao';
  return 'aberta';
}

// ─────────────────────────────────────────────────────────────────────────────
// 012: exibição de `Cadeira.estado` — o campo que a MÁQUINA lê.
//
// 🚨 NÃO use `derivarOcupacao` acima para dizer se uma cadeira está ocupada numa TELA.
// Aquela é a régua do SUCCESS FEE (existe parceiro externo com contrato?), e ela responde
// 'aberta' para toda cadeira `daCasa` — que por definição nunca terá um Parceiro. Numa tela
// de curadoria isso lê como "cadeira livre" e esconde a carteira inteira: até 18/08/2026 o
// /admin/cadeiras mostrava "Aberta" na Atma, Polaris e Estetia, todas `ocupada-vendavel`.
// A única que ficava verde era a Tapepro, o único parceiro externo do mapa.
//
// Régua de exibição de ocupação = `estado`. Régua de success fee = `derivarOcupacao`.
// O dashboard (/admin) usa as duas de propósito e diz qual é qual; esta tela usa `estado`.
// ─────────────────────────────────────────────────────────────────────────────

export const ESTADO_LABEL: Record<string, string> = {
  vaga: 'Vaga',
  'em-preparacao': 'Em preparação',
  'ocupada-sem-produto': 'Ocupada · sem produto',
  // ⚠️ "vendável", não "vendendo": `estado` é a marca da CURADORIA, não prova de que o
  // dinheiro entra. Quem decide isso é `decidirCheckout` (produto + gateway ligado).
  'ocupada-vendavel': 'Ocupada · vendável',
};

export const ESTADO_COLOR: Record<string, string> = {
  vaga: '#6b7280',
  'em-preparacao': '#92400e',
  'ocupada-sem-produto': '#92400e',
  'ocupada-vendavel': '#166534',
};

/**
 * Rótulo de `estado`. Estado desconhecido devolve o valor CRU, nunca um default bonito:
 * cair em "Vaga" mostraria cadeira ocupada como livre — o defeito que este módulo conserta.
 */
export function rotuloEstado(estado: string): string {
  return ESTADO_LABEL[estado] ?? estado;
}
