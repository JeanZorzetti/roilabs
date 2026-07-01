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
