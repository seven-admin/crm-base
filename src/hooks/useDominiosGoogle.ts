import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type EmpresaDefault = 'seven' | 'arqo' | 'nexa' | 'incorporador' | 'externo';

export interface DominioGoogle {
  id: string;
  dominio: string;
  empresa_default: EmpresaDefault;
  descricao: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TABLE = 'sistema_dominios_google_permitidos' as const;
const KEY = ['dominios-google'];

export function useDominiosGoogle() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE as any)
        .select('*')
        .order('dominio');
      if (error) throw error;
      return (data ?? []) as unknown as DominioGoogle[];
    },
  });
}

function friendlyError(err: any): string {
  const msg = err?.message ?? '';
  if (msg.includes('duplicate key') || msg.includes('unique')) return 'Este domínio já está cadastrado.';
  if (msg.includes('row-level security') || msg.includes('permission')) return 'Você não tem permissão para esta ação.';
  return msg || 'Erro inesperado.';
}

export function useUpsertDominioGoogle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DominioGoogle> & { dominio: string; empresa_default: EmpresaDefault }) => {
      const clean = {
        ...payload,
        dominio: payload.dominio.trim().toLowerCase(),
        descricao: payload.descricao?.trim() || null,
      };
      if (clean.id) {
        const { error } = await supabase.from(TABLE as any).update(clean).eq('id', clean.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(TABLE as any).insert(clean);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ title: 'Domínio salvo com sucesso' });
    },
    onError: (err) => {
      toast({ title: 'Erro ao salvar', description: friendlyError(err), variant: 'destructive' });
    },
  });
}

export function useDeleteDominioGoogle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ title: 'Domínio removido' });
    },
    onError: (err) => {
      toast({ title: 'Erro ao remover', description: friendlyError(err), variant: 'destructive' });
    },
  });
}

export function useToggleDominioGoogleAtivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from(TABLE as any).update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) => {
      toast({ title: 'Erro ao atualizar', description: friendlyError(err), variant: 'destructive' });
    },
  });
}
