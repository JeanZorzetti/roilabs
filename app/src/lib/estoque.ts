// Estoque por SKU de variação (015 D4/D5, data-model.md §5). Catálogo é arquivo; ESTADO
// mora no banco, porque arquivo não debita.
import { prisma } from './prisma';

/** Posição de estoque de uma cadeira, para a vitrine marcar esgotado. SKU sem linha
 * simplesmente não aparece no mapa — falha fechada do lado de quem lê. */
export async function listarEstoque(cadeira: string): Promise<Record<string, number>> {
  const linhas = await prisma.estoqueVariacao.findMany({
    where: { cadeira },
    select: { sku: true, quantidade: true },
  });
  return Object.fromEntries(linhas.map((l) => [l.sku, l.quantidade]));
}
