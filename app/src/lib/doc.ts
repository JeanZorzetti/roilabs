// CPF/CNPJ — normalização e validação de formato (só dígitos). Puro, sem I/O (010).
// ponytail: valida só o tamanho (CPF 11 / CNPJ 14), não o dígito verificador — é o que a
// spec/contrato pedem ("formato"); upgrade = algoritmo de DV se virar chave de cobrança.

/** Remove tudo que não é dígito. null/undefined → ''. */
export const normalizarDoc = (v: string | null | undefined): string => (v ?? '').replace(/\D/g, '');

/** true se for CPF (11 dígitos) ou CNPJ (14 dígitos). Espera a string já normalizada. */
export const validarDoc = (digits: string): boolean => digits.length === 11 || digits.length === 14;
