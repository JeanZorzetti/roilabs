// Parse/validação de uma taxa de success fee (fração [0,1]). Caminho de dinheiro, usado
// pelas rotas de parceiro — uma fonte só evita drift (010, FR-010: barra o typo `1` = 100%).

export const ERR = Symbol('taxa-invalida');

/** '', null, undefined → null (não informado). Fora de [0,1] ou não-número → ERR. Senão o número. */
export function parseTaxa(v: unknown): number | null | typeof ERR {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : ERR;
}
