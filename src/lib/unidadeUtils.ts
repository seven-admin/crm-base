/**
 * Utilitários para manipulação de unidades
 */

interface UnidadeBase {
  numero: string;
  bloco?: { nome: string } | null;
}

/**
 * Ordena unidades por bloco/quadra e depois por número
 * Usa ordenação natural (Quadra 2 antes de Quadra 10)
 */
export function ordenarUnidadesPorBlocoENumero<T extends UnidadeBase>(unidades: T[]): T[] {
  return [...unidades].sort((a, b) => {
    // 1. Ordenar por nome do bloco (quadra)
    const blocoA = a.bloco?.nome || '';
    const blocoB = b.bloco?.nome || '';
    
    const blocoCompare = blocoA.localeCompare(blocoB, 'pt-BR', { numeric: true });
    if (blocoCompare !== 0) return blocoCompare;
    
    // 2. Ordenar por número da unidade
    return a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true });
  });
}
