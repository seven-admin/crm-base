import { supabase } from '@/integrations/supabase/client';

/**
 * Busca IDs dos clientes "COMPRADOR HISTÓRICO" para exclusão em queries.
 */
export async function getClientesHistoricosIds(): Promise<string[]> {
  const { data } = await supabase
    .from('clientes')
    .select('id')
    .ilike('nome', '%COMPRADOR HISTÓRICO%');
  return (data || []).map(c => c.id);
}

/**
 * Filtra resultados que possuem join com cliente, removendo compradores históricos.
 */
export function filterCompradorHistorico<T extends { cliente?: { nome?: string | null } | null }>(
  items: T[]
): T[] {
  return items.filter(
    item => !item.cliente?.nome?.toUpperCase().includes('COMPRADOR HISTÓRICO')
  );
}
